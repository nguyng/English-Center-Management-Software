from datetime import date, datetime, timedelta, timezone
from decimal import Decimal
from typing import Any, Dict, List, Optional
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.constants import ExamFormat, StudentStatus, UserRole, ZaloMessageType, ZaloMessageStatus
from app.core.exceptions import (
    BusinessRuleViolationException,
    ForbiddenException,
    ResourceNotFoundException
)
from app.core.security import create_access_token, decode_access_token
from app.models.center import TrungTam
from app.models.exam import BaiKiemTra, CauHoi
from app.models.result import KetQua
from app.models.session import BuoiHoc
from app.models.student import HocSinh
from app.models.user import NguoiDung
from app.models.zalo_log import NhatKyZalo
from app.schemas.exam import (
    ExamCreate,
    ExamOut,
    ExamPinVerifyIn,
    ExamPinVerifyOut,
    ExamPublicOut,
    ExamSubmitIn,
    ExamTeacherDetailOut,
    QuestionIn,
    QuestionPublicOut,
    QuestionTeacherOut,
    StudentExamStatusOut
)
from app.services.zalo.factory import ZaloProviderFactory

# In-memory store for rate limiting failed PIN attempts: { "exam_id:client_ip": [datetime, ...] }
_pin_attempts: Dict[str, List[datetime]] = {}

def calculate_rank(score: float) -> str:
    if score >= 9.0:
        return "Xuất sắc"
    elif score >= 8.0:
        return "Giỏi"
    elif score >= 6.5:
        return "Khá"
    elif score >= 5.0:
        return "Trung bình"
    return "Yếu"

def check_exam_timing(exam: BaiKiemTra) -> None:
    """Validate server time against exam date and fixed time window."""
    if not exam.ngay_kiem_tra:
        return
    now = datetime.now()
    today = now.date()

    if today < exam.ngay_kiem_tra:
        raise BusinessRuleViolationException(
            f"Chưa đến ngày thi! Ngày thi: {exam.ngay_kiem_tra.strftime('%d/%m/%Y')}",
            error_code="EXAM_NOT_STARTED"
        )
    if today > exam.ngay_kiem_tra:
        raise BusinessRuleViolationException(
            f"Bài thi đã kết thúc vào ngày {exam.ngay_kiem_tra.strftime('%d/%m/%Y')}!",
            error_code="EXAM_CLOSED"
        )

    # Only enforce if at least one time boundary is configured
    if not exam.gio_mo_de and not exam.gio_dong_de:
        return

    current_time_str = now.strftime("%H:%M")
    open_time = exam.gio_mo_de or "00:00"
    close_time = exam.gio_dong_de or "23:59"

    if close_time >= open_time:
        if current_time_str < open_time:
            raise BusinessRuleViolationException(
                f"Chưa đến giờ mở đề thi! Giờ mở đề: {open_time}",
                error_code="EXAM_NOT_STARTED"
            )
        if current_time_str > close_time:
            raise BusinessRuleViolationException(
                f"Đã hết giờ làm bài! Cổng thi đã đóng lúc {close_time}",
                error_code="EXAM_CLOSED"
            )
    else:
        # Cross midnight schedule
        if close_time < current_time_str < open_time:
            raise BusinessRuleViolationException(
                f"Chưa đến giờ mở đề thi! Giờ mở đề: {open_time}",
                error_code="EXAM_NOT_STARTED"
            )

class ExamService:
    @staticmethod
    async def create_exam(db: AsyncSession, tenant_id: int, data: ExamCreate) -> ExamOut:
        exam_date = data.ngay_kiem_tra or date.today()
        exam = BaiKiemTra(
            trung_tam_id=tenant_id,
            buoi_hoc_id=data.buoi_hoc_id,
            ten_bai_kiem_tra=data.ten_bai_kiem_tra.strip(),
            hinh_thuc=data.hinh_thuc,
            ngay_kiem_tra=exam_date,
            thoi_gian_phut=data.thoi_gian_phut,
            gio_mo_de=data.gio_mo_de or "08:00",
            gio_dong_de=data.gio_dong_de or "22:00",
            ma_vao_thi=data.ma_vao_thi or "1234"
        )
        db.add(exam)
        await db.flush()

        q_count = 0
        if data.questions:
            for idx, q_in in enumerate(data.questions, start=1):
                order_num = q_in.thu_tu if q_in.thu_tu else idx
                q_obj = CauHoi(
                    bai_kiem_tra_id=exam.id,
                    thu_tu=order_num,
                    noi_dung=q_in.noi_dung.strip(),
                    dap_an_a=q_in.dap_an_a.strip(),
                    dap_an_b=q_in.dap_an_b.strip(),
                    dap_an_c=q_in.dap_an_c.strip(),
                    dap_an_d=q_in.dap_an_d.strip(),
                    dap_an_dung=q_in.dap_an_dung.strip().upper()
                )
                db.add(q_obj)
            q_count = len(data.questions)

        await db.commit()
        await db.refresh(exam)

        return ExamOut(
            id=exam.id,
            ten_bai_kiem_tra=exam.ten_bai_kiem_tra,
            hinh_thuc=exam.hinh_thuc,
            thoi_gian_phut=exam.thoi_gian_phut,
            ngay_kiem_tra=exam.ngay_kiem_tra,
            gio_mo_de=exam.gio_mo_de,
            gio_dong_de=exam.gio_dong_de,
            ma_vao_thi=exam.ma_vao_thi,
            buoi_hoc_id=exam.buoi_hoc_id,
            so_cau_hoi=q_count
        )

    @staticmethod
    async def get_exams(
        db: AsyncSession,
        tenant_id: int,
        buoi_hoc_id: Optional[int] = None
    ) -> List[ExamOut]:
        query = select(BaiKiemTra).options(
            selectinload(BaiKiemTra.questions)
        ).where(BaiKiemTra.trung_tam_id == tenant_id)

        if buoi_hoc_id:
            query = query.where(BaiKiemTra.buoi_hoc_id == buoi_hoc_id)

        query = query.order_by(BaiKiemTra.id.desc())
        result = await db.execute(query)
        exams = result.scalars().all()

        return [
            ExamOut(
                id=e.id,
                ten_bai_kiem_tra=e.ten_bai_kiem_tra,
                hinh_thuc=e.hinh_thuc,
                thoi_gian_phut=e.thoi_gian_phut,
                ngay_kiem_tra=e.ngay_kiem_tra,
                gio_mo_de=e.gio_mo_de,
                gio_dong_de=e.gio_dong_de,
                ma_vao_thi=e.ma_vao_thi,
                buoi_hoc_id=e.buoi_hoc_id,
                so_cau_hoi=len(e.questions)
            )
            for e in exams
        ]

    @staticmethod
    async def get_exam_public(db: AsyncSession, exam_id: int) -> ExamPublicOut:
        """PUBLIC ENDPOINT FOR STUDENTS:
        STRICT REQUIREMENT: MUST EXCLUDE dap_an_dung AND ma_vao_thi TO PREVENT LEAKS.
        """
        query = select(BaiKiemTra).options(
            selectinload(BaiKiemTra.questions),
            selectinload(BaiKiemTra.session)
        ).where(BaiKiemTra.id == exam_id)

        result = await db.execute(query)
        exam = result.scalar_one_or_none()
        if not exam:
            raise ResourceNotFoundException(f"Không tìm thấy bài thi có ID {exam_id}")

        # Fetch students for student name dropdown
        students = []
        if exam.session and exam.session.lop_id:
            stu_query = select(HocSinh).where(
                HocSinh.lop_id == exam.session.lop_id,
                HocSinh.trang_thai == StudentStatus.STUDYING.value
            ).order_by(HocSinh.ho_ten.asc())
            stu_res = await db.execute(stu_query)
            students = [
                {"id": s.id, "ho_ten": s.ho_ten}
                for s in stu_res.scalars().all()
            ]

        # Map questions without dap_an_dung
        public_questions = [
            QuestionPublicOut(
                id=q.id,
                thu_tu=q.thu_tu,
                noi_dung=q.noi_dung,
                dap_an_a=q.dap_an_a,
                dap_an_b=q.dap_an_b,
                dap_an_c=q.dap_an_c,
                dap_an_d=q.dap_an_d
            )
            for q in sorted(exam.questions, key=lambda x: x.thu_tu)
        ]

        return ExamPublicOut(
            id=exam.id,
            ten_bai_kiem_tra=exam.ten_bai_kiem_tra,
            hinh_thuc=exam.hinh_thuc,
            thoi_gian_phut=exam.thoi_gian_phut,
            ngay_kiem_tra=exam.ngay_kiem_tra,
            gio_mo_de=exam.gio_mo_de,
            gio_dong_de=exam.gio_dong_de,
            questions=public_questions,
            students=students
        )

    @staticmethod
    async def verify_pin(
        db: AsyncSession,
        exam_id: int,
        data: ExamPinVerifyIn,
        client_ip: str = "default"
    ) -> Dict[str, Any]:
        """Verify exam PIN and issue a short-lived exam access token."""
        query = select(BaiKiemTra).where(BaiKiemTra.id == exam_id)
        result = await db.execute(query)
        exam = result.scalar_one_or_none()
        if not exam:
            raise ResourceNotFoundException(f"Không tìm thấy bài thi có ID {exam_id}")

        # Rate limiting: maximum 5 failed attempts per 5 minutes
        now = datetime.now()
        rate_key = f"{exam_id}:{client_ip}"
        recent_failures = [
            t for t in _pin_attempts.get(rate_key, [])
            if (now - t).total_seconds() < 300
        ]
        _pin_attempts[rate_key] = recent_failures

        if len(recent_failures) >= 5:
            raise BusinessRuleViolationException(
                "Bạn đã nhập sai mã PIN quá 5 lần. Vui lòng thử lại sau 5 phút.",
                error_code="PIN_RATE_LIMITED"
            )

        # Check exam timing
        check_exam_timing(exam)

        # Compare PIN
        expected_pin = (exam.ma_vao_thi or "1234").strip()
        provided_pin = data.ma_vao_thi.strip()

        if provided_pin != expected_pin:
            _pin_attempts.setdefault(rate_key, []).append(now)
            raise BusinessRuleViolationException(
                "Mã vào thi không chính xác! Vui lòng hỏi lại giáo viên.",
                error_code="INVALID_EXAM_PIN"
            )

        # Correct PIN: Clear failed attempts
        _pin_attempts.pop(rate_key, None)

        # Issue exam access token
        payload = {
            "type": "exam_access",
            "exam_id": exam.id,
            "hoc_sinh_id": data.hoc_sinh_id,
            "exp": datetime.now(timezone.utc) + timedelta(hours=3)
        }
        token = create_access_token(payload)

        return {
            "exam_token": token,
            "exam_id": exam.id,
            "hoc_sinh_id": data.hoc_sinh_id,
            "expires_in": 10800
        }

    @staticmethod
    async def get_exam_teacher_detail(
        db: AsyncSession,
        tenant_id: int,
        current_user: NguoiDung,
        exam_id: int
    ) -> ExamTeacherDetailOut:
        """TEACHER & ADMIN DETAIL ENDPOINT:
        Returns exam questions WITH dap_an_dung, studying students, and submission statuses.
        """
        query = select(BaiKiemTra).options(
            selectinload(BaiKiemTra.questions),
            selectinload(BaiKiemTra.session).selectinload(BuoiHoc.class_room)
        ).where(BaiKiemTra.id == exam_id)

        result = await db.execute(query)
        exam = result.scalar_one_or_none()
        if not exam:
            raise ResourceNotFoundException(f"Không tìm thấy bài thi có ID {exam_id}")

        # Multi-tenant check
        if current_user.vai_tro != UserRole.SUPER_ADMIN.value and exam.trung_tam_id != tenant_id:
            raise ResourceNotFoundException(f"Không tìm thấy bài thi có ID {exam_id}")

        # Teacher scoped access check
        if current_user.vai_tro == UserRole.TEACHER.value:
            is_primary = bool(
                exam.session
                and exam.session.class_room
                and exam.session.class_room.giao_vien_id == current_user.id
            )
            is_sub = bool(
                exam.session
                and exam.session.giao_vien_day_thay_id == current_user.id
            )
            if not (is_primary or is_sub):
                raise ForbiddenException("Bạn không phụ trách lớp chứa đề thi này")

        # Questions WITH dap_an_dung
        teacher_questions = [
            QuestionTeacherOut(
                id=q.id,
                thu_tu=q.thu_tu,
                noi_dung=q.noi_dung,
                dap_an_a=q.dap_an_a,
                dap_an_b=q.dap_an_b,
                dap_an_c=q.dap_an_c,
                dap_an_d=q.dap_an_d,
                dap_an_dung=q.dap_an_dung
            )
            for q in sorted(exam.questions, key=lambda x: x.thu_tu)
        ]

        # Fetch studying students
        class_id = exam.session.lop_id if exam.session else None
        ten_lop = exam.session.class_room.ten_lop if (exam.session and exam.session.class_room) else None

        students_status_list: List[StudentExamStatusOut] = []
        if class_id:
            stu_query = select(HocSinh).where(
                HocSinh.lop_id == class_id,
                HocSinh.trang_thai == StudentStatus.STUDYING.value
            ).order_by(HocSinh.ho_ten.asc())
            stu_res = await db.execute(stu_query)
            studying_students = stu_res.scalars().all()

            # Existing results
            res_query = select(KetQua).where(KetQua.bai_kiem_tra_id == exam_id)
            res_rows = await db.execute(res_query)
            results_by_stu = {r.hoc_sinh_id: r for r in res_rows.scalars().all()}

            for stu in studying_students:
                r = results_by_stu.get(stu.id)
                if r:
                    correct_count = 0
                    if r.chi_tiet_tra_loi and isinstance(r.chi_tiet_tra_loi, dict):
                        correct_count = sum(
                            1 for v in r.chi_tiet_tra_loi.values()
                            if isinstance(v, dict) and v.get("is_correct")
                        )
                    students_status_list.append(
                        StudentExamStatusOut(
                            hoc_sinh_id=stu.id,
                            ho_ten=stu.ho_ten,
                            submitted=True,
                            diem_so=float(r.diem_so),
                            so_cau_dung=correct_count,
                            xep_loai=calculate_rank(float(r.diem_so)),
                            thoi_gian_nop=r.thoi_gian_nop,
                            so_lan_roi_tab=r.so_lan_roi_tab,
                            chi_tiet_tra_loi=r.chi_tiet_tra_loi
                        )
                    )
                else:
                    students_status_list.append(
                        StudentExamStatusOut(
                            hoc_sinh_id=stu.id,
                            ho_ten=stu.ho_ten,
                            submitted=False
                        )
                    )

        return ExamTeacherDetailOut(
            id=exam.id,
            ten_bai_kiem_tra=exam.ten_bai_kiem_tra,
            hinh_thuc=exam.hinh_thuc,
            thoi_gian_phut=exam.thoi_gian_phut,
            ngay_kiem_tra=exam.ngay_kiem_tra,
            gio_mo_de=exam.gio_mo_de,
            gio_dong_de=exam.gio_dong_de,
            ma_vao_thi=exam.ma_vao_thi,
            buoi_hoc_id=exam.buoi_hoc_id,
            lop_id=class_id,
            ten_lop=ten_lop,
            questions=teacher_questions,
            students=students_status_list
        )

    @staticmethod
    async def send_zalo_results(
        db: AsyncSession,
        tenant_id: int,
        current_user: NguoiDung,
        exam_id: int
    ) -> Dict[str, Any]:
        """Send Zalo ZNS exam score notifications to students who completed the exam."""
        query = select(BaiKiemTra).options(
            selectinload(BaiKiemTra.session).selectinload(BuoiHoc.class_room)
        ).where(BaiKiemTra.id == exam_id)

        result = await db.execute(query)
        exam = result.scalar_one_or_none()
        if not exam:
            raise ResourceNotFoundException(f"Không tìm thấy bài thi có ID {exam_id}")

        if current_user.vai_tro != UserRole.SUPER_ADMIN.value and exam.trung_tam_id != tenant_id:
            raise ResourceNotFoundException(f"Không tìm thấy bài thi có ID {exam_id}")

        if current_user.vai_tro == UserRole.TEACHER.value:
            is_primary = bool(
                exam.session
                and exam.session.class_room
                and exam.session.class_room.giao_vien_id == current_user.id
            )
            is_sub = bool(
                exam.session
                and exam.session.giao_vien_day_thay_id == current_user.id
            )
            if not (is_primary or is_sub):
                raise ForbiddenException("Bạn không phụ trách lớp chứa đề thi này")

        # Fetch completed exam results
        res_query = select(KetQua).options(
            selectinload(KetQua.student)
        ).where(
            KetQua.bai_kiem_tra_id == exam_id,
            KetQua.trung_tam_id == tenant_id
        )
        res_exec = await db.execute(res_query)
        completed_results = res_exec.scalars().all()

        if not completed_results:
            return {
                "total_eligible": 0,
                "sent": 0,
                "skipped_already_sent": 0,
                "failed": 0,
                "details": []
            }

        session = exam.session
        if not session:
            return {
                "total_eligible": len(completed_results),
                "sent": 0,
                "skipped_already_sent": 0,
                "failed": len(completed_results),
                "details": [{"error": "Bài thi không gắn với ca học nào"}]
            }

        center = await db.get(TrungTam, tenant_id)
        provider = ZaloProviderFactory.get_provider(center)

        total_eligible = len(completed_results)
        sent = 0
        skipped = 0
        failed = 0
        details: List[Dict[str, Any]] = []

        for r in completed_results:
            student = r.student
            if not student:
                continue

            try:
                res = await provider.send_score_notice(
                    db=db,
                    center=center,
                    student=student,
                    session=session,
                    exam_name=exam.ten_bai_kiem_tra,
                    score=float(r.diem_so),
                    rank=calculate_rank(float(r.diem_so))
                )
                if res.get("status") == "skipped":
                    skipped += 1
                    details.append({
                        "student_id": student.id,
                        "student_name": student.ho_ten,
                        "status": "skipped",
                        "reason": res.get("reason", "Đã gửi thông báo điểm trước đó")
                    })
                elif res.get("status") in ["success", "demo"]:
                    sent += 1
                    details.append({
                        "student_id": student.id,
                        "student_name": student.ho_ten,
                        "status": "sent",
                        "phone": student.sdt_phu_huynh
                    })
                else:
                    failed += 1
                    details.append({
                        "student_id": student.id,
                        "student_name": student.ho_ten,
                        "status": "failed",
                        "error": res.get("error", "Gửi tin nhắn thất bại")
                    })
            except Exception as e:
                failed += 1
                details.append({
                    "student_id": student.id,
                    "student_name": student.ho_ten,
                    "status": "failed",
                    "error": str(e)
                })

        await db.commit()

        return {
            "total_eligible": total_eligible,
            "sent": sent,
            "skipped_already_sent": skipped,
            "failed": failed,
            "details": details
        }

    @staticmethod
    async def add_questions(
        db: AsyncSession,
        tenant_id: int,
        exam_id: int,
        questions: List[QuestionIn]
    ) -> ExamOut:
        query = select(BaiKiemTra).options(
            selectinload(BaiKiemTra.questions)
        ).where(BaiKiemTra.id == exam_id, BaiKiemTra.trung_tam_id == tenant_id)
        result = await db.execute(query)
        exam = result.scalar_one_or_none()
        if not exam:
            raise ResourceNotFoundException(f"Không tìm thấy bài thi có ID {exam_id}")

        start_order = len(exam.questions) + 1
        for idx, q_in in enumerate(questions, start=start_order):
            order_num = q_in.thu_tu if q_in.thu_tu else idx
            q_obj = CauHoi(
                bai_kiem_tra_id=exam.id,
                thu_tu=order_num,
                noi_dung=q_in.noi_dung.strip(),
                dap_an_a=q_in.dap_an_a.strip(),
                dap_an_b=q_in.dap_an_b.strip(),
                dap_an_c=q_in.dap_an_c.strip(),
                dap_an_d=q_in.dap_an_d.strip(),
                dap_an_dung=q_in.dap_an_dung.strip().upper()
            )
            db.add(q_obj)

        await db.commit()
        await db.refresh(exam)

        return ExamOut(
            id=exam.id,
            ten_bai_kiem_tra=exam.ten_bai_kiem_tra,
            hinh_thuc=exam.hinh_thuc,
            thoi_gian_phut=exam.thoi_gian_phut,
            ngay_kiem_tra=exam.ngay_kiem_tra,
            gio_mo_de=exam.gio_mo_de,
            gio_dong_de=exam.gio_dong_de,
            ma_vao_thi=exam.ma_vao_thi,
            buoi_hoc_id=exam.buoi_hoc_id,
            so_cau_hoi=len(exam.questions) + len(questions)
        )

    @staticmethod
    async def submit_exam(
        db: AsyncSession,
        exam_id: int,
        data: ExamSubmitIn,
        current_user: Optional[NguoiDung] = None
    ) -> Dict[str, Any]:
        """Submit exam answers.
        Supports both REAL submission (saves KetQua, anti-cheat, PIN verification)
        and PREVIEW submission (for teachers/admins to test grading without modifying DB).
        """
        # 1. Fetch Exam and Questions
        query = select(BaiKiemTra).options(
            selectinload(BaiKiemTra.questions),
            selectinload(BaiKiemTra.session).selectinload(BuoiHoc.class_room)
        ).where(BaiKiemTra.id == exam_id)
        result = await db.execute(query)
        exam = result.scalar_one_or_none()
        if not exam:
            raise ResourceNotFoundException(f"Không tìm thấy bài thi có ID {exam_id}")

        total_questions = len(exam.questions)
        if total_questions == 0:
            raise BusinessRuleViolationException("Đề thi chưa có câu hỏi nào để chấm điểm!")

        # ---------------------------------------------------------
        # CHẾ ĐỘ PREVIEW (GIÁO VIÊN / ADMIN XEM THỬ)
        # ---------------------------------------------------------
        if data.is_preview:
            # Enforce authentication: must be logged-in teacher or admin
            if not current_user:
                raise ForbiddenException(
                    "Chế độ xem thử chỉ dành cho Giáo viên hoặc Quản trị viên đã đăng nhập!",
                    error_code="PREVIEW_UNAUTHORIZED"
                )

            if current_user.vai_tro not in [
                UserRole.ADMIN.value,
                UserRole.SUPER_ADMIN.value,
                UserRole.TEACHER.value
            ]:
                raise ForbiddenException("Không có quyền sử dụng chế độ xem thử!")

            if current_user.vai_tro != UserRole.SUPER_ADMIN.value and current_user.trung_tam_id != exam.trung_tam_id:
                raise ForbiddenException("Đề thi thuộc trung tâm khác!")

            if current_user.vai_tro == UserRole.TEACHER.value:
                is_primary = bool(
                    exam.session
                    and exam.session.class_room
                    and exam.session.class_room.giao_vien_id == current_user.id
                )
                is_sub = bool(
                    exam.session
                    and exam.session.giao_vien_day_thay_id == current_user.id
                )
                if not (is_primary or is_sub):
                    raise ForbiddenException("Bạn không phụ trách lớp chứa đề thi này!")

            # Grade without saving to DB
            correct_count = 0
            detailed_answers = {}
            for q in exam.questions:
                student_ans = data.answers.get(str(q.id), "").strip().upper()
                is_correct = (student_ans == q.dap_an_dung.upper())
                if is_correct:
                    correct_count += 1
                detailed_answers[str(q.id)] = {
                    "selected": student_ans,
                    "is_correct": is_correct
                }

            raw_score = (correct_count / total_questions) * 10.0
            final_score = round(raw_score, 1)
            rank = calculate_rank(final_score)

            return {
                "diem_so": final_score,
                "so_cau_dung": correct_count,
                "tong_cau": total_questions,
                "xep_loai": rank,
                "so_lan_roi_tab": data.tab_violations,
                "thoi_gian_nop": datetime.now(timezone.utc).isoformat(),
                "is_preview": True
            }

        # ---------------------------------------------------------
        # CHẾ ĐỘ THI THẬT (HỌC SINH THI)
        # ---------------------------------------------------------
        if not data.hoc_sinh_id:
            raise BusinessRuleViolationException(
                "Vui lòng cung cấp mã định danh học sinh (hoc_sinh_id) khi nộp bài thi thật!"
            )

        # 2. PIN verification check
        if exam.ma_vao_thi:
            if data.exam_token:
                try:
                    payload = decode_access_token(data.exam_token)
                except Exception:
                    raise BusinessRuleViolationException(
                        "Mã xác thực thi không hợp lệ hoặc đã hết hạn",
                        error_code="INVALID_EXAM_TOKEN"
                    )
                if payload.get("type") != "exam_access":
                    raise BusinessRuleViolationException(
                        "Loại token thi không hợp lệ",
                        error_code="INVALID_EXAM_TOKEN"
                    )
                if payload.get("exam_id") != exam_id:
                    raise BusinessRuleViolationException(
                        "Mã xác thực không thuộc bài thi này",
                        error_code="EXAM_TOKEN_MISMATCH"
                    )
                if payload.get("hoc_sinh_id") and payload["hoc_sinh_id"] != data.hoc_sinh_id:
                    raise BusinessRuleViolationException(
                        "Mã xác thực thi không khớp với học sinh nộp bài",
                        error_code="STUDENT_TOKEN_MISMATCH"
                    )
            elif data.ma_vao_thi:
                if data.ma_vao_thi.strip() != exam.ma_vao_thi.strip():
                    raise BusinessRuleViolationException(
                        "Mã vào thi không chính xác!",
                        error_code="INVALID_EXAM_PIN"
                    )
            else:
                raise BusinessRuleViolationException(
                    "Yêu cầu xác thực mã PIN phòng thi trước khi nộp bài!",
                    error_code="PIN_REQUIRED"
                )

        # 3. Fixed Exam Time Check
        check_exam_timing(exam)

        # 4. Check student exists
        student = await db.get(HocSinh, data.hoc_sinh_id)
        if not student:
            raise ResourceNotFoundException(f"Không tìm thấy học sinh có ID {data.hoc_sinh_id}")

        # 5. ANTI-DUPLICATE SUBMISSION CHECK
        existing_result_query = select(KetQua).where(
            KetQua.bai_kiem_tra_id == exam_id,
            KetQua.hoc_sinh_id == data.hoc_sinh_id
        )
        ex_res = await db.execute(existing_result_query)
        if ex_res.scalar_one_or_none():
            raise BusinessRuleViolationException(
                "Bạn đã hoàn thành bài thi này rồi! Hệ thống không cho phép nộp lại lần hai.",
                error_code="EXAM_ALREADY_SUBMITTED"
            )

        # 6. Auto-grading: Compare student answers against dap_an_dung
        correct_count = 0
        detailed_answers = {}

        for q in exam.questions:
            student_ans = data.answers.get(str(q.id), "").strip().upper()
            is_correct = (student_ans == q.dap_an_dung.upper())
            if is_correct:
                correct_count += 1
            detailed_answers[str(q.id)] = {
                "selected": student_ans,
                "is_correct": is_correct
            }

        # Formula: round((correct / total) * 10, 1)
        raw_score = (correct_count / total_questions) * 10.0
        final_score = round(raw_score, 1)
        rank = calculate_rank(final_score)

        # 7. Save KetQua to DB
        ket_qua = KetQua(
            trung_tam_id=exam.trung_tam_id,
            bai_kiem_tra_id=exam_id,
            hoc_sinh_id=data.hoc_sinh_id,
            diem_so=Decimal(str(final_score)),
            so_lan_roi_tab=data.tab_violations,
            chi_tiet_tra_loi=detailed_answers,
            thoi_gian_nop=datetime.now(timezone.utc)
        )
        db.add(ket_qua)
        await db.commit()
        await db.refresh(ket_qua)

        return {
            "diem_so": final_score,
            "so_cau_dung": correct_count,
            "tong_cau": total_questions,
            "xep_loai": rank,
            "so_lan_roi_tab": data.tab_violations,
            "thoi_gian_nop": ket_qua.thoi_gian_nop.isoformat(),
            "is_preview": False
        }

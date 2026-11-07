from datetime import date, datetime, timezone
from decimal import Decimal
from typing import Any, Dict, List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.constants import ExamFormat, StudentStatus
from app.core.exceptions import (
    BusinessRuleViolationException,
    DuplicateResourceException,
    ResourceNotFoundException
)
from app.models.exam import BaiKiemTra, CauHoi
from app.models.result import KetQua
from app.models.session import BuoiHoc
from app.models.student import HocSinh
from app.schemas.exam import (
    ExamCreate,
    ExamOut,
    ExamPublicOut,
    ExamSubmitIn,
    QuestionIn,
    QuestionPublicOut
)

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
            thoi_gian_phut=data.thoi_gian_phut
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
                buoi_hoc_id=e.buoi_hoc_id,
                so_cau_hoi=len(e.questions)
            )
            for e in exams
        ]

    @staticmethod
    async def get_exam_public(db: AsyncSession, exam_id: int) -> ExamPublicOut:
        """PUBLIC ENDPOINT FOR STUDENTS:
        STRICT REQUIREMENT: MUST EXCLUDE dap_an_dung TO PREVENT LEAKS.
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
            questions=public_questions,
            students=students
        )

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
            buoi_hoc_id=exam.buoi_hoc_id,
            so_cau_hoi=len(exam.questions) + len(questions)
        )

    @staticmethod
    async def submit_exam(
        db: AsyncSession,
        exam_id: int,
        data: ExamSubmitIn
    ) -> Dict[str, Any]:
        # 1. Fetch Exam and Questions
        query = select(BaiKiemTra).options(
            selectinload(BaiKiemTra.questions)
        ).where(BaiKiemTra.id == exam_id)
        result = await db.execute(query)
        exam = result.scalar_one_or_none()
        if not exam:
            raise ResourceNotFoundException(f"Không tìm thấy bài thi có ID {exam_id}")

        # 2. Check student exists
        student = await db.get(HocSinh, data.hoc_sinh_id)
        if not student:
            raise ResourceNotFoundException(f"Không tìm thấy học sinh có ID {data.hoc_sinh_id}")

        # 3. ANTI-DUPLICATE SUBMISSION CHECK
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

        # 4. Auto-grading: Compare student answers against dap_an_dung
        total_questions = len(exam.questions)
        if total_questions == 0:
            raise BusinessRuleViolationException("Đề thi chưa có câu hỏi nào để chấm điểm!")

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

        # 5. Save KetQua
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
            "thoi_gian_nop": ket_qua.thoi_gian_nop.isoformat()
        }


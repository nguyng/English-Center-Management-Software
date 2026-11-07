from datetime import datetime, timezone
from decimal import Decimal
from typing import Any, Dict, List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.constants import (
    AttendanceState,
    ExamFormat,
    SessionAttendanceStatus,
    StudentStatus,
    UserRole
)
from app.core.exceptions import (
    BusinessRuleViolationException,
    ForbiddenException,
    ResourceNotFoundException
)
from app.models.attendance import DiemDanh
from app.models.exam import BaiKiemTra
from app.models.result import KetQua
from app.models.session import BuoiHoc
from app.models.student import HocSinh
from app.models.user import NguoiDung
from app.schemas.attendance import (
    AttendanceSaveIn,
    AttendanceSessionDetailOut,
    AttendanceStudentItem
)
from app.schemas.session import SessionOut

class AttendanceService:
    @staticmethod
    async def get_attendance_list(
        db: AsyncSession,
        tenant_id: int,
        current_user: NguoiDung,
        session_id: int
    ) -> AttendanceSessionDetailOut:
        # 1. Fetch Session
        query = select(BuoiHoc).options(
            selectinload(BuoiHoc.class_room),
            selectinload(BuoiHoc.substitute_teacher),
            selectinload(BuoiHoc.attendances)
        ).where(BuoiHoc.id == session_id, BuoiHoc.trung_tam_id == tenant_id)

        result = await db.execute(query)
        s = result.scalar_one_or_none()
        if not s:
            raise ResourceNotFoundException(f"Không tìm thấy buổi học có ID {session_id}")

        if current_user.vai_tro == UserRole.TEACHER.value:
            is_primary = s.class_room and s.class_room.giao_vien_id == current_user.id
            is_sub = s.giao_vien_day_thay_id == current_user.id
            if not (is_primary or is_sub):
                raise ForbiddenException("Bạn không phụ trách ca học này")

        # 2. Fetch only Studying students (DangHoc)
        stu_query = select(HocSinh).where(
            HocSinh.lop_id == s.lop_id,
            HocSinh.trung_tam_id == tenant_id,
            HocSinh.trang_thai == StudentStatus.STUDYING.value
        ).order_by(HocSinh.ho_ten.asc())

        stu_res = await db.execute(stu_query)
        students = stu_res.scalars().all()

        # Map existing attendances
        att_map = {a.hoc_sinh_id: a for a in s.attendances}

        # Check if session has a paper exam to fetch paper scores
        paper_exam_res = await db.execute(
            select(BaiKiemTra).where(
                BaiKiemTra.buoi_hoc_id == session_id,
                BaiKiemTra.hinh_thuc == ExamFormat.PAPER.value
            )
        )
        paper_exam = paper_exam_res.scalar_one_or_none()
        score_map = {}
        if paper_exam:
            results_res = await db.execute(
                select(KetQua).where(KetQua.bai_kiem_tra_id == paper_exam.id)
            )
            for r in results_res.scalars().all():
                score_map[r.hoc_sinh_id] = float(r.diem_so)

        student_items = []
        for stu in students:
            existing_att = att_map.get(stu.id)
            status_val = existing_att.trang_thai if existing_att else AttendanceState.PRESENT.value
            note_val = existing_att.ghi_chu if existing_att else None
            student_items.append(
                AttendanceStudentItem(
                    id=stu.id,
                    ho_ten=stu.ho_ten,
                    sdt_phu_huynh=stu.sdt_phu_huynh,
                    trang_thai=status_val,
                    ghi_chu=note_val,
                    diem_thi_giay=score_map.get(stu.id)
                )
            )

        session_dict = {
            "id": s.id,
            "lop_id": s.lop_id,
            "lop": s.class_room.ten_lop if s.class_room else "",
            "ma_lop": s.class_room.ma_lop if s.class_room else "",
            "ngay_hoc": s.ngay_hoc,
            "ca_hoc": s.ca_hoc,
            "gio_bat_dau": s.gio_bat_dau.strftime("%H:%M"),
            "gio_ket_thuc": s.gio_ket_thuc.strftime("%H:%M"),
            "co_kiem_tra": s.co_kiem_tra,
            "da_gui": s.da_gui,
            "trang_thai_diem_danh": s.trang_thai_diem_danh,
            "trang_thai_buoi_hoc": s.trang_thai_buoi_hoc
        }

        return AttendanceSessionDetailOut(
            session=session_dict,
            students=student_items
        )

    @staticmethod
    async def save_attendance(
        db: AsyncSession,
        tenant_id: int,
        current_user: NguoiDung,
        session_id: int,
        data: AttendanceSaveIn
    ) -> Dict[str, Any]:
        query = select(BuoiHoc).options(
            selectinload(BuoiHoc.class_room),
            selectinload(BuoiHoc.attendances)
        ).where(BuoiHoc.id == session_id, BuoiHoc.trung_tam_id == tenant_id)

        result = await db.execute(query)
        s = result.scalar_one_or_none()
        if not s:
            raise ResourceNotFoundException(f"Không tìm thấy buổi học có ID {session_id}")

        if current_user.vai_tro == UserRole.TEACHER.value:
            is_primary = s.class_room and s.class_room.giao_vien_id == current_user.id
            is_sub = s.giao_vien_day_thay_id == current_user.id
            if not (is_primary or is_sub):
                raise ForbiddenException("Bạn không phụ trách ca học này")

        # Map existing attendances
        existing_att = {a.hoc_sinh_id: a for a in s.attendances}

        count_absent = 0
        count_present = 0

        # Process Attendance Mapping
        for sid_str, state_val in data.attendance.items():
            try:
                sid = int(sid_str)
            except ValueError:
                continue

            state = AttendanceState.ABSENT.value if state_val == AttendanceState.ABSENT.value else AttendanceState.PRESENT.value
            if state == AttendanceState.ABSENT.value:
                count_absent += 1
            else:
                count_present += 1

            if sid in existing_att:
                existing_att[sid].trang_thai = state
            else:
                new_att = DiemDanh(
                    trung_tam_id=tenant_id,
                    buoi_hoc_id=session_id,
                    hoc_sinh_id=sid,
                    trang_thai=state
                )
                db.add(new_att)

        s.trang_thai_diem_danh = SessionAttendanceStatus.TAKEN.value

        # Process optional paper exam scores
        if data.scores:
            # Check or create paper exam
            paper_exam_res = await db.execute(
                select(BaiKiemTra).where(
                    BaiKiemTra.buoi_hoc_id == session_id,
                    BaiKiemTra.hinh_thuc == ExamFormat.PAPER.value
                )
            )
            paper_exam = paper_exam_res.scalar_one_or_none()
            if not paper_exam:
                paper_exam = BaiKiemTra(
                    trung_tam_id=tenant_id,
                    buoi_hoc_id=session_id,
                    ten_bai_kiem_tra=f"Bài kiểm tra giấy - {s.class_room.ten_lop}",
                    hinh_thuc=ExamFormat.PAPER.value,
                    ngay_kiem_tra=s.ngay_hoc,
                    thoi_gian_phut=15
                )
                db.add(paper_exam)
                await db.flush()

            # Existing results
            existing_results_res = await db.execute(
                select(KetQua).where(KetQua.bai_kiem_tra_id == paper_exam.id)
            )
            existing_results = {r.hoc_sinh_id: r for r in existing_results_res.scalars().all()}

            for sid_str, score_val in data.scores.items():
                if score_val is None:
                    continue
                try:
                    sid = int(sid_str)
                except ValueError:
                    continue

                # Block absent students from having scores
                current_state = data.attendance.get(sid_str, AttendanceState.PRESENT.value)
                if current_state == AttendanceState.ABSENT.value:
                    raise BusinessRuleViolationException(
                        f"Không thể nhập điểm cho học sinh ID {sid} vì học sinh này vắng học!"
                    )

                clean_score = round(Decimal(str(score_val)), 1)
                if clean_score < Decimal("0.0") or clean_score > Decimal("10.0"):
                    raise BusinessRuleViolationException(
                        f"Điểm số của học sinh ID {sid} phải từ 0.0 đến 10.0"
                    )

                if sid in existing_results:
                    existing_results[sid].diem_so = clean_score
                    existing_results[sid].diem_thu_cong = clean_score
                else:
                    new_result = KetQua(
                        trung_tam_id=tenant_id,
                        bai_kiem_tra_id=paper_exam.id,
                        hoc_sinh_id=sid,
                        diem_so=clean_score,
                        diem_thu_cong=clean_score,
                        so_lan_roi_tab=0,
                        thoi_gian_nop=datetime.now(timezone.utc)
                    )
                    db.add(new_result)

        await db.commit()

        # Handle Immediate Zalo Sending if sendZalo == True
        sent_zalo = False
        if data.sendZalo:
            from app.services.dispatcher_service import DispatcherService
            await DispatcherService.dispatch_session_notifications(db, session_id)
            s.da_gui = True
            await db.commit()
            sent_zalo = True

        return {
            "success": True,
            "session_id": session_id,
            "count_absent": count_absent,
            "count_present": count_present,
            "sent_zalo": sent_zalo
        }


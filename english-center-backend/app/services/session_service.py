from datetime import date
from typing import Any, Dict, List, Optional
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.constants import SessionAttendanceStatus, SessionStatus, UserRole
from app.core.exceptions import (
    BusinessRuleViolationException,
    ForbiddenException,
    ResourceNotFoundException
)
from app.models.attendance import DiemDanh
from app.models.class_room import LopHoc
from app.models.exam import BaiKiemTra
from app.models.result import KetQua
from app.models.session import BuoiHoc
from app.models.user import NguoiDung
from app.models.zalo_log import NhatKyZalo
from app.schemas.session import SessionCreate, SessionOut

class SessionService:
    @staticmethod
    async def get_all(
        db: AsyncSession,
        tenant_id: int,
        current_user: NguoiDung,
        session_date: Optional[date] = None,
        class_id: Optional[int] = None
    ) -> List[SessionOut]:
        query = select(BuoiHoc).options(
            selectinload(BuoiHoc.class_room).selectinload(LopHoc.teacher),
            selectinload(BuoiHoc.substitute_teacher)
        ).where(BuoiHoc.trung_tam_id == tenant_id)

        # Scoped access for Teacher: primary or substitute
        if current_user.vai_tro == UserRole.TEACHER.value:
            query = query.join(BuoiHoc.class_room).where(
                (LopHoc.giao_vien_id == current_user.id) | (BuoiHoc.giao_vien_day_thay_id == current_user.id)
            )

        if session_date:
            query = query.where(BuoiHoc.ngay_hoc == session_date)

        if class_id:
            query = query.where(BuoiHoc.lop_id == class_id)

        query = query.order_by(BuoiHoc.ngay_hoc.desc(), BuoiHoc.gio_bat_dau.asc())
        result = await db.execute(query)
        sessions = result.scalars().all()

        return [
            SessionOut(
                id=s.id,
                lop_id=s.lop_id,
                lop=s.class_room.ten_lop if s.class_room else "Chưa phân lớp",
                ma_lop=s.class_room.ma_lop if s.class_room else "",
                ngay_hoc=s.ngay_hoc,
                ca_hoc=s.ca_hoc,
                gio_bat_dau=s.gio_bat_dau.strftime("%H:%M"),
                gio_ket_thuc=s.gio_ket_thuc.strftime("%H:%M"),
                giao_vien=(
                    s.substitute_teacher.ho_ten
                    if s.substitute_teacher
                    else (s.class_room.teacher.ho_ten if s.class_room and s.class_room.teacher else "Chưa phân công")
                ),
                co_kiem_tra=s.co_kiem_tra,
                da_gui=s.da_gui,
                trang_thai_diem_danh=s.trang_thai_diem_danh,
                trang_thai_buoi_hoc=s.trang_thai_buoi_hoc,
                ly_do_huy=s.ly_do_huy
            )
            for s in sessions
        ]

    @staticmethod
    async def get_by_id(
        db: AsyncSession,
        tenant_id: int,
        current_user: NguoiDung,
        session_id: int
    ) -> SessionOut:
        query = select(BuoiHoc).options(
            selectinload(BuoiHoc.class_room).selectinload(LopHoc.teacher),
            selectinload(BuoiHoc.substitute_teacher)
        ).where(BuoiHoc.id == session_id, BuoiHoc.trung_tam_id == tenant_id)

        result = await db.execute(query)
        s = result.scalar_one_or_none()
        if not s:
            raise ResourceNotFoundException(f"Không tìm thấy buổi học có ID {session_id}")

        if current_user.vai_tro == UserRole.TEACHER.value:
            is_primary = s.class_room and s.class_room.giao_vien_id == current_user.id
            is_sub = s.giao_vien_day_thay_id == current_user.id
            if not (is_primary or is_sub):
                raise ResourceNotFoundException(f"Không tìm thấy buổi học có ID {session_id}")

        return SessionOut(
            id=s.id,
            lop_id=s.lop_id,
            lop=s.class_room.ten_lop if s.class_room else "",
            ma_lop=s.class_room.ma_lop if s.class_room else "",
            ngay_hoc=s.ngay_hoc,
            ca_hoc=s.ca_hoc,
            gio_bat_dau=s.gio_bat_dau.strftime("%H:%M"),
            gio_ket_thuc=s.gio_ket_thuc.strftime("%H:%M"),
            giao_vien=(
                s.substitute_teacher.ho_ten
                if s.substitute_teacher
                else (s.class_room.teacher.ho_ten if s.class_room and s.class_room.teacher else "Chưa phân công")
            ),
            co_kiem_tra=s.co_kiem_tra,
            da_gui=s.da_gui,
            trang_thai_diem_danh=s.trang_thai_diem_danh,
            trang_thai_buoi_hoc=s.trang_thai_buoi_hoc,
            ly_do_huy=s.ly_do_huy
        )

    @staticmethod
    async def create(db: AsyncSession, tenant_id: int, data: SessionCreate) -> SessionOut:
        class_query = select(LopHoc).options(
            selectinload(LopHoc.teacher)
        ).where(LopHoc.id == data.lop_id, LopHoc.trung_tam_id == tenant_id)
        c_res = await db.execute(class_query)
        class_room = c_res.scalar_one_or_none()
        if not class_room:
            raise ResourceNotFoundException(f"Lớp học ID {data.lop_id} không tồn tại")

        from datetime import time as dt_time
        def parse_time(time_str: str) -> dt_time:
            parts = [int(p) for p in time_str.split(":")]
            if len(parts) == 2:
                return dt_time(parts[0], parts[1])
            return dt_time(parts[0], parts[1], parts[2])

        start_time = parse_time(data.gio_bat_dau)
        end_time = parse_time(data.gio_ket_thuc)

        new_session = BuoiHoc(
            trung_tam_id=tenant_id,
            lop_id=data.lop_id,
            ngay_hoc=data.ngay_hoc,
            ca_hoc=data.ca_hoc.strip(),
            gio_bat_dau=start_time,
            gio_ket_thuc=end_time,
            co_kiem_tra=data.co_kiem_tra,
            da_gui=False,
            trang_thai_diem_danh=SessionAttendanceStatus.NOT_TAKEN.value,
            trang_thai_buoi_hoc=SessionStatus.NORMAL.value
        )
        db.add(new_session)
        await db.commit()
        await db.refresh(new_session)

        return SessionOut(
            id=new_session.id,
            lop_id=new_session.lop_id,
            lop=class_room.ten_lop,
            ma_lop=class_room.ma_lop,
            ngay_hoc=new_session.ngay_hoc,
            ca_hoc=new_session.ca_hoc,
            gio_bat_dau=new_session.gio_bat_dau.strftime("%H:%M"),
            gio_ket_thuc=new_session.gio_ket_thuc.strftime("%H:%M"),
            giao_vien=class_room.teacher.ho_ten if class_room.teacher else "Chưa phân công",
            co_kiem_tra=new_session.co_kiem_tra,
            da_gui=new_session.da_gui,
            trang_thai_diem_danh=new_session.trang_thai_diem_danh,
            trang_thai_buoi_hoc=new_session.trang_thai_buoi_hoc,
            ly_do_huy=new_session.ly_do_huy
        )

    @staticmethod
    async def cancel_session(
        db: AsyncSession,
        tenant_id: int,
        session_id: int,
        reason: Optional[str] = "Hủy buổi học",
        cancel_status: Optional[str] = SessionStatus.CANCELLED.value
    ) -> SessionOut:
        query = select(BuoiHoc).options(
            selectinload(BuoiHoc.class_room).selectinload(LopHoc.teacher),
            selectinload(BuoiHoc.substitute_teacher)
        ).where(BuoiHoc.id == session_id, BuoiHoc.trung_tam_id == tenant_id)
        result = await db.execute(query)
        s = result.scalar_one_or_none()
        if not s:
            raise ResourceNotFoundException(f"Không tìm thấy buổi học có ID {session_id}")

        target_status = cancel_status or SessionStatus.CANCELLED.value
        if target_status not in [SessionStatus.CANCELLED.value, SessionStatus.HOLIDAY.value]:
            raise BusinessRuleViolationException(
                f"Trạng thái không hợp lệ: '{target_status}'. Chỉ chấp nhận 'DaHuy' hoặc 'NghiLe'."
            )

        s.trang_thai_buoi_hoc = target_status
        s.ly_do_huy = reason.strip() if reason else ("Nghỉ lễ" if target_status == SessionStatus.HOLIDAY.value else "Hủy buổi học")
        await db.commit()
        await db.refresh(s)

        return SessionOut(
            id=s.id,
            lop_id=s.lop_id,
            lop=s.class_room.ten_lop if s.class_room else "",
            ma_lop=s.class_room.ma_lop if s.class_room else "",
            ngay_hoc=s.ngay_hoc,
            ca_hoc=s.ca_hoc,
            gio_bat_dau=s.gio_bat_dau.strftime("%H:%M"),
            gio_ket_thuc=s.gio_ket_thuc.strftime("%H:%M"),
            giao_vien=(
                s.substitute_teacher.ho_ten
                if s.substitute_teacher
                else (s.class_room.teacher.ho_ten if s.class_room and s.class_room.teacher else "Chưa phân công")
            ),
            co_kiem_tra=s.co_kiem_tra,
            da_gui=s.da_gui,
            trang_thai_diem_danh=s.trang_thai_diem_danh,
            trang_thai_buoi_hoc=s.trang_thai_buoi_hoc,
            ly_do_huy=s.ly_do_huy
        )

    @staticmethod
    async def delete_session(
        db: AsyncSession,
        tenant_id: int,
        current_user: NguoiDung,
        session_id: int
    ) -> Dict[str, Any]:
        """Safely delete an accidentally created session.
        Only Admin / SuperAdmin can delete.
        Fails if session already has attendance data, exam results, or Zalo history.
        """
        if current_user.vai_tro not in [UserRole.ADMIN.value, UserRole.SUPER_ADMIN.value]:
            raise ForbiddenException("Chỉ Quản trị viên mới có quyền xóa ca học")

        query = select(BuoiHoc).where(BuoiHoc.id == session_id)
        if current_user.vai_tro != UserRole.SUPER_ADMIN.value:
            query = query.where(BuoiHoc.trung_tam_id == tenant_id)

        result = await db.execute(query)
        s = result.scalar_one_or_none()
        if not s:
            raise ResourceNotFoundException(f"Không tìm thấy buổi học có ID {session_id}")

        # Check if attendance is already taken
        if s.trang_thai_diem_danh == SessionAttendanceStatus.TAKEN.value:
            raise BusinessRuleViolationException(
                "Không thể xóa ca học đã hoàn tất điểm danh. Vui lòng sử dụng tính năng Hủy ca học.",
                error_code="SESSION_HAS_ATTENDANCE"
            )

        att_count = await db.scalar(
            select(func.count(DiemDanh.id)).where(DiemDanh.buoi_hoc_id == session_id)
        )
        if att_count and att_count > 0:
            raise BusinessRuleViolationException(
                "Không thể xóa ca học đã có dữ liệu điểm danh. Vui lòng sử dụng tính năng Hủy ca học.",
                error_code="SESSION_HAS_ATTENDANCE"
            )

        # Check if any exam results exist
        exam_ids_res = await db.execute(
            select(BaiKiemTra.id).where(BaiKiemTra.buoi_hoc_id == session_id)
        )
        exam_ids = exam_ids_res.scalars().all()
        if exam_ids:
            res_count = await db.scalar(
                select(func.count(KetQua.id)).where(KetQua.bai_kiem_tra_id.in_(exam_ids))
            )
            if res_count and res_count > 0:
                raise BusinessRuleViolationException(
                    "Không thể xóa ca học đã có kết quả bài thi của học sinh. Vui lòng sử dụng tính năng Hủy ca học.",
                    error_code="SESSION_HAS_EXAM_RESULTS"
                )

        # Check if any Zalo logs exist
        zalo_count = await db.scalar(
            select(func.count(NhatKyZalo.id)).where(NhatKyZalo.buoi_hoc_id == session_id)
        )
        if zalo_count and zalo_count > 0:
            raise BusinessRuleViolationException(
                "Không thể xóa ca học đã có lịch sử gửi tin nhắn Zalo.",
                error_code="SESSION_HAS_ZALO_LOGS"
            )

        # Safe to delete
        await db.delete(s)
        await db.commit()
        return {"id": session_id, "message": "Xóa ca học thành công"}

    @staticmethod
    async def substitute_teacher(db: AsyncSession, tenant_id: int, session_id: int, teacher_id: int) -> SessionOut:
        query = select(BuoiHoc).options(
            selectinload(BuoiHoc.class_room).selectinload(LopHoc.teacher),
            selectinload(BuoiHoc.substitute_teacher)
        ).where(BuoiHoc.id == session_id, BuoiHoc.trung_tam_id == tenant_id)
        result = await db.execute(query)
        s = result.scalar_one_or_none()
        if not s:
            raise ResourceNotFoundException(f"Không tìm thấy buổi học có ID {session_id}")

        t_res = await db.execute(
            select(NguoiDung).where(
                NguoiDung.id == teacher_id,
                NguoiDung.trung_tam_id == tenant_id,
                NguoiDung.vai_tro == UserRole.TEACHER.value
            )
        )
        teacher = t_res.scalar_one_or_none()
        if not teacher:
            raise ResourceNotFoundException("Giáo viên dạy thay không tồn tại")

        s.giao_vien_day_thay_id = teacher_id
        await db.commit()
        await db.refresh(s)

        return SessionOut(
            id=s.id,
            lop_id=s.lop_id,
            lop=s.class_room.ten_lop if s.class_room else "",
            ma_lop=s.class_room.ma_lop if s.class_room else "",
            ngay_hoc=s.ngay_hoc,
            ca_hoc=s.ca_hoc,
            gio_bat_dau=s.gio_bat_dau.strftime("%H:%M"),
            gio_ket_thuc=s.gio_ket_thuc.strftime("%H:%M"),
            giao_vien=teacher.ho_ten,
            co_kiem_tra=s.co_kiem_tra,
            da_gui=s.da_gui,
            trang_thai_diem_danh=s.trang_thai_diem_danh,
            trang_thai_buoi_hoc=s.trang_thai_buoi_hoc,
            ly_do_huy=s.ly_do_huy
        )

    @staticmethod
    async def confirm_attendance(db: AsyncSession, tenant_id: int, current_user: NguoiDung, session_id: int) -> SessionOut:
        query = select(BuoiHoc).options(
            selectinload(BuoiHoc.class_room).selectinload(LopHoc.teacher),
            selectinload(BuoiHoc.substitute_teacher)
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

        s.trang_thai_diem_danh = SessionAttendanceStatus.TAKEN.value
        await db.commit()
        await db.refresh(s)

        return SessionOut(
            id=s.id,
            lop_id=s.lop_id,
            lop=s.class_room.ten_lop if s.class_room else "",
            ma_lop=s.class_room.ma_lop if s.class_room else "",
            ngay_hoc=s.ngay_hoc,
            ca_hoc=s.ca_hoc,
            gio_bat_dau=s.gio_bat_dau.strftime("%H:%M"),
            gio_ket_thuc=s.gio_ket_thuc.strftime("%H:%M"),
            giao_vien=(
                s.substitute_teacher.ho_ten
                if s.substitute_teacher
                else (s.class_room.teacher.ho_ten if s.class_room and s.class_room.teacher else "Chưa phân công")
            ),
            co_kiem_tra=s.co_kiem_tra,
            da_gui=s.da_gui,
            trang_thai_diem_danh=s.trang_thai_diem_danh,
            trang_thai_buoi_hoc=s.trang_thai_buoi_hoc,
            ly_do_huy=s.ly_do_huy
        )


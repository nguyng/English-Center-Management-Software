from datetime import date
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_tenant_id, get_current_user, get_db
from app.core.constants import (
    SessionAttendanceStatus,
    SessionStatus,
    StudentStatus,
    UserRole
)
from app.models.class_room import LopHoc
from app.models.session import BuoiHoc
from app.models.student import HocSinh
from app.models.user import NguoiDung
from app.models.zalo_log import NhatKyZalo
from app.schemas.common import GenericResponse
from app.schemas.dashboard import AttendanceAlertItem, DashboardStatsOut

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/stats", response_model=GenericResponse[DashboardStatsOut])
async def get_dashboard_stats(
    tenant_id: int = Depends(get_current_tenant_id),
    current_user: NguoiDung = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # 1. Total studying students
    q_students = select(func.count(HocSinh.id)).where(
        HocSinh.trung_tam_id == tenant_id,
        HocSinh.trang_thai == StudentStatus.STUDYING.value
    )
    res_students = await db.execute(q_students)
    total_students = res_students.scalar() or 0

    # 2. Total classes
    q_classes = select(func.count(LopHoc.id)).where(LopHoc.trung_tam_id == tenant_id)
    res_classes = await db.execute(q_classes)
    total_classes = res_classes.scalar() or 0

    # 3. Total active teachers
    q_teachers = select(func.count(NguoiDung.id)).where(
        NguoiDung.trung_tam_id == tenant_id,
        NguoiDung.vai_tro == UserRole.TEACHER.value
    )
    res_teachers = await db.execute(q_teachers)
    total_teachers = res_teachers.scalar() or 0

    # 4. Total messages sent this month
    today = date.today()
    q_messages = select(func.count(NhatKyZalo.id)).where(
        NhatKyZalo.trung_tam_id == tenant_id,
        func.extract("year", NhatKyZalo.thoi_gian_gui) == today.year,
        func.extract("month", NhatKyZalo.thoi_gian_gui) == today.month
    )
    res_messages = await db.execute(q_messages)
    total_messages = res_messages.scalar() or 0

    stats = DashboardStatsOut(
        totalStudents=total_students,
        totalClasses=total_classes,
        totalTeachers=total_teachers,
        totalMessagesSent=total_messages
    )
    return GenericResponse(success=True, data=stats, message="Thống kê tổng quan")

@router.get("/alerts", response_model=GenericResponse[List[AttendanceAlertItem]])
async def get_dashboard_alerts(
    tenant_id: int = Depends(get_current_tenant_id),
    current_user: NguoiDung = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List of sessions today whose attendance has NOT been taken yet."""
    today = date.today()
    query = select(BuoiHoc).options(
        selectinload(BuoiHoc.class_room).selectinload(LopHoc.teacher),
        selectinload(BuoiHoc.substitute_teacher)
    ).where(
        BuoiHoc.trung_tam_id == tenant_id,
        BuoiHoc.ngay_hoc == today,
        BuoiHoc.trang_thai_buoi_hoc == SessionStatus.NORMAL.value,
        BuoiHoc.trang_thai_diem_danh == SessionAttendanceStatus.NOT_TAKEN.value
    ).order_by(BuoiHoc.gio_bat_dau.asc())

    result = await db.execute(query)
    sessions = result.scalars().all()

    alerts = []
    for s in sessions:
        gv_name = (
            s.substitute_teacher.ho_ten
            if s.substitute_teacher
            else (s.class_room.teacher.ho_ten if s.class_room and s.class_room.teacher else "Chưa phân công")
        )
        alerts.append(
            AttendanceAlertItem(
                id=s.id,
                lop=s.class_room.ten_lop if s.class_room else "Lớp học",
                giao_vien=gv_name,
                ca=s.ca_hoc,
                ca_hoc=s.ca_hoc,
                gio_bat_dau=s.gio_bat_dau.strftime("%H:%M"),
                gio_ket_thuc=s.gio_ket_thuc.strftime("%H:%M"),
                ngay_hoc=s.ngay_hoc,
                trang_thai="chua_diem_danh"
            )
        )

    return GenericResponse(success=True, data=alerts, message="Danh sách ca học chưa điểm danh")


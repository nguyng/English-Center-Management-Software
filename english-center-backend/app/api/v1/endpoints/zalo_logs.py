from datetime import date, datetime, timedelta, timezone
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_tenant_id, get_current_user, get_db
from app.core.constants import ZaloMessageStatus
from app.models.class_room import LopHoc
from app.models.session import BuoiHoc
from app.models.student import HocSinh
from app.models.user import NguoiDung
from app.models.zalo_log import NhatKyZalo
from app.schemas.common import GenericResponse, PaginatedData
from app.schemas.zalo_log import ZaloLogOut, ZaloStatsMonth

router = APIRouter(prefix="/zalo-logs", tags=["Zalo Logs"])

@router.get("", response_model=GenericResponse[PaginatedData[ZaloLogOut]])
async def get_zalo_logs(
    log_date: Optional[date] = Query(None, alias="date"),
    loai_tin: Optional[str] = Query(None),
    trang_thai: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    tenant_id: int = Depends(get_current_tenant_id),
    current_user: NguoiDung = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(NhatKyZalo).options(
        selectinload(NhatKyZalo.student),
        selectinload(NhatKyZalo.session).selectinload(BuoiHoc.class_room)
    ).where(NhatKyZalo.trung_tam_id == tenant_id)

    if log_date:
        query = query.where(func.date(NhatKyZalo.thoi_gian_gui) == log_date)

    if loai_tin:
        query = query.where(NhatKyZalo.loai_tin == loai_tin)

    if trang_thai:
        query = query.where(NhatKyZalo.trang_thai == trang_thai)

    if search:
        s = f"%{search.strip()}%"
        query = query.join(NhatKyZalo.student).where(
            (HocSinh.ho_ten.ilike(s)) | (NhatKyZalo.sdt_nhan.ilike(s)) | (NhatKyZalo.noi_dung.ilike(s))
        )

    # Total count
    count_query = select(func.count()).select_from(query.subquery())
    total_res = await db.execute(count_query)
    total = total_res.scalar() or 0

    # Pagination
    offset = (page - 1) * limit
    query = query.order_by(NhatKyZalo.thoi_gian_gui.desc()).offset(offset).limit(limit)
    result = await db.execute(query)
    records = result.scalars().all()

    items = []
    for r in records:
        class_name = (
            r.session.class_room.ten_lop
            if r.session and r.session.class_room
            else "Lớp học"
        )
        items.append(
            ZaloLogOut(
                id=r.id,
                thoi_gian_gui=r.thoi_gian_gui,
                hoc_sinh=r.student.ho_ten if r.student else "Học sinh",
                lop=class_name,
                loai_tin=r.loai_tin,
                sdt_nhan=r.sdt_nhan,
                noi_dung=r.noi_dung,
                trang_thai=r.trang_thai,
                ma_loi_zalo=r.ma_loi_zalo
            )
        )

    return GenericResponse(
        success=True,
        data=PaginatedData(items=items, total=total, page=page, limit=limit),
        message="Nhật ký gửi tin Zalo"
    )

@router.get("/stats", response_model=GenericResponse[List[ZaloStatsMonth]])
async def get_zalo_stats(
    months: int = Query(6, ge=1, le=12),
    tenant_id: int = Depends(get_current_tenant_id),
    current_user: NguoiDung = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Monthly statistics for Recharts chart on Dashboard."""
    today = date.today()
    stats_list = []

    for i in range(months - 1, -1, -1):
        # Month calculation
        year = today.year
        month = today.month - i
        while month <= 0:
            month += 12
            year -= 1

        thang_key = f"T{month}"
        thang_name = f"Tháng {month}/{year}"

        # Query stats for this month and year
        q = select(
            NhatKyZalo.trang_thai,
            func.count(NhatKyZalo.id)
        ).where(
            NhatKyZalo.trung_tam_id == tenant_id,
            func.extract("year", NhatKyZalo.thoi_gian_gui) == year,
            func.extract("month", NhatKyZalo.thoi_gian_gui) == month
        ).group_by(NhatKyZalo.trang_thai)

        res = await db.execute(q)
        counts = dict(res.all())

        thanh_cong = counts.get(ZaloMessageStatus.SUCCESS.value, 0) + counts.get(ZaloMessageStatus.DEMO.value, 0)
        that_bai = counts.get(ZaloMessageStatus.FAILED.value, 0)
        het_tien = counts.get(ZaloMessageStatus.OUT_OF_BALANCE.value, 0)

        stats_list.append(
            ZaloStatsMonth(
                thang=thang_key,
                thang_name=thang_name,
                thanh_cong=thanh_cong,
                that_bai=that_bai,
                het_tien=het_tien
            )
        )

    return GenericResponse(success=True, data=stats_list, message="Thống kê tin nhắn Zalo")


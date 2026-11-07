from typing import Any, Dict
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_tenant_id, get_current_user, get_db
from app.models.user import NguoiDung
from app.schemas.attendance import AttendanceSaveIn, AttendanceSessionDetailOut
from app.schemas.common import GenericResponse
from app.services.attendance_service import AttendanceService

router = APIRouter(prefix="/sessions", tags=["Attendance"])

@router.get("/{session_id}/attendance", response_model=GenericResponse[AttendanceSessionDetailOut])
async def get_session_attendance(
    session_id: int,
    tenant_id: int = Depends(get_current_tenant_id),
    current_user: NguoiDung = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    detail = await AttendanceService.get_attendance_list(db, tenant_id, current_user, session_id)
    return GenericResponse(success=True, data=detail, message="Danh sách điểm danh ca học")

@router.post("/{session_id}/attendance", response_model=GenericResponse[Dict[str, Any]])
async def save_session_attendance(
    session_id: int,
    data: AttendanceSaveIn,
    tenant_id: int = Depends(get_current_tenant_id),
    current_user: NguoiDung = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await AttendanceService.save_attendance(
        db,
        tenant_id=tenant_id,
        current_user=current_user,
        session_id=session_id,
        data=data
    )
    return GenericResponse(success=True, data=result, message="Lưu điểm danh thành công")


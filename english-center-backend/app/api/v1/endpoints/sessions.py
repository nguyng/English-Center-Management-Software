from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_tenant_id, get_current_user, get_db, require_role
from app.core.constants import UserRole
from app.models.user import NguoiDung
from app.schemas.common import GenericResponse
from app.schemas.session import SessionCancelIn, SessionCreate, SessionOut, SessionSubstituteIn
from app.services.session_service import SessionService

router = APIRouter(prefix="/sessions", tags=["Sessions"])

@router.get("", response_model=GenericResponse[List[SessionOut]])
async def get_sessions(
    session_date: Optional[date] = Query(None, alias="date"),
    class_id: Optional[int] = Query(None, alias="classId"),
    tenant_id: int = Depends(get_current_tenant_id),
    current_user: NguoiDung = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    sessions = await SessionService.get_all(
        db,
        tenant_id=tenant_id,
        current_user=current_user,
        session_date=session_date,
        class_id=class_id
    )
    return GenericResponse(success=True, data=sessions, message="Danh sách buổi học")

@router.post("", response_model=GenericResponse[SessionOut])
async def create_session(
    data: SessionCreate,
    tenant_id: int = Depends(get_current_tenant_id),
    current_user: NguoiDung = Depends(require_role([UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    session = await SessionService.create(db, tenant_id, data)
    return GenericResponse(success=True, data=session, message="Tạo buổi học thành công")

@router.get("/{session_id}", response_model=GenericResponse[SessionOut])
async def get_session_by_id(
    session_id: int,
    tenant_id: int = Depends(get_current_tenant_id),
    current_user: NguoiDung = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    session = await SessionService.get_by_id(db, tenant_id, current_user, session_id)
    return GenericResponse(success=True, data=session, message="Chi tiết buổi học")

@router.patch("/{session_id}/cancel", response_model=GenericResponse[SessionOut])
async def cancel_session(
    session_id: int,
    data: SessionCancelIn,
    tenant_id: int = Depends(get_current_tenant_id),
    current_user: NguoiDung = Depends(require_role([UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    session = await SessionService.cancel_session(db, tenant_id, session_id, data.reason)
    return GenericResponse(success=True, data=session, message="Hủy ca học thành công")

@router.patch("/{session_id}/substitute", response_model=GenericResponse[SessionOut])
async def substitute_teacher(
    session_id: int,
    data: SessionSubstituteIn,
    tenant_id: int = Depends(get_current_tenant_id),
    current_user: NguoiDung = Depends(require_role([UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    session = await SessionService.substitute_teacher(db, tenant_id, session_id, data.giao_vien_id)
    return GenericResponse(success=True, data=session, message="Chỉ định giáo viên dạy thay thành công")

@router.patch("/{session_id}/confirm-attendance", response_model=GenericResponse[SessionOut])
async def confirm_attendance(
    session_id: int,
    tenant_id: int = Depends(get_current_tenant_id),
    current_user: NguoiDung = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    session = await SessionService.confirm_attendance(db, tenant_id, current_user, session_id)
    return GenericResponse(success=True, data=session, message="Xác nhận hoàn thành điểm danh ca học")


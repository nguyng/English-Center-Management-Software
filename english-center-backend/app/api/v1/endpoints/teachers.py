from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_tenant_id, get_current_user, get_db, require_role
from app.core.constants import UserRole
from app.models.user import NguoiDung
from app.schemas.common import GenericResponse
from app.schemas.teacher import TeacherCreate, TeacherOut, TeacherStatusUpdateIn, TeacherUpdate
from app.services.teacher_service import TeacherService

router = APIRouter(prefix="/teachers", tags=["Teachers"])

@router.get("", response_model=GenericResponse[List[TeacherOut]])
async def get_teachers(
    search: Optional[str] = Query(None, description="Tìm theo tên, email, sdt"),
    status: Optional[str] = Query(None, description="HoatDong hoặc Khoa"),
    tenant_id: int = Depends(get_current_tenant_id),
    current_user: NguoiDung = Depends(require_role([UserRole.SUPER_ADMIN, UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    teachers = await TeacherService.get_all(db, tenant_id, search=search, status=status)
    return GenericResponse(success=True, data=teachers, message="Danh sách giáo viên")

@router.post("", response_model=GenericResponse[TeacherOut])
async def create_teacher(
    data: TeacherCreate,
    tenant_id: int = Depends(get_current_tenant_id),
    current_user: NguoiDung = Depends(require_role([UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    teacher = await TeacherService.create(db, tenant_id, data)
    return GenericResponse(success=True, data=teacher, message="Tạo tài khoản giáo viên thành công")

@router.get("/{teacher_id}", response_model=GenericResponse[TeacherOut])
async def get_teacher_by_id(
    teacher_id: int,
    tenant_id: int = Depends(get_current_tenant_id),
    current_user: NguoiDung = Depends(require_role([UserRole.SUPER_ADMIN, UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    teacher = await TeacherService.get_by_id(db, tenant_id, teacher_id)
    return GenericResponse(success=True, data=teacher, message="Chi tiết giáo viên")

@router.put("/{teacher_id}", response_model=GenericResponse[TeacherOut])
async def update_teacher(
    teacher_id: int,
    data: TeacherUpdate,
    tenant_id: int = Depends(get_current_tenant_id),
    current_user: NguoiDung = Depends(require_role([UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    teacher = await TeacherService.update(db, tenant_id, teacher_id, data)
    return GenericResponse(success=True, data=teacher, message="Cập nhật giáo viên thành công")

@router.patch("/{teacher_id}/status", response_model=GenericResponse[TeacherOut])
async def update_teacher_status(
    teacher_id: int,
    data: TeacherStatusUpdateIn,
    tenant_id: int = Depends(get_current_tenant_id),
    current_user: NguoiDung = Depends(require_role([UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    teacher = await TeacherService.update_status(db, tenant_id, teacher_id, data.trang_thai)
    return GenericResponse(success=True, data=teacher, message="Cập nhật trạng thái tài khoản thành công")


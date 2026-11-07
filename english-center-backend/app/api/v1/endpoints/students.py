from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_tenant_id, get_current_user, get_db, require_role
from app.core.constants import UserRole
from app.models.user import NguoiDung
from app.schemas.common import GenericResponse
from app.schemas.student import StudentCreate, StudentOut, StudentStatusUpdateIn, StudentUpdate
from app.services.student_service import StudentService

router = APIRouter(prefix="/students", tags=["Students"])

@router.get("", response_model=GenericResponse[List[StudentOut]])
async def get_students(
    class_id: Optional[int] = Query(None, alias="classId"),
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    tenant_id: int = Depends(get_current_tenant_id),
    current_user: NguoiDung = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    students = await StudentService.get_all(
        db,
        tenant_id=tenant_id,
        current_user=current_user,
        class_id=class_id,
        status=status,
        search=search
    )
    return GenericResponse(success=True, data=students, message="Danh sách học sinh")

@router.post("", response_model=GenericResponse[StudentOut])
async def create_student(
    data: StudentCreate,
    tenant_id: int = Depends(get_current_tenant_id),
    current_user: NguoiDung = Depends(require_role([UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    student = await StudentService.create(db, tenant_id, data)
    return GenericResponse(success=True, data=student, message="Tiếp nhận học sinh mới thành công")

@router.get("/{student_id}", response_model=GenericResponse[StudentOut])
async def get_student_by_id(
    student_id: int,
    tenant_id: int = Depends(get_current_tenant_id),
    current_user: NguoiDung = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    student = await StudentService.get_by_id(db, tenant_id, current_user, student_id)
    return GenericResponse(success=True, data=student, message="Chi tiết học sinh")

@router.put("/{student_id}", response_model=GenericResponse[StudentOut])
async def update_student(
    student_id: int,
    data: StudentUpdate,
    tenant_id: int = Depends(get_current_tenant_id),
    current_user: NguoiDung = Depends(require_role([UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    student = await StudentService.update(db, tenant_id, student_id, data)
    return GenericResponse(success=True, data=student, message="Cập nhật học sinh thành công")

@router.patch("/{student_id}/status", response_model=GenericResponse[StudentOut])
async def update_student_status(
    student_id: int,
    data: StudentStatusUpdateIn,
    tenant_id: int = Depends(get_current_tenant_id),
    current_user: NguoiDung = Depends(require_role([UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    student = await StudentService.update_status(db, tenant_id, student_id, data.trang_thai)
    return GenericResponse(success=True, data=student, message="Cập nhật trạng thái học sinh thành công")

@router.delete("/{student_id}", response_model=GenericResponse[dict])
async def delete_student(
    student_id: int,
    tenant_id: int = Depends(get_current_tenant_id),
    current_user: NguoiDung = Depends(require_role([UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    await StudentService.delete(db, tenant_id, student_id)
    return GenericResponse(success=True, data={}, message="Xóa học sinh thành công")


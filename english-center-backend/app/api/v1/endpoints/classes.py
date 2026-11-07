from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_tenant_id, get_current_user, get_db, require_role
from app.core.constants import UserRole
from app.models.user import NguoiDung
from app.schemas.class_room import ClassCreate, ClassOut, ClassUpdate
from app.schemas.common import GenericResponse
from app.services.class_service import ClassService

router = APIRouter(prefix="/classes", tags=["Classes"])

@router.get("", response_model=GenericResponse[List[ClassOut]])
async def get_classes(
    teacher_id: Optional[int] = Query(None, alias="teacherId"),
    search: Optional[str] = Query(None),
    tenant_id: int = Depends(get_current_tenant_id),
    current_user: NguoiDung = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    classes = await ClassService.get_all(
        db,
        tenant_id=tenant_id,
        current_user=current_user,
        teacher_id=teacher_id,
        search=search
    )
    return GenericResponse(success=True, data=classes, message="Danh sách lớp học")

@router.post("", response_model=GenericResponse[ClassOut])
async def create_class(
    data: ClassCreate,
    tenant_id: int = Depends(get_current_tenant_id),
    current_user: NguoiDung = Depends(require_role([UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    class_obj = await ClassService.create(db, tenant_id, data)
    return GenericResponse(success=True, data=class_obj, message="Tạo lớp học thành công")

@router.get("/{class_id}", response_model=GenericResponse[ClassOut])
async def get_class_by_id(
    class_id: int,
    tenant_id: int = Depends(get_current_tenant_id),
    current_user: NguoiDung = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    class_obj = await ClassService.get_by_id(db, tenant_id, current_user, class_id)
    return GenericResponse(success=True, data=class_obj, message="Chi tiết lớp học")

@router.put("/{class_id}", response_model=GenericResponse[ClassOut])
async def update_class(
    class_id: int,
    data: ClassUpdate,
    tenant_id: int = Depends(get_current_tenant_id),
    current_user: NguoiDung = Depends(require_role([UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    class_obj = await ClassService.update(db, tenant_id, class_id, data)
    return GenericResponse(success=True, data=class_obj, message="Cập nhật lớp học thành công")

@router.delete("/{class_id}", response_model=GenericResponse[dict])
async def delete_class(
    class_id: int,
    tenant_id: int = Depends(get_current_tenant_id),
    current_user: NguoiDung = Depends(require_role([UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    await ClassService.delete(db, tenant_id, class_id)
    return GenericResponse(success=True, data={}, message="Xóa lớp học thành công")


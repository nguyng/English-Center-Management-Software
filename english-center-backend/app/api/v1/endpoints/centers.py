from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db, require_role
from app.core.constants import UserRole
from app.core.exceptions import ForbiddenException
from app.models.user import NguoiDung
from app.schemas.center import CenterCreate, CenterOut, LicenseUpdateIn, ZaloConfigIn
from app.schemas.common import GenericResponse
from app.services.center_service import CenterService

router = APIRouter(prefix="/centers", tags=["SaaS Centers"])

@router.get("", response_model=GenericResponse[List[CenterOut]])
async def get_all_centers(
    current_user: NguoiDung = Depends(require_role([UserRole.SUPER_ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    centers = await CenterService.get_all(db)
    return GenericResponse(success=True, data=centers, message="Danh sách trung tâm")

@router.post("", response_model=GenericResponse[CenterOut])
async def create_center(
    data: CenterCreate,
    current_user: NguoiDung = Depends(require_role([UserRole.SUPER_ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    center = await CenterService.create(db, data)
    return GenericResponse(success=True, data=center, message="Khởi tạo trung tâm thành công")

@router.get("/{center_id}", response_model=GenericResponse[CenterOut])
async def get_center_by_id(
    center_id: int,
    current_user: NguoiDung = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.vai_tro != UserRole.SUPER_ADMIN.value and current_user.trung_tam_id != center_id:
        raise ForbiddenException("Bạn không có quyền truy cập trung tâm này")

    center = await CenterService.get_by_id(db, center_id)
    return GenericResponse(success=True, data=center, message="Chi tiết trung tâm")

@router.patch("/{center_id}/license", response_model=GenericResponse[CenterOut])
async def update_center_license(
    center_id: int,
    data: LicenseUpdateIn,
    current_user: NguoiDung = Depends(require_role([UserRole.SUPER_ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    center = await CenterService.update_license(db, center_id, data)
    return GenericResponse(success=True, data=center, message="Gia hạn bản quyền SaaS thành công")

@router.patch("/{center_id}/zalo-config", response_model=GenericResponse[CenterOut])
async def update_center_zalo_config(
    center_id: int,
    data: ZaloConfigIn,
    current_user: NguoiDung = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.vai_tro != UserRole.SUPER_ADMIN.value and current_user.trung_tam_id != center_id:
        raise ForbiddenException("Bạn không có quyền cấu hình Zalo cho trung tâm này")

    center = await CenterService.update_zalo_config(db, center_id, data)
    return GenericResponse(success=True, data=center, message="Cập nhật cấu hình Zalo OA thành công")


from datetime import date
from typing import List, Optional
from fastapi import Depends, Header, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import decode_access_token
from app.core.exceptions import (
    ForbiddenException,
    LicenseExpiredException,
    ResourceNotFoundException,
    UnauthorizedException
)
from app.core.constants import LicenseStatus, UserRole, UserStatus
from app.models.user import NguoiDung
from app.models.center import TrungTam

security_scheme = HTTPBearer(auto_error=False)

async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    db: AsyncSession = Depends(get_db)
) -> NguoiDung:
    """Extract and validate JWT Bearer token and return active user."""
    if not credentials or not credentials.credentials:
        raise UnauthorizedException("Yêu cầu mã xác thực Bearer Token")

    token = credentials.credentials
    try:
        payload = decode_access_token(token)
    except Exception:
        raise UnauthorizedException("Mã token không hợp lệ hoặc đã hết hạn")

    user_id = payload.get("id")
    if not user_id:
        raise UnauthorizedException("Dữ liệu token không hợp lệ")

    query = select(NguoiDung).where(NguoiDung.id == user_id)
    result = await db.execute(query)
    user = result.scalar_one_or_none()

    if not user:
        raise UnauthorizedException("Người dùng không tồn tại")

    if user.trang_thai != UserStatus.ACTIVE.value:
        raise ForbiddenException("Tài khoản của bạn đã bị khóa")

    return user

def require_role(allowed_roles: List[UserRole]):
    """Enforce Role-Based Access Control."""
    async def role_checker(current_user: NguoiDung = Depends(get_current_user)) -> NguoiDung:
        allowed_values = [r.value if isinstance(r, UserRole) else r for r in allowed_roles]
        if current_user.vai_tro not in allowed_values:
            raise ForbiddenException("Bạn không có quyền thực hiện thao tác này")
        return current_user

    return role_checker

async def get_current_tenant_id(
    current_user: NguoiDung = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Optional[int]:
    """Extract tenant ID from authenticated user.
    For Admin / Teacher, tenant_id is strictly bound to user.trung_tam_id.
    """
    if current_user.vai_tro == UserRole.SUPER_ADMIN.value:
        return current_user.trung_tam_id  # Might be None or selected tenant
    
    if not current_user.trung_tam_id:
        raise ForbiddenException("Tài khoản chưa được liên kết với trung tâm nào")

    return current_user.trung_tam_id

async def verify_center_license(
    current_user: NguoiDung = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> None:
    """Check if center SaaS license is still active.
    Raises LicenseExpiredException if license is expired.
    SuperAdmin is exempted.
    """
    if current_user.vai_tro == UserRole.SUPER_ADMIN.value:
        return

    if not current_user.trung_tam_id:
        return

    query = select(TrungTam).where(TrungTam.id == current_user.trung_tam_id)
    result = await db.execute(query)
    center = result.scalar_one_or_none()

    if not center:
        raise ResourceNotFoundException("Không tìm thấy thông tin trung tâm")

    today = date.today()
    if (
        center.trang_thai_ban_quyen == LicenseStatus.EXPIRED.value
        or center.ngay_het_han_saas < today
    ):
        raise LicenseExpiredException()

async def get_optional_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    db: AsyncSession = Depends(get_db)
) -> Optional[NguoiDung]:
    """Extract and validate JWT Bearer token if present, otherwise return None."""
    if not credentials or not credentials.credentials:
        return None

    token = credentials.credentials
    try:
        payload = decode_access_token(token)
    except Exception:
        return None

    user_id = payload.get("id")
    if not user_id:
        return None

    query = select(NguoiDung).where(NguoiDung.id == user_id)
    result = await db.execute(query)
    user = result.scalar_one_or_none()

    if not user or user.trang_thai != UserStatus.ACTIVE.value:
        return None

    return user



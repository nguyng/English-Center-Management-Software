from datetime import date
from typing import Tuple
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token, verify_password
from app.core.exceptions import (
    ForbiddenException,
    UnauthorizedException
)
from app.core.constants import LicenseStatus, UserRole, UserStatus
from app.models.user import NguoiDung
from app.models.center import TrungTam
from app.schemas.auth import LoginRequest, TokenResponse, TokenUser, UserOut

class AuthService:
    @staticmethod
    async def login(db: AsyncSession, data: LoginRequest) -> TokenResponse:
        query = select(NguoiDung).where(NguoiDung.email == data.email.lower().strip())
        result = await db.execute(query)
        user = result.scalar_one_or_none()

        if not user or not verify_password(data.password, user.mat_khau_hash):
            raise UnauthorizedException("Email hoặc mật khẩu không chính xác")

        if user.trang_thai != UserStatus.ACTIVE.value:
            raise ForbiddenException("Tài khoản của bạn đã bị khóa")

        center_name = None
        license_expired = False

        if user.trung_tam_id:
            center_query = select(TrungTam).where(TrungTam.id == user.trung_tam_id)
            c_res = await db.execute(center_query)
            center = c_res.scalar_one_or_none()
            if center:
                center_name = center.ten_trung_tam
                today = date.today()
                if (
                    center.trang_thai_ban_quyen == LicenseStatus.EXPIRED.value
                    or center.ngay_het_han_saas < today
                ):
                    license_expired = True

        token_payload = {
            "id": user.id,
            "ho_ten": user.ho_ten,
            "email": user.email,
            "vai_tro": user.vai_tro,
            "trung_tam_id": user.trung_tam_id
        }

        token = create_access_token(token_payload)

        return TokenResponse(
            access_token=token,
            token_type="bearer",
            user=TokenUser(
                id=user.id,
                ho_ten=user.ho_ten,
                email=user.email,
                vai_tro=user.vai_tro,
                trung_tam_id=user.trung_tam_id,
                ten_trung_tam=center_name
            ),
            license_expired=license_expired
        )

    @staticmethod
    async def get_me(db: AsyncSession, current_user: NguoiDung) -> UserOut:
        center_name = None
        if current_user.trung_tam_id:
            query = select(TrungTam).where(TrungTam.id == current_user.trung_tam_id)
            res = await db.execute(query)
            center = res.scalar_one_or_none()
            if center:
                center_name = center.ten_trung_tam

        return UserOut(
            id=current_user.id,
            ho_ten=current_user.ho_ten,
            email=current_user.email,
            sdt=current_user.sdt,
            vai_tro=current_user.vai_tro,
            trung_tam_id=current_user.trung_tam_id,
            ten_trung_tam=center_name,
            trang_thai=current_user.trang_thai
        )


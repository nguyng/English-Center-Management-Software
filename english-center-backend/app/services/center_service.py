from datetime import date, timedelta
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import LicenseStatus, UserRole, UserStatus
from app.core.exceptions import (
    DuplicateResourceException,
    ResourceNotFoundException
)
from app.core.security import hash_password
from app.models.center import TrungTam
from app.models.user import NguoiDung
from app.schemas.center import CenterCreate, CenterOut, CenterUpdate, LicenseUpdateIn, ZaloConfigIn

class CenterService:
    @staticmethod
    async def get_all(db: AsyncSession) -> List[CenterOut]:
        query = select(TrungTam).order_by(TrungTam.created_at.desc())
        result = await db.execute(query)
        centers = result.scalars().all()
        return [
            CenterOut(
                id=c.id,
                ten_trung_tam=c.ten_trung_tam,
                sdt_admin=c.sdt_admin,
                ngay_het_han_saas=c.ngay_het_han_saas,
                trang_thai_ban_quyen=c.trang_thai_ban_quyen,
                zalo_oa_id=c.zalo_oa_id,
                zalo_app_id=c.zalo_app_id,
                created_at=c.created_at
            )
            for c in centers
        ]

    @staticmethod
    async def get_by_id(db: AsyncSession, center_id: int) -> CenterOut:
        query = select(TrungTam).where(TrungTam.id == center_id)
        result = await db.execute(query)
        center = result.scalar_one_or_none()
        if not center:
            raise ResourceNotFoundException(f"Không tìm thấy trung tâm có ID {center_id}")

        return CenterOut(
            id=center.id,
            ten_trung_tam=center.ten_trung_tam,
            sdt_admin=center.sdt_admin,
            ngay_het_han_saas=center.ngay_het_han_saas,
            trang_thai_ban_quyen=center.trang_thai_ban_quyen,
            zalo_oa_id=center.zalo_oa_id,
            zalo_app_id=center.zalo_app_id,
            created_at=center.created_at
        )

    @staticmethod
    async def create(db: AsyncSession, data: CenterCreate) -> CenterOut:
        # Check duplicate admin email
        email_clean = data.email_admin.lower().strip()
        user_check = await db.execute(select(NguoiDung).where(NguoiDung.email == email_clean))
        if user_check.scalar_one_or_none():
            raise DuplicateResourceException(f"Email quản trị viên '{email_clean}' đã được sử dụng")

        # Expiration date: today + 365 * so_nam
        expiry_date = date.today() + timedelta(days=365 * data.so_nam)

        center = TrungTam(
            ten_trung_tam=data.ten_trung_tam,
            sdt_admin=data.sdt_admin,
            ngay_het_han_saas=expiry_date,
            trang_thai_ban_quyen=LicenseStatus.ACTIVE.value
        )
        db.add(center)
        await db.flush()

        # Create Admin User
        admin_user = NguoiDung(
            trung_tam_id=center.id,
            ho_ten=f"Admin {center.ten_trung_tam}",
            email=email_clean,
            sdt=data.sdt_admin,
            mat_khau_hash=hash_password(data.mat_khau_admin),
            vai_tro=UserRole.ADMIN.value,
            trang_thai=UserStatus.ACTIVE.value
        )
        db.add(admin_user)
        await db.commit()
        await db.refresh(center)

        return CenterOut(
            id=center.id,
            ten_trung_tam=center.ten_trung_tam,
            sdt_admin=center.sdt_admin,
            ngay_het_han_saas=center.ngay_het_han_saas,
            trang_thai_ban_quyen=center.trang_thai_ban_quyen,
            zalo_oa_id=center.zalo_oa_id,
            zalo_app_id=center.zalo_app_id,
            created_at=center.created_at
        )

    @staticmethod
    async def update_license(db: AsyncSession, center_id: int, data: LicenseUpdateIn) -> CenterOut:
        query = select(TrungTam).where(TrungTam.id == center_id)
        result = await db.execute(query)
        center = result.scalar_one_or_none()
        if not center:
            raise ResourceNotFoundException(f"Không tìm thấy trung tâm có ID {center_id}")

        if data.ngay_het_han_saas:
            center.ngay_het_han_saas = data.ngay_het_han_saas
        elif data.so_nam_gia_han:
            base_date = max(center.ngay_het_han_saas, date.today())
            center.ngay_het_han_saas = base_date + timedelta(days=365 * data.so_nam_gia_han)

        center.trang_thai_ban_quyen = LicenseStatus.ACTIVE.value
        await db.commit()
        await db.refresh(center)

        return CenterOut(
            id=center.id,
            ten_trung_tam=center.ten_trung_tam,
            sdt_admin=center.sdt_admin,
            ngay_het_han_saas=center.ngay_het_han_saas,
            trang_thai_ban_quyen=center.trang_thai_ban_quyen,
            zalo_oa_id=center.zalo_oa_id,
            zalo_app_id=center.zalo_app_id,
            created_at=center.created_at
        )

    @staticmethod
    async def update_zalo_config(db: AsyncSession, center_id: int, data: ZaloConfigIn) -> CenterOut:
        query = select(TrungTam).where(TrungTam.id == center_id)
        result = await db.execute(query)
        center = result.scalar_one_or_none()
        if not center:
            raise ResourceNotFoundException(f"Không tìm thấy trung tâm có ID {center_id}")

        if data.zalo_oa_id is not None:
            center.zalo_oa_id = data.zalo_oa_id
        if data.zalo_app_id is not None:
            center.zalo_app_id = data.zalo_app_id
        if data.zalo_secret_key is not None:
            center.zalo_secret_key = data.zalo_secret_key
        if data.zalo_access_token is not None:
            center.zalo_access_token = data.zalo_access_token

        await db.commit()
        await db.refresh(center)

        return CenterOut(
            id=center.id,
            ten_trung_tam=center.ten_trung_tam,
            sdt_admin=center.sdt_admin,
            ngay_het_han_saas=center.ngay_het_han_saas,
            trang_thai_ban_quyen=center.trang_thai_ban_quyen,
            zalo_oa_id=center.zalo_oa_id,
            zalo_app_id=center.zalo_app_id,
            created_at=center.created_at
        )


from datetime import date
from typing import List, Optional
from sqlalchemy import Date, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.models.base import TimestampMixin
from app.core.constants import LicenseStatus

class TrungTam(Base, TimestampMixin):
    __tablename__ = "trung_tam"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    ten_trung_tam: Mapped[str] = mapped_column(String(255), nullable=False)
    sdt_admin: Mapped[str] = mapped_column(String(20), nullable=False)
    ngay_het_han_saas: Mapped[date] = mapped_column(Date, nullable=False)
    trang_thai_ban_quyen: Mapped[str] = mapped_column(
        String(20),
        default=LicenseStatus.ACTIVE.value,
        nullable=False
    )
    zalo_oa_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    zalo_app_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    zalo_secret_key: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    zalo_access_token: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    users: Mapped[List["NguoiDung"]] = relationship("NguoiDung", back_populates="center", cascade="all, delete-orphan")
    classes: Mapped[List["LopHoc"]] = relationship("LopHoc", back_populates="center", cascade="all, delete-orphan")
    students: Mapped[List["HocSinh"]] = relationship("HocSinh", back_populates="center", cascade="all, delete-orphan")
    sessions: Mapped[List["BuoiHoc"]] = relationship("BuoiHoc", back_populates="center", cascade="all, delete-orphan")


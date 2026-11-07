from typing import List, Optional
from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.models.base import TimestampMixin
from app.core.constants import UserRole, UserStatus

class NguoiDung(Base, TimestampMixin):
    __tablename__ = "nguoi_dung"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    trung_tam_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("trung_tam.id", ondelete="CASCADE"),
        nullable=True,
        index=True
    )
    ho_ten: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(150), unique=True, nullable=False, index=True)
    sdt: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    mat_khau_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    vai_tro: Mapped[str] = mapped_column(String(20), nullable=False, default=UserRole.TEACHER.value)
    trang_thai: Mapped[str] = mapped_column(String(20), nullable=False, default=UserStatus.ACTIVE.value)

    # Relationships
    center: Mapped[Optional["TrungTam"]] = relationship("TrungTam", back_populates="users")
    teaching_classes: Mapped[List["LopHoc"]] = relationship("LopHoc", back_populates="teacher")
    substitute_sessions: Mapped[List["BuoiHoc"]] = relationship("BuoiHoc", back_populates="substitute_teacher")


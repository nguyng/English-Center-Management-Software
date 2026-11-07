from typing import List
from sqlalchemy import ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.models.base import TimestampMixin

class LopHoc(Base, TimestampMixin):
    __tablename__ = "lop_hoc"
    __table_args__ = (
        UniqueConstraint("trung_tam_id", "ma_lop", name="uq_lop_hoc_tenant_ma_lop"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    trung_tam_id: Mapped[int] = mapped_column(
        ForeignKey("trung_tam.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    ma_lop: Mapped[str] = mapped_column(String(50), nullable=False)
    ten_lop: Mapped[str] = mapped_column(String(150), nullable=False)
    giao_vien_id: Mapped[int] = mapped_column(
        ForeignKey("nguoi_dung.id", ondelete="RESTRICT"),
        nullable=False,
        index=True
    )

    # Relationships
    center: Mapped["TrungTam"] = relationship("TrungTam", back_populates="classes")
    teacher: Mapped["NguoiDung"] = relationship("NguoiDung", back_populates="teaching_classes")
    students: Mapped[List["HocSinh"]] = relationship("HocSinh", back_populates="class_room", cascade="all, delete-orphan")
    sessions: Mapped[List["BuoiHoc"]] = relationship("BuoiHoc", back_populates="class_room", cascade="all, delete-orphan")


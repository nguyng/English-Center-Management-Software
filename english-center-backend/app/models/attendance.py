from typing import Optional
from sqlalchemy import ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.models.base import TimestampMixin
from app.core.constants import AttendanceState

class DiemDanh(Base, TimestampMixin):
    __tablename__ = "diem_danh"
    __table_args__ = (
        UniqueConstraint("buoi_hoc_id", "hoc_sinh_id", name="uq_diem_danh_buoi_hoc_hoc_sinh"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    trung_tam_id: Mapped[int] = mapped_column(
        ForeignKey("trung_tam.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    buoi_hoc_id: Mapped[int] = mapped_column(
        ForeignKey("buoi_hoc.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    hoc_sinh_id: Mapped[int] = mapped_column(
        ForeignKey("hoc_sinh.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    trang_thai: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default=AttendanceState.PRESENT.value
    )
    ghi_chu: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    session: Mapped["BuoiHoc"] = relationship("BuoiHoc", back_populates="attendances")
    student: Mapped["HocSinh"] = relationship("HocSinh")


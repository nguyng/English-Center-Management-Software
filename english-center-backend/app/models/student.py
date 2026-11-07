from datetime import date
from sqlalchemy import Date, ForeignKey, Index, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.models.base import TimestampMixin
from app.core.constants import StudentStatus

class HocSinh(Base, TimestampMixin):
    __tablename__ = "hoc_sinh"
    __table_args__ = (
        Index("idx_hocsinh_tenant_lop_status", "trung_tam_id", "lop_id", "trang_thai"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    trung_tam_id: Mapped[int] = mapped_column(
        ForeignKey("trung_tam.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    lop_id: Mapped[int] = mapped_column(
        ForeignKey("lop_hoc.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    ho_ten: Mapped[str] = mapped_column(String(100), nullable=False)
    sdt_phu_huynh: Mapped[str] = mapped_column(String(20), nullable=False)
    ngay_nhap_hoc: Mapped[date] = mapped_column(Date, nullable=False)
    trang_thai: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default=StudentStatus.STUDYING.value
    )

    # Relationships
    center: Mapped["TrungTam"] = relationship("TrungTam", back_populates="students")
    class_room: Mapped["LopHoc"] = relationship("LopHoc", back_populates="students")


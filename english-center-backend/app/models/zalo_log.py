from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import DateTime, ForeignKey, Index, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

class NhatKyZalo(Base):
    __tablename__ = "nhat_ky_zalo"
    __table_args__ = (
        UniqueConstraint(
            "buoi_hoc_id",
            "hoc_sinh_id",
            "loai_tin",
            name="uq_zalo_log_buoi_hoc_hoc_sinh_loai_tin"
        ),
        Index("idx_zalo_tenant_thang", "trung_tam_id", "thoi_gian_gui"),
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
    loai_tin: Mapped[str] = mapped_column(String(20), nullable=False)  # bao_vang, bao_diem
    sdt_nhan: Mapped[str] = mapped_column(String(20), nullable=False)
    noi_dung: Mapped[str] = mapped_column(Text, nullable=False)
    trang_thai: Mapped[str] = mapped_column(String(20), nullable=False)  # ThanhCong, ThatBai, HetTien, Demo
    ma_loi_zalo: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    thoi_gian_gui: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    # Relationships
    session: Mapped["BuoiHoc"] = relationship("BuoiHoc")
    student: Mapped["HocSinh"] = relationship("HocSinh")


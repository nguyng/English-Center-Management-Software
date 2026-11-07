from datetime import datetime, timezone
from decimal import Decimal
from typing import Any, Dict, Optional
from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Integer, JSON, Numeric, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

class KetQua(Base):
    __tablename__ = "ket_qua"
    __table_args__ = (
        UniqueConstraint("bai_kiem_tra_id", "hoc_sinh_id", name="uq_ket_qua_exam_student"),
        CheckConstraint("diem_so >= 0.0 AND diem_so <= 10.0", name="chk_ket_qua_diem_so_range"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    trung_tam_id: Mapped[int] = mapped_column(
        ForeignKey("trung_tam.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    bai_kiem_tra_id: Mapped[int] = mapped_column(
        ForeignKey("bai_kiem_tra.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    hoc_sinh_id: Mapped[int] = mapped_column(
        ForeignKey("hoc_sinh.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    diem_so: Mapped[Decimal] = mapped_column(Numeric(3, 1), nullable=False)
    diem_thu_cong: Mapped[Optional[Decimal]] = mapped_column(Numeric(3, 1), nullable=True)
    so_lan_roi_tab: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    chi_tiet_tra_loi: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    thoi_gian_nop: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    # Relationships
    exam: Mapped["BaiKiemTra"] = relationship("BaiKiemTra", back_populates="results")
    student: Mapped["HocSinh"] = relationship("HocSinh")


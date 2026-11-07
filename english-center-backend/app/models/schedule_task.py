from datetime import datetime, timezone
from decimal import Decimal
from sqlalchemy import DateTime, ForeignKey, Index, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.core.constants import ScheduleTaskStatus, ZaloMessageType

class HenGioGuiTin(Base):
    __tablename__ = "hen_gio_gui_tin"
    __table_args__ = (
        Index("idx_hengui_cron", "trang_thai", "thoi_gian_hen_gui"),
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
    loai_tin: Mapped[str] = mapped_column(
        String(20),
        default=ZaloMessageType.SCORE_NOTICE.value,
        nullable=False
    )
    diem_so: Mapped[Decimal] = mapped_column(Numeric(3, 1), nullable=False)
    thoi_gian_hen_gui: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    trang_thai: Mapped[str] = mapped_column(
        String(20),
        default=ScheduleTaskStatus.PENDING.value,
        nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    # Relationships
    session: Mapped["BuoiHoc"] = relationship("BuoiHoc")
    student: Mapped["HocSinh"] = relationship("HocSinh")


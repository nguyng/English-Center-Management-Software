from datetime import date, time
from typing import List, Optional
from sqlalchemy import Boolean, Date, ForeignKey, Index, String, Text, Time
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.models.base import TimestampMixin
from app.core.constants import SessionAttendanceStatus, SessionStatus

class BuoiHoc(Base, TimestampMixin):
    __tablename__ = "buoi_hoc"
    __table_args__ = (
        Index(
            "idx_buoihoc_cron",
            "ngay_hoc",
            "gio_ket_thuc",
            "da_gui",
            "trang_thai_diem_danh",
            "trang_thai_buoi_hoc"
        ),
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
    giao_vien_day_thay_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("nguoi_dung.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    ngay_hoc: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    ca_hoc: Mapped[str] = mapped_column(String(50), nullable=False)
    gio_bat_dau: Mapped[time] = mapped_column(Time, nullable=False)
    gio_ket_thuc: Mapped[time] = mapped_column(Time, nullable=False)
    co_kiem_tra: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    da_gui: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    trang_thai_diem_danh: Mapped[str] = mapped_column(
        String(30),
        default=SessionAttendanceStatus.NOT_TAKEN.value,
        nullable=False
    )
    trang_thai_buoi_hoc: Mapped[str] = mapped_column(
        String(20),
        default=SessionStatus.NORMAL.value,
        nullable=False
    )
    ly_do_huy: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    center: Mapped["TrungTam"] = relationship("TrungTam", back_populates="sessions")
    class_room: Mapped["LopHoc"] = relationship("LopHoc", back_populates="sessions")
    substitute_teacher: Mapped[Optional["NguoiDung"]] = relationship("NguoiDung", back_populates="substitute_sessions")
    attendances: Mapped[List["DiemDanh"]] = relationship("DiemDanh", back_populates="session", cascade="all, delete-orphan")
    exams: Mapped[List["BaiKiemTra"]] = relationship("BaiKiemTra", back_populates="session", cascade="all, delete-orphan")


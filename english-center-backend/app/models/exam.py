from datetime import date
from typing import List
from sqlalchemy import Date, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.models.base import TimestampMixin
from app.core.constants import ExamFormat

class BaiKiemTra(Base, TimestampMixin):
    __tablename__ = "bai_kiem_tra"

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
    ten_bai_kiem_tra: Mapped[str] = mapped_column(String(150), nullable=False)
    hinh_thuc: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default=ExamFormat.ONLINE.value
    )
    ngay_kiem_tra: Mapped[date] = mapped_column(Date, nullable=False)
    thoi_gian_phut: Mapped[int] = mapped_column(Integer, default=15, nullable=False)

    # Relationships
    session: Mapped["BuoiHoc"] = relationship("BuoiHoc", back_populates="exams")
    questions: Mapped[List["CauHoi"]] = relationship(
        "CauHoi",
        back_populates="exam",
        cascade="all, delete-orphan",
        order_by="CauHoi.thu_tu"
    )
    results: Mapped[List["KetQua"]] = relationship("KetQua", back_populates="exam", cascade="all, delete-orphan")

class CauHoi(Base):
    __tablename__ = "cau_hoi"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    bai_kiem_tra_id: Mapped[int] = mapped_column(
        ForeignKey("bai_kiem_tra.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    thu_tu: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    noi_dung: Mapped[str] = mapped_column(Text, nullable=False)
    dap_an_a: Mapped[str] = mapped_column(String(255), nullable=False)
    dap_an_b: Mapped[str] = mapped_column(String(255), nullable=False)
    dap_an_c: Mapped[str] = mapped_column(String(255), nullable=False)
    dap_an_d: Mapped[str] = mapped_column(String(255), nullable=False)
    dap_an_dung: Mapped[str] = mapped_column(String(10), nullable=False)  # A, B, C, D

    # Relationships
    exam: Mapped["BaiKiemTra"] = relationship("BaiKiemTra", back_populates="questions")


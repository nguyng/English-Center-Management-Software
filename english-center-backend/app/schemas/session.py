from datetime import date, time
from typing import Optional
from pydantic import BaseModel, Field

class SessionCreate(BaseModel):
    lop_id: int
    ngay_hoc: date
    ca_hoc: str = Field(..., description="Ví dụ: 17:30 - 19:00")
    gio_bat_dau: str = Field(..., pattern=r"^\d{2}:\d{2}(:\d{2})?$")
    gio_ket_thuc: str = Field(..., pattern=r"^\d{2}:\d{2}(:\d{2})?$")
    co_kiem_tra: bool = False

class SessionCancelIn(BaseModel):
    reason: str = Field(..., min_length=2)

class SessionSubstituteIn(BaseModel):
    giao_vien_id: int

class SessionOut(BaseModel):
    id: int
    lop_id: int
    lop: str
    ma_lop: str
    ngay_hoc: date
    ca_hoc: str
    gio_bat_dau: str
    gio_ket_thuc: str
    giao_vien: str
    co_kiem_tra: bool
    da_gui: bool
    trang_thai_diem_danh: str
    trang_thai_buoi_hoc: str
    ly_do_huy: Optional[str] = None


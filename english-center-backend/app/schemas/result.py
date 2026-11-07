from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class ResultOut(BaseModel):
    id: int
    hoc_sinh_id: int
    ho_ten: str
    diem_so: float
    diem_thu_cong: Optional[float] = None
    so_lan_roi_tab: int = 0
    thoi_gian_nop: datetime
    xep_loai: str

class StudentResultOut(BaseModel):
    id: int
    bai_kiem_tra_id: int
    ten_bai_kiem_tra: str
    ngay_kiem_tra: str
    diem_so: float
    xep_loai: str
    thoi_gian_nop: datetime


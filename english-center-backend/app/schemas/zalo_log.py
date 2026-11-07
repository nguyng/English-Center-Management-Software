from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class ZaloLogOut(BaseModel):
    id: int
    thoi_gian_gui: datetime
    hoc_sinh: str
    lop: str
    loai_tin: str
    sdt_nhan: str
    noi_dung: str
    trang_thai: str
    ma_loi_zalo: Optional[str] = None

class ZaloStatsMonth(BaseModel):
    thang: str
    thang_name: Optional[str] = None
    thanh_cong: int
    that_bai: int
    het_tien: int


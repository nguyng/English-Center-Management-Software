from datetime import date
from typing import Optional
from pydantic import BaseModel, Field, field_validator
import re
from app.core.constants import VN_PHONE_REGEX, StudentStatus

class StudentCreate(BaseModel):
    ho_ten: str = Field(..., min_length=2, max_length=100)
    sdt_phu_huynh: str = Field(..., description="Số điện thoại di động Việt Nam 10 chữ số")
    lop_id: int
    ngay_nhap_hoc: date

    @field_validator("sdt_phu_huynh")
    def validate_phone(cls, v: str) -> str:
        clean_v = v.strip().replace(" ", "").replace(".", "")
        if not re.match(VN_PHONE_REGEX, clean_v):
            raise ValueError("Số điện thoại không đúng định dạng di động Việt Nam (10 chữ số, đầu 03, 05, 07, 08, 09)")
        return clean_v

class StudentUpdate(BaseModel):
    ho_ten: Optional[str] = None
    sdt_phu_huynh: Optional[str] = None
    lop_id: Optional[int] = None
    ngay_nhap_hoc: Optional[date] = None

    @field_validator("sdt_phu_huynh")
    def validate_phone(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        clean_v = v.strip().replace(" ", "").replace(".", "")
        if not re.match(VN_PHONE_REGEX, clean_v):
            raise ValueError("Số điện thoại không đúng định dạng di động Việt Nam (10 chữ số, đầu 03, 05, 07, 08, 09)")
        return clean_v

class StudentStatusUpdateIn(BaseModel):
    trang_thai: str = Field(..., pattern=r"^(DangHoc|BaoLuu|DaNghi)$")

class StudentOut(BaseModel):
    id: int
    ho_ten: str
    sdt_phu_huynh: str
    lop_id: int
    lop: str
    ngay_nhap_hoc: date
    trang_thai: str


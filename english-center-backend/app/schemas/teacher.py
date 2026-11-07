from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field

class TeacherCreate(BaseModel):
    ho_ten: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    sdt: Optional[str] = None
    mat_khau: str = Field(..., min_length=6)

class TeacherUpdate(BaseModel):
    ho_ten: Optional[str] = None
    sdt: Optional[str] = None

class TeacherStatusUpdateIn(BaseModel):
    trang_thai: str = Field(..., pattern=r"^(HoatDong|Khoa)$")

class TeacherOut(BaseModel):
    id: int
    ho_ten: str
    email: str
    sdt: Optional[str] = None
    vai_tro: str
    trang_thai: str
    classes: List[str] = []


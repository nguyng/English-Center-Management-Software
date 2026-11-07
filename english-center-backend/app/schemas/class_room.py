from typing import Optional
from pydantic import BaseModel, Field

class ClassCreate(BaseModel):
    ma_lop: str = Field(..., min_length=2, max_length=50)
    ten_lop: str = Field(..., min_length=2, max_length=150)
    giao_vien_id: int

class ClassUpdate(BaseModel):
    ma_lop: Optional[str] = None
    ten_lop: Optional[str] = None
    giao_vien_id: Optional[int] = None

class ClassOut(BaseModel):
    id: int
    ma_lop: str
    ten_lop: str
    giao_vien_id: int
    giao_vien: str
    so_hoc_sinh: int = 0


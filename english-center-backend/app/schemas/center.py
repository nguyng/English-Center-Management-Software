from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field

class CenterCreate(BaseModel):
    ten_trung_tam: str = Field(..., min_length=2, max_length=255)
    sdt_admin: str = Field(..., min_length=10, max_length=20)
    email_admin: EmailStr
    mat_khau_admin: str = Field(..., min_length=6)
    so_nam: int = Field(default=1, ge=1, le=10)

class CenterUpdate(BaseModel):
    ten_trung_tam: Optional[str] = None
    sdt_admin: Optional[str] = None

class LicenseUpdateIn(BaseModel):
    ngay_het_han_saas: Optional[date] = None
    so_nam_gia_han: Optional[int] = Field(default=1, ge=1, le=10)

class ZaloConfigIn(BaseModel):
    zalo_oa_id: Optional[str] = None
    zalo_app_id: Optional[str] = None
    zalo_secret_key: Optional[str] = None
    zalo_access_token: Optional[str] = None

class CenterOut(BaseModel):
    id: int
    ten_trung_tam: str
    sdt_admin: str
    ngay_het_han_saas: date
    trang_thai_ban_quyen: str
    zalo_oa_id: Optional[str] = None
    zalo_app_id: Optional[str] = None
    created_at: Optional[datetime] = None


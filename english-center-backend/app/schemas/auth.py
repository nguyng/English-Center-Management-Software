from typing import Optional
from pydantic import BaseModel, EmailStr

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenUser(BaseModel):
    id: int
    ho_ten: str
    email: str
    vai_tro: str
    trung_tam_id: Optional[int] = None
    ten_trung_tam: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: TokenUser
    license_expired: bool = False

class UserOut(BaseModel):
    id: int
    ho_ten: str
    email: str
    sdt: Optional[str] = None
    vai_tro: str
    trung_tam_id: Optional[int] = None
    ten_trung_tam: Optional[str] = None
    trang_thai: str


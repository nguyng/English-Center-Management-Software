from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.user import NguoiDung
from app.schemas.auth import LoginRequest, TokenResponse, UserOut
from app.schemas.common import GenericResponse
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=GenericResponse[TokenResponse])
async def login(
    data: LoginRequest,
    db: AsyncSession = Depends(get_db)
):
    token_resp = await AuthService.login(db, data)
    return GenericResponse(
        success=True,
        data=token_resp,
        message="Đăng nhập thành công"
    )

@router.post("/logout", response_model=GenericResponse[dict])
async def logout(
    current_user: NguoiDung = Depends(get_current_user)
):
    return GenericResponse(
        success=True,
        data={},
        message="Đăng xuất thành công"
    )

@router.get("/me", response_model=GenericResponse[UserOut])
async def get_me(
    current_user: NguoiDung = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    user_out = await AuthService.get_me(db, current_user)
    return GenericResponse(
        success=True,
        data=user_out,
        message="Lấy thông tin người dùng thành công"
    )


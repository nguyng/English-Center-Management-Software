from datetime import date
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse
from sqlalchemy import select

from app.core.config import settings
from app.core.constants import LicenseStatus, UserRole
from app.core.database import AsyncSessionLocal
from app.core.security import decode_access_token
from app.models.center import TrungTam

class LicenseGuardMiddleware(BaseHTTPMiddleware):
    EXEMPT_PREFIXES = [
        "/docs",
        "/redoc",
        "/openapi.json",
        "/health",
        f"{settings.API_V1_STR}/auth/login",
        f"{settings.API_V1_STR}/auth/logout",
        f"{settings.API_V1_STR}/centers"  # SuperAdmin managing SaaS licenses
    ]

    async def dispatch(self, request: Request, call_next):
        # 1. Allow all GET, OPTIONS, HEAD requests (Read-Only access for expired tenants)
        if request.method in ("GET", "OPTIONS", "HEAD"):
            return await call_next(request)

        # 2. Check exempt paths
        path = request.url.path
        if any(path.startswith(prefix) for prefix in self.EXEMPT_PREFIXES):
            return await call_next(request)

        # 3. Inspect Authorization header
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return await call_next(request)

        token = auth_header.split(" ")[1]
        try:
            payload = decode_access_token(token)
            role = payload.get("vai_tro")
            tenant_id = payload.get("trung_tam_id")

            # SuperAdmin is exempt
            if role == UserRole.SUPER_ADMIN.value or not tenant_id:
                return await call_next(request)

            # Check tenant license in DB
            async with AsyncSessionLocal() as session:
                query = select(TrungTam).where(TrungTam.id == tenant_id)
                res = await session.execute(query)
                center = res.scalar_one_or_none()

                if center:
                    today = date.today()
                    if (
                        center.trang_thai_ban_quyen == LicenseStatus.EXPIRED.value
                        or center.ngay_het_han_saas < today
                    ):
                        return JSONResponse(
                            status_code=403,
                            content={
                                "success": False,
                                "error_code": "SAAS_LICENSE_EXPIRED",
                                "message": "Bản quyền phần mềm đã hết hạn. Vui lòng liên hệ nhà phát triển để gia hạn.",
                                "details": None
                            }
                        )
        except Exception:
            # Let normal authentication / router handler handle invalid tokens
            pass

        return await call_next(request)


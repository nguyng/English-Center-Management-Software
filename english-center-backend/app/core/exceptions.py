from typing import Any, Optional
from fastapi import FastAPI, Request, status
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

class AppException(Exception):
    def __init__(
        self,
        message: str,
        error_code: str = "INTERNAL_SERVER_ERROR",
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        details: Optional[Any] = None
    ):
        self.message = message
        self.error_code = error_code
        self.status_code = status_code
        self.details = details
        super().__init__(self.message)

class ResourceNotFoundException(AppException):
    def __init__(self, message: str = "Không tìm thấy dữ liệu yêu cầu", details: Optional[Any] = None):
        super().__init__(
            message=message,
            error_code="RESOURCE_NOT_FOUND",
            status_code=status.HTTP_404_NOT_FOUND,
            details=details
        )

class UnauthorizedException(AppException):
    def __init__(self, message: str = "Thông tin xác thực không hợp lệ", details: Optional[Any] = None):
        super().__init__(
            message=message,
            error_code="UNAUTHORIZED",
            status_code=status.HTTP_401_UNAUTHORIZED,
            details=details
        )

class ForbiddenException(AppException):
    def __init__(
        self,
        message: str = "Bạn không có quyền thực hiện hành động này",
        error_code: str = "FORBIDDEN",
        details: Optional[Any] = None
    ):
        super().__init__(
            message=message,
            error_code=error_code,
            status_code=status.HTTP_403_FORBIDDEN,
            details=details
        )

class LicenseExpiredException(AppException):
    def __init__(self, message: str = "Bản quyền phần mềm đã hết hạn. Vui lòng liên hệ nhà phát triển để gia hạn."):
        super().__init__(
            message=message,
            error_code="SAAS_LICENSE_EXPIRED",
            status_code=status.HTTP_403_FORBIDDEN,
            details={"license_status": "HetHan"}
        )

class DuplicateResourceException(AppException):
    def __init__(self, message: str = "Dữ liệu đã tồn tại trong hệ thống", details: Optional[Any] = None):
        super().__init__(
            message=message,
            error_code="DUPLICATE_RESOURCE",
            status_code=status.HTTP_400_BAD_REQUEST,
            details=details
        )

class BusinessRuleViolationException(AppException):
    def __init__(self, message: str, error_code: str = "BUSINESS_RULE_VIOLATION", details: Optional[Any] = None):
        super().__init__(
            message=message,
            error_code=error_code,
            status_code=status.HTTP_400_BAD_REQUEST,
            details=details
        )

def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppException)
    async def app_exception_handler(request: Request, exc: AppException):
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "success": False,
                "error_code": exc.error_code,
                "message": exc.message,
                "details": exc.details
            }
        )

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request: Request, exc: StarletteHTTPException):
        error_code = "HTTP_ERROR"
        if exc.status_code == status.HTTP_401_UNAUTHORIZED:
            error_code = "UNAUTHORIZED"
        elif exc.status_code == status.HTTP_403_FORBIDDEN:
            error_code = "FORBIDDEN"
        elif exc.status_code == status.HTTP_404_NOT_FOUND:
            error_code = "RESOURCE_NOT_FOUND"

        return JSONResponse(
            status_code=exc.status_code,
            content={
                "success": False,
                "error_code": error_code,
                "message": str(exc.detail),
                "details": None
            }
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "success": False,
                "error_code": "VALIDATION_ERROR",
                "message": "Dữ liệu gửi lên không đúng định dạng",
                "details": jsonable_encoder(exc.errors())
            }
        )

    @app.exception_handler(Exception)
    async def generic_exception_handler(request: Request, exc: Exception):
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "success": False,
                "error_code": "INTERNAL_SERVER_ERROR",
                "message": f"Lỗi hệ thống: {str(exc)}",
                "details": None
            }
        )

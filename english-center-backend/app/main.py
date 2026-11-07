from contextlib import asynccontextmanager
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.exceptions import register_exception_handlers
from app.middleware.license_guard import LicenseGuardMiddleware
from app.api.v1.api import api_router
from app.tasks.scheduler import shutdown_scheduler, start_scheduler

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("english_center_backend")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan events for startup and shutdown."""
    logger.info("Initializing English Center Management Backend...")
    # Start background scheduler
    start_scheduler()
    yield
    # Shutdown background scheduler
    logger.info("Shutting down English Center Management Backend...")
    shutdown_scheduler()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan
)

# 1. CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. SaaS License Guard Middleware
app.add_middleware(LicenseGuardMiddleware)

# 3. Global Exception Handlers
register_exception_handlers(app)

# 4. Mount API v1 Routers (Prefix: /api)
app.include_router(api_router, prefix=settings.API_V1_STR)

# 5. Health Check Endpoint
@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "success": True,
        "message": "English Center Management Backend is running smoothly",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )


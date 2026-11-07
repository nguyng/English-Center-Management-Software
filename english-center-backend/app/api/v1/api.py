from fastapi import APIRouter

from app.api.v1.endpoints import (
    attendance,
    auth,
    centers,
    classes,
    dashboard,
    exams,
    results,
    sessions,
    students,
    teachers,
    zalo_logs
)

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(centers.router)
api_router.include_router(teachers.router)
api_router.include_router(classes.router)
api_router.include_router(students.router)
api_router.include_router(sessions.router)
api_router.include_router(attendance.router)
api_router.include_router(exams.router)
api_router.include_router(results.router)
api_router.include_router(zalo_logs.router)
api_router.include_router(dashboard.router)


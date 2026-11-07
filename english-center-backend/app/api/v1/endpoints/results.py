from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_tenant_id, get_current_user, get_db
from app.models.user import NguoiDung
from app.schemas.common import GenericResponse
from app.schemas.result import ResultOut, StudentResultOut
from app.services.result_service import ResultService

router = APIRouter(tags=["Results"])

@router.get("/exams/{exam_id}/results", response_model=GenericResponse[List[ResultOut]])
async def get_results_by_exam(
    exam_id: int,
    tenant_id: int = Depends(get_current_tenant_id),
    current_user: NguoiDung = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    results = await ResultService.get_results_by_exam(db, tenant_id, exam_id)
    return GenericResponse(success=True, data=results, message="Kết quả bài kiểm tra")

@router.get("/students/{student_id}/results", response_model=GenericResponse[List[StudentResultOut]])
async def get_results_by_student(
    student_id: int,
    tenant_id: int = Depends(get_current_tenant_id),
    current_user: NguoiDung = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    results = await ResultService.get_results_by_student(db, tenant_id, student_id)
    return GenericResponse(success=True, data=results, message="Lịch sử điểm số học sinh")


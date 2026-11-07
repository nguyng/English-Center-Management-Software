from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_tenant_id, get_current_user, get_db
from app.models.user import NguoiDung
from app.schemas.common import GenericResponse
from app.schemas.exam import (
    ExamCreate,
    ExamOut,
    ExamPublicOut,
    ExamSubmitIn,
    ManualScoresIn,
    QuestionIn
)
from app.services.exam_service import ExamService
from app.services.result_service import ResultService

router = APIRouter(prefix="/exams", tags=["Exams"])

@router.post("", response_model=GenericResponse[ExamOut])
async def create_exam(
    data: ExamCreate,
    tenant_id: int = Depends(get_current_tenant_id),
    current_user: NguoiDung = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    exam = await ExamService.create_exam(db, tenant_id, data)
    return GenericResponse(success=True, data=exam, message="Tạo bài kiểm tra thành công")

@router.get("", response_model=GenericResponse[List[ExamOut]])
async def get_exams(
    buoi_hoc_id: Optional[int] = Query(None),
    tenant_id: int = Depends(get_current_tenant_id),
    current_user: NguoiDung = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    exams = await ExamService.get_exams(db, tenant_id, buoi_hoc_id=buoi_hoc_id)
    return GenericResponse(success=True, data=exams, message="Danh sách bài kiểm tra")

@router.get("/{exam_id}", response_model=GenericResponse[ExamPublicOut])
async def get_exam_public_for_student(
    exam_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Public portal for students to take exam without login.
    DOES NOT RETURN dap_an_dung TO PREVENT CHEATING.
    """
    exam = await ExamService.get_exam_public(db, exam_id)
    return GenericResponse(success=True, data=exam, message="Đề thi trực tuyến")

@router.post("/{exam_id}/questions", response_model=GenericResponse[ExamOut])
async def add_questions_to_exam(
    exam_id: int,
    payload: Dict[str, List[QuestionIn]],
    tenant_id: int = Depends(get_current_tenant_id),
    current_user: NguoiDung = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    questions = payload.get("questions", [])
    exam = await ExamService.add_questions(db, tenant_id, exam_id, questions)
    return GenericResponse(success=True, data=exam, message="Thêm câu hỏi vào đề thi thành công")

@router.post("/{exam_id}/submit", response_model=GenericResponse[Dict[str, Any]])
async def submit_exam_online(
    exam_id: int,
    data: ExamSubmitIn,
    db: AsyncSession = Depends(get_db)
):
    """Public submission endpoint for online exams."""
    result = await ExamService.submit_exam(db, exam_id, data)
    return GenericResponse(success=True, data=result, message="Nộp bài và chấm điểm thành công")

@router.post("/{exam_id}/manual-scores", response_model=GenericResponse[Dict[str, Any]])
async def save_manual_paper_scores(
    exam_id: int,
    data: ManualScoresIn,
    tenant_id: int = Depends(get_current_tenant_id),
    current_user: NguoiDung = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await ResultService.save_manual_scores(
        db,
        tenant_id=tenant_id,
        current_user=current_user,
        exam_id=exam_id,
        data=data
    )
    return GenericResponse(success=True, data=result, message="Lưu điểm thi giấy thành công")


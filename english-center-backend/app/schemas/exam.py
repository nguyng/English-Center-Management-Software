from datetime import date
from typing import Dict, List, Optional
from pydantic import BaseModel, Field, field_validator

class QuestionIn(BaseModel):
    thu_tu: Optional[int] = 1
    noi_dung: str
    dap_an_a: str
    dap_an_b: str
    dap_an_c: str
    dap_an_d: str
    dap_an_dung: str = Field(..., pattern=r"^[A-Da-d]$")

    @field_validator("dap_an_dung")
    def normalize_correct_answer(cls, v: str) -> str:
        return v.strip().upper()

class QuestionPublicOut(BaseModel):
    id: int
    thu_tu: int
    noi_dung: str
    dap_an_a: str
    dap_an_b: str
    dap_an_c: str
    dap_an_d: str

class ExamCreate(BaseModel):
    ten_bai_kiem_tra: str = Field(..., min_length=2, max_length=150)
    hinh_thuc: str = Field(..., pattern=r"^(he_thong|giay)$")
    thoi_gian_phut: int = Field(default=15, ge=1, le=180)
    buoi_hoc_id: Optional[int] = None
    ngay_kiem_tra: Optional[date] = None
    questions: Optional[List[QuestionIn]] = None

class ExamPublicOut(BaseModel):
    id: int
    ten_bai_kiem_tra: str
    hinh_thuc: str
    thoi_gian_phut: int
    ngay_kiem_tra: date
    questions: List[QuestionPublicOut]
    students: List[dict]

class ExamSubmitIn(BaseModel):
    hoc_sinh_id: int
    answers: Dict[str, str] = Field(..., description="Mapping question_id to selected answer (A/B/C/D)")
    tab_violations: int = 0
    is_auto_submit: bool = False

class ManualScoresIn(BaseModel):
    scores: Dict[str, Optional[float]] = Field(
        ...,
        description="Mapping student_id to score 0.0 - 10.0"
    )
    scheduleForMorning: bool = False

    @field_validator("scores")
    def validate_scores_range(cls, v: Dict[str, Optional[float]]) -> Dict[str, Optional[float]]:
        for sid, score in v.items():
            if score is not None:
                if score < 0.0 or score > 10.0:
                    raise ValueError(f"Điểm số của học sinh {sid} phải nằm trong khoảng từ 0.0 đến 10.0")
        return v

class ExamOut(BaseModel):
    id: int
    ten_bai_kiem_tra: str
    hinh_thuc: str
    thoi_gian_phut: int
    ngay_kiem_tra: date
    buoi_hoc_id: Optional[int] = None
    so_cau_hoi: int = 0


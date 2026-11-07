from datetime import date, datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, field_validator

def validate_time_str(v: Optional[str]) -> Optional[str]:
    if v is None:
        return v
    v = v.strip()
    parts = v.split(":")
    if len(parts) != 2:
        raise ValueError("Thời gian phải có định dạng HH:mm")
    try:
        hour, minute = int(parts[0]), int(parts[1])
    except ValueError:
        raise ValueError("Thời gian không hợp lệ")
    if not (0 <= hour <= 23 and 0 <= minute <= 59):
        raise ValueError("Giờ phải từ 00 đến 23 và phút từ 00 đến 59")
    return f"{hour:02d}:{minute:02d}"

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

class QuestionTeacherOut(BaseModel):
    id: int
    thu_tu: int
    noi_dung: str
    dap_an_a: str
    dap_an_b: str
    dap_an_c: str
    dap_an_d: str
    dap_an_dung: str

class ExamCreate(BaseModel):
    ten_bai_kiem_tra: str = Field(..., min_length=2, max_length=150)
    hinh_thuc: str = Field(..., pattern=r"^(he_thong|giay)$")
    thoi_gian_phut: int = Field(default=15, ge=1, le=180)
    buoi_hoc_id: Optional[int] = None
    ngay_kiem_tra: Optional[date] = None
    gio_mo_de: Optional[str] = Field(default="08:00")
    gio_dong_de: Optional[str] = Field(default="22:00")
    ma_vao_thi: Optional[str] = Field(default="1234", max_length=20)
    questions: Optional[List[QuestionIn]] = None

    @field_validator("gio_mo_de", "gio_dong_de")
    def validate_exam_times(cls, v: Optional[str]) -> Optional[str]:
        return validate_time_str(v)

class ExamPublicOut(BaseModel):
    id: int
    ten_bai_kiem_tra: str
    hinh_thuc: str
    thoi_gian_phut: int
    ngay_kiem_tra: date
    gio_mo_de: Optional[str] = "08:00"
    gio_dong_de: Optional[str] = "22:00"
    questions: List[QuestionPublicOut]
    students: List[dict]

class ExamOut(BaseModel):
    id: int
    ten_bai_kiem_tra: str
    hinh_thuc: str
    thoi_gian_phut: int
    ngay_kiem_tra: date
    gio_mo_de: Optional[str] = "08:00"
    gio_dong_de: Optional[str] = "22:00"
    ma_vao_thi: Optional[str] = "1234"
    buoi_hoc_id: Optional[int] = None
    so_cau_hoi: int = 0

class ExamPinVerifyIn(BaseModel):
    ma_vao_thi: str = Field(..., min_length=1, max_length=20)
    hoc_sinh_id: Optional[int] = None

class ExamPinVerifyOut(BaseModel):
    exam_token: str
    exam_id: int
    hoc_sinh_id: Optional[int] = None
    expires_in: int

class ExamSubmitIn(BaseModel):
    hoc_sinh_id: Optional[int] = None
    answers: Dict[str, str] = Field(default_factory=dict, description="Mapping question_id to selected answer (A/B/C/D)")
    tab_violations: int = 0
    is_auto_submit: bool = False
    is_preview: bool = False
    exam_token: Optional[str] = None
    ma_vao_thi: Optional[str] = None

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

class StudentExamStatusOut(BaseModel):
    hoc_sinh_id: int
    ho_ten: str
    submitted: bool
    diem_so: Optional[float] = None
    so_cau_dung: Optional[int] = None
    xep_loai: Optional[str] = None
    thoi_gian_nop: Optional[datetime] = None
    so_lan_roi_tab: int = 0
    chi_tiet_tra_loi: Optional[Dict[str, Any]] = None

class ExamTeacherDetailOut(BaseModel):
    id: int
    ten_bai_kiem_tra: str
    hinh_thuc: str
    thoi_gian_phut: int
    ngay_kiem_tra: date
    gio_mo_de: Optional[str] = None
    gio_dong_de: Optional[str] = None
    ma_vao_thi: Optional[str] = None
    buoi_hoc_id: Optional[int] = None
    lop_id: Optional[int] = None
    ten_lop: Optional[str] = None
    questions: List[QuestionTeacherOut]
    students: List[StudentExamStatusOut]

class SendZaloResultsOut(BaseModel):
    total_eligible: int
    sent: int
    skipped_already_sent: int
    failed: int
    details: List[Dict[str, Any]] = []

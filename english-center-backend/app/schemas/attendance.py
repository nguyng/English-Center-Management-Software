from typing import Dict, List, Optional
from pydantic import BaseModel, Field

class AttendanceStudentItem(BaseModel):
    id: int
    ho_ten: str
    sdt_phu_huynh: str
    trang_thai: str = "CoMat"  # CoMat or Vang
    ghi_chu: Optional[str] = None
    diem_thi_giay: Optional[float] = None

class AttendanceSessionDetailOut(BaseModel):
    session: dict
    students: List[AttendanceStudentItem]

class AttendanceSaveIn(BaseModel):
    attendance: Dict[str, str] = Field(..., description="Mapping student_id to CoMat or Vang")
    sendZalo: bool = False
    scores: Optional[Dict[str, Optional[float]]] = Field(
        default=None,
        description="Optional paper exam scores when attendance includes paper exam"
    )


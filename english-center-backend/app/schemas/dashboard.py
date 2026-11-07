from datetime import date
from pydantic import BaseModel

class DashboardStatsOut(BaseModel):
    totalStudents: int
    totalClasses: int
    totalTeachers: int
    totalMessagesSent: int

class AttendanceAlertItem(BaseModel):
    id: int
    lop: str
    giao_vien: str
    ca: str
    ca_hoc: str
    gio_bat_dau: str
    gio_ket_thuc: str
    ngay_hoc: date
    trang_thai: str


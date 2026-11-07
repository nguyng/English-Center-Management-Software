from enum import Enum

class UserRole(str, Enum):
    SUPER_ADMIN = "SuperAdmin"
    ADMIN = "Admin"
    TEACHER = "GiaoVien"

class UserStatus(str, Enum):
    ACTIVE = "HoatDong"
    LOCKED = "Khoa"

class LicenseStatus(str, Enum):
    ACTIVE = "HoatDong"
    EXPIRED = "HetHan"

class StudentStatus(str, Enum):
    STUDYING = "DangHoc"
    RESERVED = "BaoLuu"
    DROPPED = "DaNghi"

class SessionStatus(str, Enum):
    NORMAL = "BinhThuong"
    HOLIDAY = "NghiLe"
    CANCELLED = "DaHuy"

class SessionAttendanceStatus(str, Enum):
    NOT_TAKEN = "chua_diem_danh"
    TAKEN = "da_diem_danh"

class AttendanceState(str, Enum):
    PRESENT = "CoMat"
    ABSENT = "Vang"

class ExamFormat(str, Enum):
    ONLINE = "he_thong"
    PAPER = "giay"

class ZaloMessageType(str, Enum):
    ABSENT_NOTICE = "bao_vang"
    SCORE_NOTICE = "bao_diem"

class ZaloMessageStatus(str, Enum):
    SUCCESS = "ThanhCong"
    FAILED = "ThatBai"
    OUT_OF_BALANCE = "HetTien"
    DEMO = "Demo"

class ScheduleTaskStatus(str, Enum):
    PENDING = "ChoGui"
    PROCESSED = "DaXuLy"
    CANCELLED = "DaHuy"

# Vietnamese Mobile Phone Regex (10 digits starting with 03, 05, 07, 08, 09)
VN_PHONE_REGEX = r"^(0[35789])\d{8}$"

# Safe Notification Sending Hours
SAFE_HOURS_START = "07:00"
SAFE_HOURS_END = "21:30"
MORNING_SCHEDULE_TIME = "07:30"


import asyncio
from datetime import date, datetime, time, timedelta, timezone
import sys
import os

# Add parent directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from decimal import Decimal
from sqlalchemy import select
from app.core.database import AsyncSessionLocal, Base, engine
from app.core.constants import (
    ExamFormat,
    LicenseStatus,
    SessionAttendanceStatus,
    SessionStatus,
    StudentStatus,
    UserRole,
    UserStatus
)
from app.core.security import hash_password
from app.models.center import TrungTam
from app.models.user import NguoiDung
from app.models.class_room import LopHoc
from app.models.student import HocSinh
from app.models.session import BuoiHoc
from app.models.exam import BaiKiemTra, CauHoi
from app.models.result import KetQua

async def seed_all():
    print("🌱 Bắt đầu nạp dữ liệu mẫu (Seed Data)...")
    async with engine.begin() as conn:
        # Create all tables if not exist
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        # Check if already seeded
        check = await db.execute(select(NguoiDung).where(NguoiDung.email == "super@saas.com"))
        if check.scalar_one_or_none():
            print("ℹ️ Dữ liệu đã được nạp trước đó. Bỏ qua.")
            return

        today = date.today()

        # 1. SuperAdmin User
        super_admin = NguoiDung(
            trung_tam_id=None,
            ho_ten="Chủ Nền Tảng SaaS",
            email="super@saas.com",
            sdt="0988888888",
            mat_khau_hash=hash_password("Password123@"),
            vai_tro=UserRole.SUPER_ADMIN.value,
            trang_thai=UserStatus.ACTIVE.value
        )
        db.add(super_admin)

        # 2. Centers
        # Center 1: Active
        center1 = TrungTam(
            ten_trung_tam="Anh Ngữ Cleverlearn Cầu Giấy",
            sdt_admin="0901234567",
            ngay_het_han_saas=today + timedelta(days=365),
            trang_thai_ban_quyen=LicenseStatus.ACTIVE.value,
            zalo_oa_id="zalo_oa_cleverlearn_demo"
        )
        # Center 2: Expired License (to test LicenseGuard)
        center2 = TrungTam(
            ten_trung_tam="Trung Tâm Ngoại Ngữ Thăng Long",
            sdt_admin="0912345678",
            ngay_het_han_saas=today - timedelta(days=15),
            trang_thai_ban_quyen=LicenseStatus.EXPIRED.value
        )
        db.add_all([center1, center2])
        await db.flush()

        # 3. Center Admins & Teachers
        admin1 = NguoiDung(
            trung_tam_id=center1.id,
            ho_ten="Admin Cleverlearn",
            email="admin@center.edu.vn",
            sdt="0901234567",
            mat_khau_hash=hash_password("Password123@"),
            vai_tro=UserRole.ADMIN.value,
            trang_thai=UserStatus.ACTIVE.value
        )
        teacher1 = NguoiDung(
            trung_tam_id=center1.id,
            ho_ten="Nguyễn Văn A",
            email="teacher@center.edu.vn",
            sdt="0945678901",
            mat_khau_hash=hash_password("Password123@"),
            vai_tro=UserRole.TEACHER.value,
            trang_thai=UserStatus.ACTIVE.value
        )
        teacher2 = NguoiDung(
            trung_tam_id=center1.id,
            ho_ten="Trần Thị B",
            email="teacher.b@center.edu.vn",
            sdt="0945678902",
            mat_khau_hash=hash_password("Password123@"),
            vai_tro=UserRole.TEACHER.value,
            trang_thai=UserStatus.ACTIVE.value
        )

        admin2 = NguoiDung(
            trung_tam_id=center2.id,
            ho_ten="Admin Thăng Long",
            email="admin@thanglong.edu.vn",
            sdt="0912345678",
            mat_khau_hash=hash_password("Password123@"),
            vai_tro=UserRole.ADMIN.value,
            trang_thai=UserStatus.ACTIVE.value
        )

        db.add_all([admin1, teacher1, teacher2, admin2])
        await db.flush()

        # 4. Classes (Center 1)
        class1 = LopHoc(
            trung_tam_id=center1.id,
            ma_lop="A1-2026",
            ten_lop="Lớp A1 - Starter",
            giao_vien_id=teacher1.id
        )
        class2 = LopHoc(
            trung_tam_id=center1.id,
            ma_lop="B2-2026",
            ten_lop="Lớp B2 - Intermediate",
            giao_vien_id=teacher2.id
        )
        class3 = LopHoc(
            trung_tam_id=center1.id,
            ma_lop="C1-2026",
            ten_lop="Lớp C1 - Advanced",
            giao_vien_id=teacher1.id
        )
        db.add_all([class1, class2, class3])
        await db.flush()

        # 5. Students (Center 1)
        # Class 1: 15 students (13 DangHoc, 1 BaoLuu, 1 DaNghi)
        student_names = [
            "Nguyễn Văn An", "Trần Thị Bình", "Lê Hoàng Cường", "Phạm Thu Dung",
            "Đặng Minh Đức", "Vũ Hoàng Giang", "Hoàng Thu Hà", "Bùi Thanh Hải",
            "Ngô Quốc Hưng", "Dương Thuỳ Linh", "Lý Gia Long", "Mai Hải Nam",
            "Đỗ Trúc Quỳnh", "Hồ Nhật Quang", "Tạ Uyên Thư"
        ]
        students_c1 = []
        for idx, name in enumerate(student_names, start=1):
            phone = f"09012345{idx:02d}"
            status = StudentStatus.STUDYING.value
            if idx == 14:
                status = StudentStatus.RESERVED.value
            elif idx == 15:
                status = StudentStatus.DROPPED.value

            stu = HocSinh(
                trung_tam_id=center1.id,
                lop_id=class1.id,
                ho_ten=name,
                sdt_phu_huynh=phone,
                ngay_nhap_hoc=today - timedelta(days=60),
                trang_thai=status
            )
            students_c1.append(stu)
        db.add_all(students_c1)

        # 6. Sessions (Center 1)
        session1 = BuoiHoc(
            trung_tam_id=center1.id,
            lop_id=class1.id,
            ngay_hoc=today,
            ca_hoc="17:30 - 19:00",
            gio_bat_dau=time(17, 30),
            gio_ket_thuc=time(19, 0),
            co_kiem_tra=True,
            da_gui=False,
            trang_thai_diem_danh=SessionAttendanceStatus.NOT_TAKEN.value,
            trang_thai_buoi_hoc=SessionStatus.NORMAL.value
        )
        session2 = BuoiHoc(
            trung_tam_id=center1.id,
            lop_id=class2.id,
            ngay_hoc=today,
            ca_hoc="19:00 - 20:30",
            gio_bat_dau=time(19, 0),
            gio_ket_thuc=time(20, 30),
            co_kiem_tra=False,
            da_gui=False,
            trang_thai_diem_danh=SessionAttendanceStatus.NOT_TAKEN.value,
            trang_thai_buoi_hoc=SessionStatus.NORMAL.value
        )
        # Holiday session (NghiLe)
        session_holiday = BuoiHoc(
            trung_tam_id=center1.id,
            lop_id=class1.id,
            ngay_hoc=today + timedelta(days=1),
            ca_hoc="17:30 - 19:00",
            gio_bat_dau=time(17, 30),
            gio_ket_thuc=time(19, 0),
            co_kiem_tra=False,
            da_gui=False,
            trang_thai_diem_danh=SessionAttendanceStatus.NOT_TAKEN.value,
            trang_thai_buoi_hoc=SessionStatus.HOLIDAY.value,
            ly_do_huy="Nghỉ lễ theo lịch trung tâm"
        )
        # Cancelled session (DaHuy)
        session_cancelled = BuoiHoc(
            trung_tam_id=center1.id,
            lop_id=class2.id,
            ngay_hoc=today + timedelta(days=2),
            ca_hoc="19:00 - 20:30",
            gio_bat_dau=time(19, 0),
            gio_ket_thuc=time(20, 30),
            co_kiem_tra=False,
            da_gui=False,
            trang_thai_diem_danh=SessionAttendanceStatus.NOT_TAKEN.value,
            trang_thai_buoi_hoc=SessionStatus.CANCELLED.value,
            ly_do_huy="Hủy đột xuất do thời tiết xấu"
        )
        db.add_all([session1, session2, session_holiday, session_cancelled])
        await db.flush()

        # 7. Sample Online Exam with Fixed Time Slot and PIN
        exam1 = BaiKiemTra(
            trung_tam_id=center1.id,
            buoi_hoc_id=session1.id,
            ten_bai_kiem_tra="Kiểm tra Từ vựng Unit 3",
            hinh_thuc=ExamFormat.ONLINE.value,
            ngay_kiem_tra=today,
            thoi_gian_phut=15,
            gio_mo_de="08:00",
            gio_dong_de="22:00",
            ma_vao_thi="1234"
        )
        db.add(exam1)
        await db.flush()

        questions_data = [
            ("What is the synonym of 'happy'?", "Joyful", "Sad", "Angry", "Tired", "A"),
            ("Choose the correct past tense of 'go':", "Goed", "Went", "Gone", "Going", "B"),
            ("Which word means 'ngôi nhà' in English?", "Tree", "School", "House", "Car", "C"),
            ("Choose the correct spelling:", "Recieve", "Receive", "Receeve", "Receiv", "B"),
            ("What is the opposite of 'difficult'?", "Hard", "Easy", "Complex", "Heavy", "B"),
        ]
        for idx, q in enumerate(questions_data, start=1):
            q_obj = CauHoi(
                bai_kiem_tra_id=exam1.id,
                thu_tu=idx,
                noi_dung=q[0],
                dap_an_a=q[1],
                dap_an_b=q[2],
                dap_an_c=q[3],
                dap_an_d=q[4],
                dap_an_dung=q[5]
            )
            db.add(q_obj)

        await db.flush()

        # 8. Sample Exam Results with chi_tiet_tra_loi
        res1 = KetQua(
            trung_tam_id=center1.id,
            bai_kiem_tra_id=exam1.id,
            hoc_sinh_id=students_c1[0].id,
            diem_so=Decimal("10.0"),
            so_lan_roi_tab=0,
            chi_tiet_tra_loi={
                "1": {"selected": "A", "is_correct": True},
                "2": {"selected": "B", "is_correct": True},
                "3": {"selected": "C", "is_correct": True},
                "4": {"selected": "B", "is_correct": True},
                "5": {"selected": "B", "is_correct": True}
            },
            thoi_gian_nop=datetime.now(timezone.utc)
        )
        res2 = KetQua(
            trung_tam_id=center1.id,
            bai_kiem_tra_id=exam1.id,
            hoc_sinh_id=students_c1[1].id,
            diem_so=Decimal("8.0"),
            so_lan_roi_tab=1,
            chi_tiet_tra_loi={
                "1": {"selected": "A", "is_correct": True},
                "2": {"selected": "B", "is_correct": True},
                "3": {"selected": "C", "is_correct": True},
                "4": {"selected": "B", "is_correct": True},
                "5": {"selected": "A", "is_correct": False}
            },
            thoi_gian_nop=datetime.now(timezone.utc)
        )
        db.add_all([res1, res2])

        await db.commit()
        print("✅ Nạp dữ liệu mẫu hoàn tất thành công!")
        print("--------------------------------------------------")
        print("🔑 Tài khoản Super Admin: super@saas.com / Password123@")
        print("🏢 Tài khoản Admin Trung tâm: admin@center.edu.vn / Password123@")
        print("👨‍🏫 Tài khoản Giáo viên: teacher@center.edu.vn / Password123@")
        print("🏢 Tài khoản Trung tâm Hết hạn: admin@thanglong.edu.vn / Password123@")
        print("--------------------------------------------------")

if __name__ == "__main__":
    asyncio.run(seed_all())


import asyncio
from datetime import date, datetime, time, timedelta, timezone
from typing import AsyncGenerator
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import app.core.database as core_database
import app.middleware.license_guard as core_license_guard
from app.core.database import Base, get_db
from app.core.constants import (
    ExamFormat,
    LicenseStatus,
    SessionAttendanceStatus,
    SessionStatus,
    StudentStatus,
    UserRole,
    UserStatus
)
from app.core.security import create_access_token, hash_password
from app.main import app
from app.models.center import TrungTam
from app.models.user import NguoiDung
from app.models.class_room import LopHoc
from app.models.student import HocSinh
from app.models.session import BuoiHoc
from app.models.attendance import DiemDanh
from app.models.exam import BaiKiemTra, CauHoi

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    echo=False
)

TestSessionLocal = async_sessionmaker(
    bind=test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False
)

# Patch global sessionmakers to use TestSessionLocal in tests
core_database.AsyncSessionLocal = TestSessionLocal
core_license_guard.AsyncSessionLocal = TestSessionLocal

@pytest_asyncio.fixture(scope="function")
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with TestSessionLocal() as session:
        yield session
        await session.rollback()

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

@pytest_asyncio.fixture(scope="function")
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as ac:
        yield ac

    app.dependency_overrides.clear()

@pytest_asyncio.fixture(scope="function")
async def test_data(db_session: AsyncSession):
    """Seed basic test data for 1 active center and 1 expired center."""
    today = date.today()

    # Active Center
    center1 = TrungTam(
        ten_trung_tam="Cleverlearn Test Center",
        sdt_admin="0901112233",
        ngay_het_han_saas=today + timedelta(days=365),
        trang_thai_ban_quyen=LicenseStatus.ACTIVE.value
    )
    # Expired Center
    center2 = TrungTam(
        ten_trung_tam="Expired Test Center",
        sdt_admin="0909998877",
        ngay_het_han_saas=today - timedelta(days=10),
        trang_thai_ban_quyen=LicenseStatus.EXPIRED.value
    )
    db_session.add_all([center1, center2])
    await db_session.flush()

    # SuperAdmin
    superadmin = NguoiDung(
        trung_tam_id=None,
        ho_ten="Super Admin",
        email="super@test.com",
        mat_khau_hash=hash_password("Password123@"),
        vai_tro=UserRole.SUPER_ADMIN.value,
        trang_thai=UserStatus.ACTIVE.value
    )
    # Admin 1
    admin1 = NguoiDung(
        trung_tam_id=center1.id,
        ho_ten="Admin Center 1",
        email="admin1@test.com",
        mat_khau_hash=hash_password("Password123@"),
        vai_tro=UserRole.ADMIN.value,
        trang_thai=UserStatus.ACTIVE.value
    )
    # Teacher 1 (Center 1)
    teacher1 = NguoiDung(
        trung_tam_id=center1.id,
        ho_ten="Teacher A",
        email="teacher1@test.com",
        mat_khau_hash=hash_password("Password123@"),
        vai_tro=UserRole.TEACHER.value,
        trang_thai=UserStatus.ACTIVE.value
    )
    # Teacher 2 (Center 1)
    teacher2 = NguoiDung(
        trung_tam_id=center1.id,
        ho_ten="Teacher B",
        email="teacher2@test.com",
        mat_khau_hash=hash_password("Password123@"),
        vai_tro=UserRole.TEACHER.value,
        trang_thai=UserStatus.ACTIVE.value
    )
    # Admin 2 (Expired Center)
    admin2 = NguoiDung(
        trung_tam_id=center2.id,
        ho_ten="Admin Expired",
        email="admin2@test.com",
        mat_khau_hash=hash_password("Password123@"),
        vai_tro=UserRole.ADMIN.value,
        trang_thai=UserStatus.ACTIVE.value
    )

    db_session.add_all([superadmin, admin1, teacher1, teacher2, admin2])
    await db_session.flush()

    # Classes in Center 1
    class1 = LopHoc(
        trung_tam_id=center1.id,
        ma_lop="A1-TEST",
        ten_lop="Class A1",
        giao_vien_id=teacher1.id
    )
    class2 = LopHoc(
        trung_tam_id=center1.id,
        ma_lop="B2-TEST",
        ten_lop="Class B2",
        giao_vien_id=teacher2.id
    )
    db_session.add_all([class1, class2])
    await db_session.flush()

    # Students in Center 1
    student1 = HocSinh(
        trung_tam_id=center1.id,
        lop_id=class1.id,
        ho_ten="Student 1 Studying",
        sdt_phu_huynh="0901234501",
        ngay_nhap_hoc=today,
        trang_thai=StudentStatus.STUDYING.value
    )
    student2 = HocSinh(
        trung_tam_id=center1.id,
        lop_id=class1.id,
        ho_ten="Student 2 Studying",
        sdt_phu_huynh="0901234502",
        ngay_nhap_hoc=today,
        trang_thai=StudentStatus.STUDYING.value
    )
    student_reserved = HocSinh(
        trung_tam_id=center1.id,
        lop_id=class1.id,
        ho_ten="Student Reserved",
        sdt_phu_huynh="0901234503",
        ngay_nhap_hoc=today,
        trang_thai=StudentStatus.RESERVED.value
    )
    student_dropped = HocSinh(
        trung_tam_id=center1.id,
        lop_id=class1.id,
        ho_ten="Student Dropped",
        sdt_phu_huynh="0901234504",
        ngay_nhap_hoc=today,
        trang_thai=StudentStatus.DROPPED.value
    )
    db_session.add_all([student1, student2, student_reserved, student_dropped])
    await db_session.flush()

    # Session in Center 1
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
    db_session.add(session1)
    await db_session.flush()

    # Exam in Center 1
    exam1 = BaiKiemTra(
        trung_tam_id=center1.id,
        buoi_hoc_id=session1.id,
        ten_bai_kiem_tra="Quiz Unit 1",
        hinh_thuc=ExamFormat.ONLINE.value,
        ngay_kiem_tra=today,
        thoi_gian_phut=15
    )
    db_session.add(exam1)
    await db_session.flush()

    q1 = CauHoi(
        bai_kiem_tra_id=exam1.id,
        thu_tu=1,
        noi_dung="Capital of France?",
        dap_an_a="London",
        dap_an_b="Paris",
        dap_an_c="Berlin",
        dap_an_d="Madrid",
        dap_an_dung="B"
    )
    q2 = CauHoi(
        bai_kiem_tra_id=exam1.id,
        thu_tu=2,
        noi_dung="2 + 2 = ?",
        dap_an_a="3",
        dap_an_b="4",
        dap_an_c="5",
        dap_an_d="6",
        dap_an_dung="B"
    )
    db_session.add_all([q1, q2])

    await db_session.commit()

    # Tokens
    super_token = create_access_token({
        "id": superadmin.id,
        "ho_ten": superadmin.ho_ten,
        "email": superadmin.email,
        "vai_tro": superadmin.vai_tro,
        "trung_tam_id": None
    })
    admin1_token = create_access_token({
        "id": admin1.id,
        "ho_ten": admin1.ho_ten,
        "email": admin1.email,
        "vai_tro": admin1.vai_tro,
        "trung_tam_id": center1.id
    })
    teacher1_token = create_access_token({
        "id": teacher1.id,
        "ho_ten": teacher1.ho_ten,
        "email": teacher1.email,
        "vai_tro": teacher1.vai_tro,
        "trung_tam_id": center1.id
    })
    teacher2_token = create_access_token({
        "id": teacher2.id,
        "ho_ten": teacher2.ho_ten,
        "email": teacher2.email,
        "vai_tro": teacher2.vai_tro,
        "trung_tam_id": center1.id
    })
    admin2_token = create_access_token({
        "id": admin2.id,
        "ho_ten": admin2.ho_ten,
        "email": admin2.email,
        "vai_tro": admin2.vai_tro,
        "trung_tam_id": center2.id
    })

    return {
        "center1": center1,
        "center2": center2,
        "superadmin": superadmin,
        "admin1": admin1,
        "teacher1": teacher1,
        "teacher2": teacher2,
        "admin2": admin2,
        "class1": class1,
        "class2": class2,
        "student1": student1,
        "student2": student2,
        "student_reserved": student_reserved,
        "student_dropped": student_dropped,
        "session1": session1,
        "exam1": exam1,
        "q1": q1,
        "q2": q2,
        "tokens": {
            "super": super_token,
            "admin1": admin1_token,
            "teacher1": teacher1_token,
            "teacher2": teacher2_token,
            "admin2": admin2_token
        }
    }

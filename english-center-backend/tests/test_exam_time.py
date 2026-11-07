from datetime import date, datetime, timedelta
import pytest
from httpx import AsyncClient
from sqlalchemy import select
from app.models.exam import BaiKiemTra, CauHoi

@pytest.mark.asyncio
async def test_exam_create_valid_and_invalid_time_format(client: AsyncClient, test_data):
    """Test validation of fixed time format HH:mm during exam creation."""
    admin_token = test_data["tokens"]["admin1"]
    session1_id = test_data["session1"].id

    # 1. Invalid time format (e.g. 25:99) -> 422
    resp_invalid = await client.post(
        "/api/exams",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "ten_bai_kiem_tra": "Đề thi giờ sai",
            "hinh_thuc": "he_thong",
            "thoi_gian_phut": 15,
            "buoi_hoc_id": session1_id,
            "gio_mo_de": "25:00",
            "gio_dong_de": "10:00"
        }
    )
    assert resp_invalid.status_code == 422

    # 2. Valid time format (e.g. 09:30 -> 11:00) -> 200
    resp_valid = await client.post(
        "/api/exams",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "ten_bai_kiem_tra": "Đề thi chuẩn giờ",
            "hinh_thuc": "he_thong",
            "thoi_gian_phut": 20,
            "buoi_hoc_id": session1_id,
            "gio_mo_de": "09:30",
            "gio_dong_de": "11:00",
            "ma_vao_thi": "9999"
        }
    )
    assert resp_valid.status_code == 200
    data = resp_valid.json()["data"]
    assert data["gio_mo_de"] == "09:30"
    assert data["gio_dong_de"] == "11:00"
    assert data["ma_vao_thi"] == "9999"

@pytest.mark.asyncio
async def test_exam_time_before_open_is_blocked(client: AsyncClient, test_data, db_session):
    """Accessing or submitting exam before gio_mo_de must be blocked with EXAM_NOT_STARTED."""
    today = date.today()
    center1_id = test_data["center1"].id
    session1_id = test_data["session1"].id
    student1_id = test_data["student1"].id

    # Create exam opening at 23:55 (far in the future today)
    exam_future = BaiKiemTra(
        trung_tam_id=center1_id,
        buoi_hoc_id=session1_id,
        ten_bai_kiem_tra="Đề thi chưa mở",
        hinh_thuc="he_thong",
        ngay_kiem_tra=today,
        thoi_gian_phut=15,
        gio_mo_de="23:55",
        gio_dong_de="23:59",
        ma_vao_thi=None
    )
    db_session.add(exam_future)
    await db_session.flush()

    q = CauHoi(
        bai_kiem_tra_id=exam_future.id,
        thu_tu=1,
        noi_dung="Test Q?",
        dap_an_a="A", dap_an_b="B", dap_an_c="C", dap_an_d="D",
        dap_an_dung="A"
    )
    db_session.add(q)
    await db_session.commit()

    resp = await client.post(
        f"/api/exams/{exam_future.id}/submit",
        json={
            "hoc_sinh_id": student1_id,
            "answers": {str(q.id): "A"},
            "tab_violations": 0
        }
    )
    assert resp.status_code == 400
    data = resp.json()
    assert data["success"] is False
    assert data["error_code"] == "EXAM_NOT_STARTED"

@pytest.mark.asyncio
async def test_exam_time_after_close_is_blocked(client: AsyncClient, test_data, db_session):
    """Submitting exam after gio_dong_de must be blocked with EXAM_CLOSED."""
    today = date.today()
    center1_id = test_data["center1"].id
    session1_id = test_data["session1"].id
    student1_id = test_data["student1"].id

    # Create exam that closed at 01:00 earlier today
    exam_past = BaiKiemTra(
        trung_tam_id=center1_id,
        buoi_hoc_id=session1_id,
        ten_bai_kiem_tra="Đề thi đã đóng cổng",
        hinh_thuc="he_thong",
        ngay_kiem_tra=today,
        thoi_gian_phut=15,
        gio_mo_de="00:30",
        gio_dong_de="01:00",
        ma_vao_thi=None
    )
    db_session.add(exam_past)
    await db_session.flush()

    q = CauHoi(
        bai_kiem_tra_id=exam_past.id,
        thu_tu=1,
        noi_dung="Past Q?",
        dap_an_a="A", dap_an_b="B", dap_an_c="C", dap_an_d="D",
        dap_an_dung="B"
    )
    db_session.add(q)
    await db_session.commit()

    resp = await client.post(
        f"/api/exams/{exam_past.id}/submit",
        json={
            "hoc_sinh_id": student1_id,
            "answers": {str(q.id): "B"},
            "tab_violations": 0
        }
    )
    assert resp.status_code == 400
    data = resp.json()
    assert data["success"] is False
    assert data["error_code"] == "EXAM_CLOSED"

@pytest.mark.asyncio
async def test_exam_within_window_and_public_out_hides_pin(client: AsyncClient, test_data, db_session):
    """Exam within fixed window allows submit; public GET includes gio_mo_de/gio_dong_de but HIDES ma_vao_thi."""
    today = date.today()
    center1_id = test_data["center1"].id
    session1_id = test_data["session1"].id
    student1_id = test_data["student1"].id

    exam_open = BaiKiemTra(
        trung_tam_id=center1_id,
        buoi_hoc_id=session1_id,
        ten_bai_kiem_tra="Đề thi đang mở",
        hinh_thuc="he_thong",
        ngay_kiem_tra=today,
        thoi_gian_phut=15,
        gio_mo_de="00:00",
        gio_dong_de="23:59",
        ma_vao_thi=None
    )
    db_session.add(exam_open)
    await db_session.flush()

    q = CauHoi(
        bai_kiem_tra_id=exam_open.id,
        thu_tu=1,
        noi_dung="Open Q?",
        dap_an_a="A", dap_an_b="B", dap_an_c="C", dap_an_d="D",
        dap_an_dung="C"
    )
    db_session.add(q)
    await db_session.commit()

    # Public API check
    pub_resp = await client.get(f"/api/exams/{exam_open.id}")
    assert pub_resp.status_code == 200
    pub_data = pub_resp.json()["data"]
    assert pub_data["gio_mo_de"] == "00:00"
    assert pub_data["gio_dong_de"] == "23:59"
    assert "ma_vao_thi" not in pub_data

    # Submit within window
    sub_resp = await client.post(
        f"/api/exams/{exam_open.id}/submit",
        json={
            "hoc_sinh_id": student1_id,
            "answers": {str(q.id): "C"},
            "tab_violations": 0
        }
    )
    assert sub_resp.status_code == 200
    assert sub_resp.json()["data"]["diem_so"] == 10.0


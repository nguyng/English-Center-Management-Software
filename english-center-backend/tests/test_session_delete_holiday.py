from datetime import date, time, timedelta
import pytest
from httpx import AsyncClient
from sqlalchemy import select
from app.core.constants import AttendanceState, SessionAttendanceStatus, SessionStatus
from app.models.attendance import DiemDanh
from app.models.result import KetQua
from app.models.session import BuoiHoc
from app.services.dispatcher_service import DispatcherService

@pytest.mark.asyncio
async def test_admin_delete_accidentally_created_session(client: AsyncClient, test_data, db_session):
    """Admin can safely delete a newly created session with no attendance or exam records."""
    admin_token = test_data["tokens"]["admin1"]
    center1_id = test_data["center1"].id
    class1_id = test_data["class1"].id

    # 1. Create a dummy session
    new_sess = BuoiHoc(
        trung_tam_id=center1_id,
        lop_id=class1_id,
        ngay_hoc=date.today() + timedelta(days=5),
        ca_hoc="08:00 - 09:30",
        gio_bat_dau=time(8, 0),
        gio_ket_thuc=time(9, 30),
        co_kiem_tra=False,
        da_gui=False,
        trang_thai_diem_danh=SessionAttendanceStatus.NOT_TAKEN.value,
        trang_thai_buoi_hoc=SessionStatus.NORMAL.value
    )
    db_session.add(new_sess)
    await db_session.commit()
    await db_session.refresh(new_sess)
    sess_id = new_sess.id

    # 2. Admin deletes the session
    del_resp = await client.delete(
        f"/api/sessions/{sess_id}",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert del_resp.status_code == 200
    assert del_resp.json()["success"] is True

    # 3. Check DB
    check = await db_session.get(BuoiHoc, sess_id)
    assert check is None

@pytest.mark.asyncio
async def test_teacher_cannot_delete_session(client: AsyncClient, test_data):
    """Teacher cannot delete a session (403 Forbidden)."""
    teacher_token = test_data["tokens"]["teacher1"]
    session1_id = test_data["session1"].id

    resp = await client.delete(
        f"/api/sessions/{session1_id}",
        headers={"Authorization": f"Bearer {teacher_token}"}
    )
    assert resp.status_code == 403

@pytest.mark.asyncio
async def test_admin_cannot_delete_other_tenant_session(client: AsyncClient, test_data):
    """Admin of Center 2 cannot delete session belonging to Center 1."""
    admin2_token = test_data["tokens"]["admin2"]
    session1_id = test_data["session1"].id

    resp = await client.delete(
        f"/api/sessions/{session1_id}",
        headers={"Authorization": f"Bearer {admin2_token}"}
    )
    assert resp.status_code in [403, 404]

@pytest.mark.asyncio
async def test_cannot_delete_session_with_attendance_records(client: AsyncClient, test_data, db_session):
    """Session with recorded attendance cannot be deleted (SESSION_HAS_ATTENDANCE)."""
    admin_token = test_data["tokens"]["admin1"]
    session1_id = test_data["session1"].id
    student1_id = test_data["student1"].id

    # Add attendance record
    att = DiemDanh(
        trung_tam_id=test_data["center1"].id,
        buoi_hoc_id=session1_id,
        hoc_sinh_id=student1_id,
        trang_thai=AttendanceState.PRESENT.value
    )
    db_session.add(att)
    await db_session.commit()

    resp = await client.delete(
        f"/api/sessions/{session1_id}",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert resp.status_code == 400
    assert resp.json()["error_code"] == "SESSION_HAS_ATTENDANCE"

@pytest.mark.asyncio
async def test_cannot_delete_session_with_exam_results(client: AsyncClient, test_data, db_session):
    """Session with exam results cannot be deleted (SESSION_HAS_EXAM_RESULTS)."""
    admin_token = test_data["tokens"]["admin1"]
    center1_id = test_data["center1"].id
    class1_id = test_data["class1"].id
    student1_id = test_data["student1"].id

    # Create session with exam and result
    sess = BuoiHoc(
        trung_tam_id=center1_id,
        lop_id=class1_id,
        ngay_hoc=date.today() + timedelta(days=6),
        ca_hoc="10:00 - 11:30",
        gio_bat_dau=time(10, 0),
        gio_ket_thuc=time(11, 30),
        co_kiem_tra=True,
        da_gui=False,
        trang_thai_diem_danh=SessionAttendanceStatus.NOT_TAKEN.value,
        trang_thai_buoi_hoc=SessionStatus.NORMAL.value
    )
    db_session.add(sess)
    await db_session.flush()

    from app.models.exam import BaiKiemTra
    exam = BaiKiemTra(
        trung_tam_id=center1_id,
        buoi_hoc_id=sess.id,
        ten_bai_kiem_tra="Exam in Session",
        hinh_thuc="he_thong",
        ngay_kiem_tra=date.today(),
        thoi_gian_phut=15
    )
    db_session.add(exam)
    await db_session.flush()

    from decimal import Decimal
    res = KetQua(
        trung_tam_id=center1_id,
        bai_kiem_tra_id=exam.id,
        hoc_sinh_id=student1_id,
        diem_so=Decimal("9.0"),
        so_lan_roi_tab=0
    )
    db_session.add(res)
    await db_session.commit()

    resp = await client.delete(
        f"/api/sessions/{sess.id}",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert resp.status_code == 400
    assert resp.json()["error_code"] == "SESSION_HAS_EXAM_RESULTS"

@pytest.mark.asyncio
async def test_cancel_session_with_DaHuy_and_NghiLe(client: AsyncClient, test_data):
    """Admin can cancel a session with either DaHuy or NghiLe status."""
    admin_token = test_data["tokens"]["admin1"]
    session1_id = test_data["session1"].id

    # 1. Cancel with DaHuy
    r_cancel = await client.patch(
        f"/api/sessions/{session1_id}/cancel",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"reason": "Mưa lớn ngập đường", "trang_thai_buoi_hoc": "DaHuy"}
    )
    assert r_cancel.status_code == 200
    assert r_cancel.json()["data"]["trang_thai_buoi_hoc"] == "DaHuy"
    assert r_cancel.json()["data"]["ly_do_huy"] == "Mưa lớn ngập đường"

    # 2. Cancel with NghiLe
    r_holiday = await client.patch(
        f"/api/sessions/{session1_id}/cancel",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"reason": "Nghỉ lễ Giỗ Tổ Hùng Vương", "trang_thai_buoi_hoc": "NghiLe"}
    )
    assert r_holiday.status_code == 200
    assert r_holiday.json()["data"]["trang_thai_buoi_hoc"] == "NghiLe"
    assert r_holiday.json()["data"]["ly_do_huy"] == "Nghỉ lễ Giỗ Tổ Hùng Vương"

    # 3. Invalid status -> 422
    r_invalid = await client.patch(
        f"/api/sessions/{session1_id}/cancel",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"reason": "Test", "trang_thai_buoi_hoc": "SaiTrangThai"}
    )
    assert r_invalid.status_code == 422

@pytest.mark.asyncio
async def test_dispatcher_and_cron_skip_NghiLe_session(client: AsyncClient, test_data, db_session):
    """Dispatcher automatically skips sessions marked as NghiLe without sending notifications."""
    session1 = test_data["session1"]
    session1.trang_thai_buoi_hoc = SessionStatus.HOLIDAY.value
    session1.ly_do_huy = "Nghỉ Tết Nguyên Đán"
    await db_session.commit()

    result = await DispatcherService.dispatch_session_notifications(db_session, session1.id)
    assert result["status"] == "skipped"
    assert "cancelled or holiday" in result["message"]


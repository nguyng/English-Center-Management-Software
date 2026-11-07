import pytest
from httpx import AsyncClient
from sqlalchemy import select
from app.models.zalo_log import NhatKyZalo
from app.core.constants import AttendanceState, SessionStatus, ZaloMessageType

@pytest.mark.asyncio
async def test_tc07_exclude_reserved_and_dropped_students_from_attendance(client: AsyncClient, test_data):
    """TC-07: Attendance list must ONLY return students with status DangHoc.
    Students with status BaoLuu and DaNghi MUST be strictly excluded.
    """
    teacher_token = test_data["tokens"]["teacher1"]
    session1_id = test_data["session1"].id

    resp = await client.get(
        f"/api/sessions/{session1_id}/attendance",
        headers={"Authorization": f"Bearer {teacher_token}"}
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True

    students = data["data"]["students"]
    returned_ids = [s["id"] for s in students]

    # Studying students must be present
    assert test_data["student1"].id in returned_ids
    assert test_data["student2"].id in returned_ids

    # Reserved and Dropped students MUST NOT be present
    assert test_data["student_reserved"].id not in returned_ids
    assert test_data["student_dropped"].id not in returned_ids

@pytest.mark.asyncio
async def test_tc08_absent_students_always_receive_absent_notice(client: AsyncClient, test_data, db_session):
    """TC-08: Absent students ALWAYS receive absent notice when attendance is saved with sendZalo=True."""
    teacher_token = test_data["tokens"]["teacher1"]
    session1_id = test_data["session1"].id
    student1_id = test_data["student1"].id
    student2_id = test_data["student2"].id

    # Mark Student 1 as Absent, Student 2 as Present
    resp = await client.post(
        f"/api/sessions/{session1_id}/attendance",
        headers={"Authorization": f"Bearer {teacher_token}"},
        json={
            "attendance": {
                str(student1_id): "Vang",
                str(student2_id): "CoMat"
            },
            "sendZalo": True
        }
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert data["data"]["sent_zalo"] is True

    # Check Zalo Logs in DB
    logs_res = await db_session.execute(
        select(NhatKyZalo).where(NhatKyZalo.buoi_hoc_id == session1_id)
    )
    logs = logs_res.scalars().all()

    # Student 1 must receive bao_vang
    absent_log = next((l for l in logs if l.hoc_sinh_id == student1_id and l.loai_tin == ZaloMessageType.ABSENT_NOTICE.value), None)
    assert absent_log is not None
    assert "vắng mặt trong buổi học" in absent_log.noi_dung

@pytest.mark.asyncio
async def test_tc11_cancelled_session_does_not_send_notifications(client: AsyncClient, test_data, db_session):
    """TC-11: Cancelled / Holiday session does NOT trigger notifications."""
    teacher_token = test_data["tokens"]["teacher1"]
    session1 = test_data["session1"]
    student1_id = test_data["student1"].id

    # Mark session as cancelled
    session1.trang_thai_buoi_hoc = SessionStatus.CANCELLED.value
    await db_session.commit()

    from app.services.dispatcher_service import DispatcherService
    result = await DispatcherService.dispatch_session_notifications(db_session, session1.id)

    assert result["status"] == "skipped"
    assert "cancelled or holiday" in result["message"]


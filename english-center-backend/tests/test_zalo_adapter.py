import pytest
from sqlalchemy import select
from app.core.constants import AttendanceState, SessionAttendanceStatus, ZaloMessageType
from app.models.attendance import DiemDanh
from app.models.zalo_log import NhatKyZalo
from app.services.zalo.mock_provider import MockZaloProvider

@pytest.mark.asyncio
async def test_tc09_zalo_idempotency_prevents_duplicate_notices(db_session, test_data):
    """TC-09: Sending the same notice type for the same student and session twice
    must NOT duplicate the record in NhatKyZalo.
    """
    provider = MockZaloProvider()
    center = test_data["center1"]
    student = test_data["student1"]
    session = test_data["session1"]

    # First send -> success
    res1 = await provider.send_absent_notice(db_session, center, student, session)
    assert res1["status"] in ("success", "demo")
    await db_session.commit()

    # Second send -> skipped
    res2 = await provider.send_absent_notice(db_session, center, student, session)
    assert res2["status"] == "skipped"
    assert res2["reason"] == "Already sent"

    # Verify only 1 log exists
    query = select(NhatKyZalo).where(
        NhatKyZalo.buoi_hoc_id == session.id,
        NhatKyZalo.hoc_sinh_id == student.id,
        NhatKyZalo.loai_tin == ZaloMessageType.ABSENT_NOTICE.value
    )
    logs = (await db_session.execute(query)).scalars().all()
    assert len(logs) == 1

@pytest.mark.asyncio
async def test_tc15_per_student_error_isolation(db_session, test_data, monkeypatch):
    """TC-15: If one student triggers an error during sending, the rest of the class
    is still sent successfully without crashing the loop.
    """
    from app.services.dispatcher_service import DispatcherService

    session = test_data["session1"]
    student1 = test_data["student1"]
    student2 = test_data["student2"]

    # Mark both students as absent
    att1 = DiemDanh(
        trung_tam_id=session.trung_tam_id,
        buoi_hoc_id=session.id,
        hoc_sinh_id=student1.id,
        trang_thai=AttendanceState.ABSENT.value
    )
    att2 = DiemDanh(
        trung_tam_id=session.trung_tam_id,
        buoi_hoc_id=session.id,
        hoc_sinh_id=student2.id,
        trang_thai=AttendanceState.ABSENT.value
    )
    db_session.add_all([att1, att2])
    session.trang_thai_diem_danh = SessionAttendanceStatus.TAKEN.value
    await db_session.commit()

    # Mock send_absent_notice to fail on student1 but succeed on student2
    original_send = MockZaloProvider.send_absent_notice

    async def mock_send_with_error(self, db, center, student, session):
        if student.id == student1.id:
            raise RuntimeError("Zalo connection timeout for student 1!")
        return await original_send(self, db, center, student, session)

    monkeypatch.setattr(MockZaloProvider, "send_absent_notice", mock_send_with_error)

    # Dispatch notifications
    res = await DispatcherService.dispatch_session_notifications(db_session, session.id)

    # Student 2 must be sent even though student 1 raised an exception
    assert res["status"] == "completed"
    assert res["sent_absent"] == 1  # Student 2 succeeded

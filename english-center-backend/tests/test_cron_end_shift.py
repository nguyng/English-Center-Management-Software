import pytest
from sqlalchemy import select
from app.core.constants import SessionAttendanceStatus
from app.models.zalo_log import NhatKyZalo
from app.services.dispatcher_service import DispatcherService
from app.tasks.locks import release_advisory_lock, try_acquire_advisory_lock

@pytest.mark.asyncio
async def test_tc10_unrecorded_attendance_safety_net_does_not_send_false_notices(db_session, test_data):
    """TC-10: If a session ended but teacher forgot to take attendance
    (trang_thai_diem_danh == 'chua_diem_danh'):
    - Dispatcher MUST SKIP sending notifications.
    - NO absent notice is sent to parents falsely.
    """
    session = test_data["session1"]
    session.trang_thai_diem_danh = SessionAttendanceStatus.NOT_TAKEN.value
    await db_session.commit()

    result = await DispatcherService.dispatch_session_notifications(db_session, session.id)

    assert result["status"] == "skipped"
    assert "not taken attendance" in result["message"]

    # Verify no Zalo log was generated
    query = select(NhatKyZalo).where(NhatKyZalo.buoi_hoc_id == session.id)
    logs = (await db_session.execute(query)).scalars().all()
    assert len(logs) == 0

@pytest.mark.asyncio
async def test_tc14_advisory_lock_prevents_concurrent_runs(db_session):
    """TC-14: Concurrency lock acquisition:
    Worker 1 acquires lock -> Worker 2 fails to acquire the same lock.
    When Worker 1 releases lock -> Worker 2 can acquire it.
    """
    lock_id = 999888

    # Worker 1 acquires lock
    worker1_acquired = await try_acquire_advisory_lock(db_session, lock_id=lock_id)
    assert worker1_acquired is True

    # Worker 2 attempts to acquire the same lock -> Must fail
    worker2_acquired = await try_acquire_advisory_lock(db_session, lock_id=lock_id)
    assert worker2_acquired is False

    # Worker 1 releases lock
    await release_advisory_lock(db_session, lock_id=lock_id)

    # Now Worker 2 can acquire lock
    worker2_retry = await try_acquire_advisory_lock(db_session, lock_id=lock_id)
    assert worker2_retry is True

    # Clean up
    await release_advisory_lock(db_session, lock_id=lock_id)


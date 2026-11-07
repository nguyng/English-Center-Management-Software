from datetime import date
import pytest
from httpx import AsyncClient
from sqlalchemy import select
from app.models.attendance import DiemDanh
from app.models.exam import BaiKiemTra
from app.models.zalo_log import NhatKyZalo
from app.core.constants import AttendanceState, ExamFormat, ZaloMessageType

@pytest.mark.asyncio
async def test_tc12_partial_and_additional_manual_scores_without_duplicate(client: AsyncClient, test_data, db_session):
    """TC-12:
    - 2 students in class.
    - Teacher enters score for student 1 first -> sends notification to student 1.
    - Later, teacher enters score for student 2 -> ONLY sends notification to student 2 (student 1 is skipped).
    - Entering score for an absent student is blocked.
    """
    teacher_token = test_data["tokens"]["teacher1"]
    session1 = test_data["session1"]
    student1_id = test_data["student1"].id
    student2_id = test_data["student2"].id

    # Create a paper exam for session 1
    paper_exam = BaiKiemTra(
        trung_tam_id=test_data["center1"].id,
        buoi_hoc_id=session1.id,
        ten_bai_kiem_tra="Paper Exam Midterm",
        hinh_thuc=ExamFormat.PAPER.value,
        ngay_kiem_tra=date.today(),
        thoi_gian_phut=45
    )
    db_session.add(paper_exam)
    await db_session.commit()
    await db_session.refresh(paper_exam)

    # 1. Enter score for Student 1 only
    resp1 = await client.post(
        f"/api/exams/{paper_exam.id}/manual-scores",
        headers={"Authorization": f"Bearer {teacher_token}"},
        json={
            "scores": {
                str(student1_id): 8.5,
                str(student2_id): None
            },
            "scheduleForMorning": False
        }
    )
    assert resp1.status_code == 200
    data1 = resp1.json()["data"]
    assert data1["updated_count"] == 1
    assert data1["sent_count"] == 1

    # Check Zalo logs: Student 1 has score log
    logs1 = await db_session.execute(
        select(NhatKyZalo).where(
            NhatKyZalo.buoi_hoc_id == session1.id,
            NhatKyZalo.loai_tin == ZaloMessageType.SCORE_NOTICE.value
        )
    )
    sent_list1 = logs1.scalars().all()
    assert len(sent_list1) == 1
    assert sent_list1[0].hoc_sinh_id == student1_id

    # 2. Enter additional score for Student 2
    resp2 = await client.post(
        f"/api/exams/{paper_exam.id}/manual-scores",
        headers={"Authorization": f"Bearer {teacher_token}"},
        json={
            "scores": {
                str(student1_id): 8.5,  # already sent previously
                str(student2_id): 9.0   # new score
            },
            "scheduleForMorning": False
        }
    )
    assert resp2.status_code == 200
    data2 = resp2.json()["data"]
    # Student 1 is updated but NOT re-sent; Student 2 is sent
    assert data2["sent_count"] == 1

    logs2 = await db_session.execute(
        select(NhatKyZalo).where(
            NhatKyZalo.buoi_hoc_id == session1.id,
            NhatKyZalo.loai_tin == ZaloMessageType.SCORE_NOTICE.value
        )
    )
    sent_list2 = logs2.scalars().all()
    assert len(sent_list2) == 2  # Total 2 unique logs for 2 students, no duplicate!

@pytest.mark.asyncio
async def test_block_manual_score_for_absent_student(client: AsyncClient, test_data, db_session):
    """Attempting to enter a score for an absent student must be rejected."""
    teacher_token = test_data["tokens"]["teacher1"]
    session1 = test_data["session1"]
    student1_id = test_data["student1"].id

    # Mark student 1 as absent
    att = DiemDanh(
        trung_tam_id=test_data["center1"].id,
        buoi_hoc_id=session1.id,
        hoc_sinh_id=student1_id,
        trang_thai=AttendanceState.ABSENT.value
    )
    db_session.add(att)

    paper_exam = BaiKiemTra(
        trung_tam_id=test_data["center1"].id,
        buoi_hoc_id=session1.id,
        ten_bai_kiem_tra="Paper Exam Absent Check",
        hinh_thuc=ExamFormat.PAPER.value,
        ngay_kiem_tra=date.today(),
        thoi_gian_phut=45
    )
    db_session.add(paper_exam)
    await db_session.commit()
    await db_session.refresh(paper_exam)

    resp = await client.post(
        f"/api/exams/{paper_exam.id}/manual-scores",
        headers={"Authorization": f"Bearer {teacher_token}"},
        json={
            "scores": {str(student1_id): 7.5},
            "scheduleForMorning": False
        }
    )
    assert resp.status_code == 400
    assert "vắng mặt" in resp.json()["message"]


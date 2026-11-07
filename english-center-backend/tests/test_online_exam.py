from decimal import Decimal
import pytest
from httpx import AsyncClient
from sqlalchemy import select
from app.models.exam import BaiKiemTra, CauHoi
from app.models.result import KetQua

@pytest.mark.asyncio
async def test_tc04_online_exam_does_not_leak_correct_answers(client: AsyncClient, test_data):
    """TC-04: Public GET /api/exams/:id MUST NOT contain 'dap_an_dung' in response."""
    exam1_id = test_data["exam1"].id

    resp = await client.get(f"/api/exams/{exam1_id}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True

    questions = data["data"]["questions"]
    assert len(questions) > 0
    for q in questions:
        assert "dap_an_dung" not in q
        assert "noi_dung" in q
        assert "dap_an_a" in q
        assert "dap_an_b" in q

@pytest.mark.asyncio
async def test_tc03_block_duplicate_exam_submission(client: AsyncClient, test_data):
    """TC-03: Submitting an exam a second time must be blocked with 400 Bad Request."""
    exam1_id = test_data["exam1"].id
    student1_id = test_data["student1"].id
    q1_id = test_data["q1"].id
    q2_id = test_data["q2"].id

    # 1. First Submission -> Success
    resp1 = await client.post(
        f"/api/exams/{exam1_id}/submit",
        json={
            "hoc_sinh_id": student1_id,
            "answers": {str(q1_id): "B", str(q2_id): "B"},
            "tab_violations": 0
        }
    )
    assert resp1.status_code == 200
    data1 = resp1.json()
    assert data1["success"] is True
    assert data1["data"]["diem_so"] == 10.0

    # 2. Second Submission -> Blocked with 400
    resp2 = await client.post(
        f"/api/exams/{exam1_id}/submit",
        json={
            "hoc_sinh_id": student1_id,
            "answers": {str(q1_id): "A", str(q2_id): "A"},
            "tab_violations": 0
        }
    )
    assert resp2.status_code == 400
    data2 = resp2.json()
    assert data2["success"] is False
    assert data2["error_code"] == "EXAM_ALREADY_SUBMITTED"

@pytest.mark.asyncio
async def test_tc05_score_rounding_to_one_decimal(client: AsyncClient, test_data, db_session):
    """TC-05: Exam with 3 questions, 2 correct -> 2/3 * 10 = 6.66666... -> Must round to 6.7."""
    exam1_id = test_data["exam1"].id
    student2_id = test_data["student2"].id

    # Add 1 more question to make 3 total questions (answers: B, B, C)
    q3 = CauHoi(
        bai_kiem_tra_id=exam1_id,
        thu_tu=3,
        noi_dung="Question 3",
        dap_an_a="A",
        dap_an_b="B",
        dap_an_c="C",
        dap_an_d="D",
        dap_an_dung="C"
    )
    db_session.add(q3)
    await db_session.commit()
    await db_session.refresh(q3)

    q1_id = test_data["q1"].id
    q2_id = test_data["q2"].id

    # Submit 2 correct out of 3: Q1=B (correct), Q2=B (correct), Q3=A (wrong)
    resp = await client.post(
        f"/api/exams/{exam1_id}/submit",
        json={
            "hoc_sinh_id": student2_id,
            "answers": {str(q1_id): "B", str(q2_id): "B", str(q3.id): "A"},
            "tab_violations": 0
        }
    )
    assert resp.status_code == 200
    data = resp.json()["data"]

    # 2 / 3 * 10 = 6.666666666666667 -> round to 1 decimal place: 6.7
    assert data["diem_so"] == 6.7
    assert data["so_cau_dung"] == 2
    assert data["tong_cau"] == 3


from datetime import datetime, timedelta, timezone
import pytest
from httpx import AsyncClient
from app.core.security import create_access_token

@pytest.mark.asyncio
async def test_public_exam_does_not_leak_pin(client: AsyncClient, test_data):
    """Public portal GET /api/exams/:id must NEVER reveal ma_vao_thi."""
    pinned_exam_id = test_data["exam_pinned"].id

    resp = await client.get(f"/api/exams/{pinned_exam_id}")
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert "ma_vao_thi" not in data
    assert "dap_an_dung" not in data["questions"][0]

@pytest.mark.asyncio
async def test_verify_pin_success_issues_token(client: AsyncClient, test_data):
    """Valid PIN returns an exam_token bound to exam and student."""
    pinned_exam_id = test_data["exam_pinned"].id
    student1_id = test_data["student1"].id

    resp = await client.post(
        f"/api/exams/{pinned_exam_id}/verify-pin",
        json={"ma_vao_thi": "1234", "hoc_sinh_id": student1_id}
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["success"] is True
    data = body["data"]
    assert "exam_token" in data
    assert data["exam_id"] == pinned_exam_id
    assert data["hoc_sinh_id"] == student1_id
    assert "ma_vao_thi" not in data

@pytest.mark.asyncio
async def test_verify_pin_wrong_code(client: AsyncClient, test_data):
    """Wrong PIN returns 400 with INVALID_EXAM_PIN."""
    pinned_exam_id = test_data["exam_pinned"].id

    resp = await client.post(
        f"/api/exams/{pinned_exam_id}/verify-pin",
        json={"ma_vao_thi": "WRONG_PIN"}
    )
    assert resp.status_code == 400
    data = resp.json()
    assert data["success"] is False
    assert data["error_code"] == "INVALID_EXAM_PIN"

@pytest.mark.asyncio
async def test_verify_pin_empty_or_too_long(client: AsyncClient, test_data):
    """Empty PIN or length > 20 is rejected with 422."""
    pinned_exam_id = test_data["exam_pinned"].id

    # Empty
    r_empty = await client.post(
        f"/api/exams/{pinned_exam_id}/verify-pin",
        json={"ma_vao_thi": ""}
    )
    assert r_empty.status_code == 422

    # Over 20 chars
    r_long = await client.post(
        f"/api/exams/{pinned_exam_id}/verify-pin",
        json={"ma_vao_thi": "A" * 25}
    )
    assert r_long.status_code == 422

@pytest.mark.asyncio
async def test_submit_without_pin_is_blocked(client: AsyncClient, test_data):
    """Direct submit to pinned exam without PIN or token is blocked with PIN_REQUIRED."""
    pinned_exam_id = test_data["exam_pinned"].id
    student1_id = test_data["student1"].id
    qp1_id = test_data["qp1"].id

    resp = await client.post(
        f"/api/exams/{pinned_exam_id}/submit",
        json={
            "hoc_sinh_id": student1_id,
            "answers": {str(qp1_id): "A"},
            "tab_violations": 0
        }
    )
    assert resp.status_code == 400
    data = resp.json()
    assert data["success"] is False
    assert data["error_code"] == "PIN_REQUIRED"

@pytest.mark.asyncio
async def test_submit_with_valid_token_succeeds(client: AsyncClient, test_data):
    """Submitting with valid token issued by verify-pin succeeds."""
    pinned_exam_id = test_data["exam_pinned"].id
    student1_id = test_data["student1"].id
    qp1_id = test_data["qp1"].id
    qp2_id = test_data["qp2"].id

    # 1. Verify PIN
    verify_resp = await client.post(
        f"/api/exams/{pinned_exam_id}/verify-pin",
        json={"ma_vao_thi": "1234", "hoc_sinh_id": student1_id}
    )
    token = verify_resp.json()["data"]["exam_token"]

    # 2. Submit with token
    sub_resp = await client.post(
        f"/api/exams/{pinned_exam_id}/submit",
        json={
            "hoc_sinh_id": student1_id,
            "answers": {str(qp1_id): "A", str(qp2_id): "B"},
            "tab_violations": 0,
            "exam_token": token
        }
    )
    assert sub_resp.status_code == 200
    data = sub_resp.json()["data"]
    assert data["diem_so"] == 10.0
    assert data["so_cau_dung"] == 2

@pytest.mark.asyncio
async def test_submit_with_token_mismatch_exam_or_student(client: AsyncClient, test_data):
    """Token for exam A or student 1 cannot be reused for exam B or student 2."""
    pinned_exam_id = test_data["exam_pinned"].id
    student1_id = test_data["student1"].id
    student2_id = test_data["student2"].id
    qp1_id = test_data["qp1"].id

    # Token for student 1
    verify_resp = await client.post(
        f"/api/exams/{pinned_exam_id}/verify-pin",
        json={"ma_vao_thi": "1234", "hoc_sinh_id": student1_id}
    )
    token_s1 = verify_resp.json()["data"]["exam_token"]

    # Student 2 tries to use Student 1's token
    mismatch_stu = await client.post(
        f"/api/exams/{pinned_exam_id}/submit",
        json={
            "hoc_sinh_id": student2_id,
            "answers": {str(qp1_id): "A"},
            "exam_token": token_s1
        }
    )
    assert mismatch_stu.status_code == 400
    assert mismatch_stu.json()["error_code"] == "STUDENT_TOKEN_MISMATCH"

    # Token for Exam 999
    fake_exam_token = create_access_token({
        "type": "exam_access",
        "exam_id": 99999,
        "hoc_sinh_id": student1_id
    })
    mismatch_exam = await client.post(
        f"/api/exams/{pinned_exam_id}/submit",
        json={
            "hoc_sinh_id": student1_id,
            "answers": {str(qp1_id): "A"},
            "exam_token": fake_exam_token
        }
    )
    assert mismatch_exam.status_code == 400
    assert mismatch_exam.json()["error_code"] == "EXAM_TOKEN_MISMATCH"

@pytest.mark.asyncio
async def test_submit_with_expired_token(client: AsyncClient, test_data):
    """Expired token is rejected with INVALID_EXAM_TOKEN."""
    pinned_exam_id = test_data["exam_pinned"].id
    student1_id = test_data["student1"].id
    qp1_id = test_data["qp1"].id

    expired_token = create_access_token(
        {
            "type": "exam_access",
            "exam_id": pinned_exam_id,
            "hoc_sinh_id": student1_id
        },
        expires_delta=timedelta(seconds=-10)
    )

    resp = await client.post(
        f"/api/exams/{pinned_exam_id}/submit",
        json={
            "hoc_sinh_id": student1_id,
            "answers": {str(qp1_id): "A"},
            "exam_token": expired_token
        }
    )
    assert resp.status_code == 400
    assert resp.json()["error_code"] == "INVALID_EXAM_TOKEN"

@pytest.mark.asyncio
async def test_pin_brute_force_rate_limit(client: AsyncClient, test_data):
    """5 failed PIN attempts blocks further verification with PIN_RATE_LIMITED."""
    pinned_exam_id = test_data["exam_pinned"].id

    # 5 failed attempts
    for _ in range(5):
        await client.post(
            f"/api/exams/{pinned_exam_id}/verify-pin",
            json={"ma_vao_thi": "BAD_PIN"}
        )

    # 6th attempt -> Blocked by rate limiter
    resp = await client.post(
        f"/api/exams/{pinned_exam_id}/verify-pin",
        json={"ma_vao_thi": "1234"}
    )
    assert resp.status_code == 400
    data = resp.json()
    assert data["error_code"] == "PIN_RATE_LIMITED"

    # Clean up rate limit state for subsequent tests
    from app.services.exam_service import _pin_attempts
    _pin_attempts.clear()

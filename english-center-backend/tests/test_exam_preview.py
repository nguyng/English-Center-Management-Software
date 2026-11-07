import pytest
from httpx import AsyncClient
from sqlalchemy import func, select
from app.core.constants import ZaloMessageType
from app.models.result import KetQua
from app.models.zalo_log import NhatKyZalo

@pytest.mark.asyncio
async def test_teacher_preview_grades_without_saving_db(client: AsyncClient, test_data, db_session):
    """Teacher preview grades answers without saving KetQua to database or sending Zalo."""
    teacher_token = test_data["tokens"]["teacher1"]
    pinned_exam_id = test_data["exam_pinned"].id
    session1_id = test_data["session1"].id
    qp1_id = test_data["qp1"].id
    qp2_id = test_data["qp2"].id

    # 1. Preview submit: qp1=A (correct), qp2=B (correct) -> 10.0
    resp = await client.post(
        f"/api/exams/{pinned_exam_id}/submit",
        headers={"Authorization": f"Bearer {teacher_token}"},
        json={
            "is_preview": True,
            "answers": {str(qp1_id): "A", str(qp2_id): "B"},
            "tab_violations": 0
        }
    )
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert data["diem_so"] == 10.0
    assert data["so_cau_dung"] == 2
    assert data["is_preview"] is True

    # 2. Verify KetQua was NOT created in database
    kq_count = await db_session.scalar(
        select(func.count(KetQua.id)).where(KetQua.bai_kiem_tra_id == pinned_exam_id)
    )
    assert kq_count == 0

    # 3. Verify NO Zalo log was created
    zalo_count = await db_session.scalar(
        select(func.count(NhatKyZalo.id)).where(
            NhatKyZalo.buoi_hoc_id == session1_id,
            NhatKyZalo.loai_tin == ZaloMessageType.SCORE_NOTICE.value
        )
    )
    assert zalo_count == 0

@pytest.mark.asyncio
async def test_student_cannot_bypass_rules_using_is_preview(client: AsyncClient, test_data):
    """Unauthenticated student cannot submit with is_preview=True to bypass submission rules."""
    pinned_exam_id = test_data["exam_pinned"].id
    qp1_id = test_data["qp1"].id

    resp = await client.post(
        f"/api/exams/{pinned_exam_id}/submit",
        json={
            "is_preview": True,
            "answers": {str(qp1_id): "A"}
        }
    )
    assert resp.status_code == 403
    data = resp.json()
    assert data["error_code"] == "PREVIEW_UNAUTHORIZED"

@pytest.mark.asyncio
async def test_teacher_of_other_class_cannot_preview(client: AsyncClient, test_data):
    """Teacher 2 cannot preview Teacher 1's class exam."""
    teacher2_token = test_data["tokens"]["teacher2"]
    pinned_exam_id = test_data["exam_pinned"].id
    qp1_id = test_data["qp1"].id

    resp = await client.post(
        f"/api/exams/{pinned_exam_id}/submit",
        headers={"Authorization": f"Bearer {teacher2_token}"},
        json={
            "is_preview": True,
            "answers": {str(qp1_id): "A"}
        }
    )
    assert resp.status_code == 403

@pytest.mark.asyncio
async def test_student_can_still_submit_real_exam_after_teacher_preview(client: AsyncClient, test_data, db_session):
    """Teacher preview does NOT lock out students from submitting their real exam."""
    teacher_token = test_data["tokens"]["teacher1"]
    pinned_exam_id = test_data["exam_pinned"].id
    student1_id = test_data["student1"].id
    qp1_id = test_data["qp1"].id
    qp2_id = test_data["qp2"].id

    # 1. Teacher previews with is_preview=True
    await client.post(
        f"/api/exams/{pinned_exam_id}/submit",
        headers={"Authorization": f"Bearer {teacher_token}"},
        json={
            "is_preview": True,
            "answers": {str(qp1_id): "A", str(qp2_id): "B"}
        }
    )

    # 2. Student verifies PIN and submits real exam
    v_resp = await client.post(
        f"/api/exams/{pinned_exam_id}/verify-pin",
        json={"ma_vao_thi": "1234", "hoc_sinh_id": student1_id}
    )
    token = v_resp.json()["data"]["exam_token"]

    real_resp = await client.post(
        f"/api/exams/{pinned_exam_id}/submit",
        json={
            "hoc_sinh_id": student1_id,
            "answers": {str(qp1_id): "A", str(qp2_id): "B"},
            "exam_token": token,
            "is_preview": False
        }
    )
    assert real_resp.status_code == 200
    assert real_resp.json()["data"]["diem_so"] == 10.0
    assert real_resp.json()["data"]["is_preview"] is False

    # 3. Real KetQua is now saved in DB
    kq_count = await db_session.scalar(
        select(func.count(KetQua.id)).where(
            KetQua.bai_kiem_tra_id == pinned_exam_id,
            KetQua.hoc_sinh_id == student1_id
        )
    )
    assert kq_count == 1

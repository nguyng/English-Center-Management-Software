import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_teacher_views_own_class_exam_detail(client: AsyncClient, test_data):
    """Teacher views their own class exam detail: contains questions WITH dap_an_dung and studying students."""
    teacher_token = test_data["tokens"]["teacher1"]
    pinned_exam_id = test_data["exam_pinned"].id

    resp = await client.get(
        f"/api/exams/{pinned_exam_id}/detail",
        headers={"Authorization": f"Bearer {teacher_token}"}
    )
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert data["id"] == pinned_exam_id
    assert len(data["questions"]) > 0
    for q in data["questions"]:
        assert "dap_an_dung" in q
        assert q["dap_an_dung"] in ["A", "B", "C", "D"]

    assert len(data["students"]) >= 2
    student_names = [s["ho_ten"] for s in data["students"]]
    assert "Student 1 Studying" in student_names
    # Reserved and dropped students must be excluded
    assert "Student Reserved" not in student_names
    assert "Student Dropped" not in student_names

@pytest.mark.asyncio
async def test_teacher_cannot_view_other_class_exam_detail(client: AsyncClient, test_data):
    """Teacher B cannot access exam detail of Teacher A's class (403 Forbidden)."""
    teacher2_token = test_data["tokens"]["teacher2"]
    pinned_exam_id = test_data["exam_pinned"].id

    resp = await client.get(
        f"/api/exams/{pinned_exam_id}/detail",
        headers={"Authorization": f"Bearer {teacher2_token}"}
    )
    assert resp.status_code == 403

@pytest.mark.asyncio
async def test_admin_cannot_view_cross_tenant_exam_detail(client: AsyncClient, test_data):
    """Admin of Center 2 cannot access exam detail of Center 1 (404 Not Found)."""
    admin2_token = test_data["tokens"]["admin2"]
    pinned_exam_id = test_data["exam_pinned"].id

    resp = await client.get(
        f"/api/exams/{pinned_exam_id}/detail",
        headers={"Authorization": f"Bearer {admin2_token}"}
    )
    assert resp.status_code in [403, 404]

@pytest.mark.asyncio
async def test_results_api_returns_chi_tiet_tra_loi_and_so_cau_dung(client: AsyncClient, test_data):
    """GET /api/exams/:id/results returns chi_tiet_tra_loi and so_cau_dung."""
    exam1_id = test_data["exam1"].id
    student1_id = test_data["student1"].id
    q1_id = test_data["q1"].id
    q2_id = test_data["q2"].id
    admin_token = test_data["tokens"]["admin1"]

    # 1. Submit exam (q1=B correct, q2=A wrong -> 1 correct, 5.0 points)
    await client.post(
        f"/api/exams/{exam1_id}/submit",
        json={
            "hoc_sinh_id": student1_id,
            "answers": {str(q1_id): "B", str(q2_id): "A"},
            "tab_violations": 1
        }
    )

    # 2. Get results
    resp = await client.get(
        f"/api/exams/{exam1_id}/results",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert resp.status_code == 200
    results = resp.json()["data"]
    assert len(results) >= 1
    stu_res = next(r for r in results if r["hoc_sinh_id"] == student1_id)
    assert stu_res["diem_so"] == 5.0
    assert stu_res["so_cau_dung"] == 1
    assert stu_res["chi_tiet_tra_loi"] is not None
    assert stu_res["chi_tiet_tra_loi"][str(q1_id)]["is_correct"] is True
    assert stu_res["chi_tiet_tra_loi"][str(q2_id)]["is_correct"] is False

@pytest.mark.asyncio
async def test_send_zalo_results_idempotency_and_unsubmitted_filtering(client: AsyncClient, test_data):
    """POST /api/exams/:id/send-zalo-results sends notices only to completed students and prevents duplicate sending."""
    exam1_id = test_data["exam1"].id
    student1_id = test_data["student1"].id
    q1_id = test_data["q1"].id
    q2_id = test_data["q2"].id
    teacher_token = test_data["tokens"]["teacher1"]

    # 1. Submit for student 1 only (student 2 does not submit)
    await client.post(
        f"/api/exams/{exam1_id}/submit",
        json={
            "hoc_sinh_id": student1_id,
            "answers": {str(q1_id): "B", str(q2_id): "B"}
        }
    )

    # 2. First Send Zalo -> Sent 1
    resp1 = await client.post(
        f"/api/exams/{exam1_id}/send-zalo-results",
        headers={"Authorization": f"Bearer {teacher_token}"}
    )
    assert resp1.status_code == 200
    data1 = resp1.json()["data"]
    assert data1["total_eligible"] == 1
    assert data1["sent"] == 1
    assert data1["skipped_already_sent"] == 0

    # 3. Second Send Zalo -> Idempotent, skips already sent
    resp2 = await client.post(
        f"/api/exams/{exam1_id}/send-zalo-results",
        headers={"Authorization": f"Bearer {teacher_token}"}
    )
    assert resp2.status_code == 200
    data2 = resp2.json()["data"]
    assert data2["sent"] == 0
    assert data2["skipped_already_sent"] == 1


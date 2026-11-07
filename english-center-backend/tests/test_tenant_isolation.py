import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_tc01_teacher_cannot_access_other_teacher_class(client: AsyncClient, test_data):
    """TC-01: Teacher A attempts to access Teacher B's class -> Returns 404."""
    teacher1_token = test_data["tokens"]["teacher1"]
    class2_id = test_data["class2"].id  # Belongs to Teacher B

    resp = await client.get(
        f"/api/classes/{class2_id}",
        headers={"Authorization": f"Bearer {teacher1_token}"}
    )
    assert resp.status_code == 404
    data = resp.json()
    assert data["success"] is False
    assert data["error_code"] == "RESOURCE_NOT_FOUND"

@pytest.mark.asyncio
async def test_tc02_multi_tenant_isolation(client: AsyncClient, test_data):
    """TC-02: Admin of Center 2 tries to access a student from Center 1 -> Returns 404."""
    admin2_token = test_data["tokens"]["admin2"]
    student1_id = test_data["student1"].id  # Belongs to Center 1

    resp = await client.get(
        f"/api/students/{student1_id}",
        headers={"Authorization": f"Bearer {admin2_token}"}
    )
    assert resp.status_code == 404
    data = resp.json()
    assert data["success"] is False
    assert data["error_code"] == "RESOURCE_NOT_FOUND"

@pytest.mark.asyncio
async def test_tc13_license_guard_blocks_writes_when_expired(client: AsyncClient, test_data):
    """TC-13: Center 2 has expired SaaS license:
    - POST is blocked with 403 SAAS_LICENSE_EXPIRED
    - GET is allowed (Read-only access)
    """
    admin2_token = test_data["tokens"]["admin2"]

    # 1. GET is allowed
    get_resp = await client.get(
        "/api/students",
        headers={"Authorization": f"Bearer {admin2_token}"}
    )
    assert get_resp.status_code == 200
    assert get_resp.json()["success"] is True

    # 2. POST is blocked with 403
    post_resp = await client.post(
        "/api/students",
        headers={"Authorization": f"Bearer {admin2_token}"},
        json={
            "ho_ten": "Học sinh mới",
            "sdt_phu_huynh": "0901234567",
            "lop_id": 1,
            "ngay_nhap_hoc": "2026-11-05"
        }
    )
    assert post_resp.status_code == 403
    data = post_resp.json()
    assert data["success"] is False
    assert data["error_code"] == "SAAS_LICENSE_EXPIRED"


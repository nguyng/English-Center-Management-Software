import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_tc06_validate_vietnamese_phone_number(client: AsyncClient, test_data):
    """TC-06:
    - Invalid phone format (landline, 11 digits, invalid prefix) -> Returns 422 Unprocessable Entity
    - Valid mobile phone -> Returns 200 OK
    """
    admin_token = test_data["tokens"]["admin1"]
    class1_id = test_data["class1"].id

    # Test 1: Invalid landline number (0243123456)
    bad_resp1 = await client.post(
        "/api/students",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "ho_ten": "Test Student Landline",
            "sdt_phu_huynh": "0243123456",
            "lop_id": class1_id,
            "ngay_nhap_hoc": "2026-11-05"
        }
    )
    assert bad_resp1.status_code == 422

    # Test 2: Invalid 11-digit number
    bad_resp2 = await client.post(
        "/api/students",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "ho_ten": "Test Student 11 Digits",
            "sdt_phu_huynh": "09012345678",
            "lop_id": class1_id,
            "ngay_nhap_hoc": "2026-11-05"
        }
    )
    assert bad_resp2.status_code == 422

    # Test 3: Valid 10-digit mobile number starting with 09
    good_resp = await client.post(
        "/api/students",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "ho_ten": "Test Student Valid",
            "sdt_phu_huynh": "0987654321",
            "lop_id": class1_id,
            "ngay_nhap_hoc": "2026-11-05"
        }
    )
    assert good_resp.status_code == 200
    assert good_resp.json()["success"] is True
    assert good_resp.json()["data"]["sdt_phu_huynh"] == "0987654321"


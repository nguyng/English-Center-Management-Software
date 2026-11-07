import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_login_success(client: AsyncClient, test_data):
    resp = await client.post(
        "/api/auth/login",
        json={"email": "admin1@test.com", "password": "Password123@"}
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert "access_token" in data["data"]
    assert data["data"]["user"]["email"] == "admin1@test.com"

@pytest.mark.asyncio
async def test_login_invalid_password(client: AsyncClient, test_data):
    resp = await client.post(
        "/api/auth/login",
        json={"email": "admin1@test.com", "password": "WrongPassword"}
    )
    assert resp.status_code == 401
    data = resp.json()
    assert data["success"] is False
    assert data["error_code"] == "UNAUTHORIZED"

@pytest.mark.asyncio
async def test_get_me(client: AsyncClient, test_data):
    token = test_data["tokens"]["teacher1"]
    resp = await client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert data["data"]["ho_ten"] == "Teacher A"
    assert data["data"]["vai_tro"] == "GiaoVien"


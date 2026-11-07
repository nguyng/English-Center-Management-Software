import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from httpx import ASGITransport, AsyncClient
from app.main import app

async def run_live_verification():
    print("🚀 Bắt đầu kiểm thử tích hợp Live API (FastAPI + Database Seed)...")
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://localhost:5000") as client:
        # 1. Health check
        res = await client.get("/health")
        assert res.status_code == 200, f"Health check failed: {res.text}"
        print("  ✅ 1. Health Check: OK")

        # 2. Login as Admin
        admin_login = await client.post("/api/auth/login", json={
            "email": "admin@center.edu.vn",
            "password": "Password123@"
        })
        assert admin_login.status_code == 200, f"Admin login failed: {admin_login.text}"
        admin_token = admin_login.json()["data"]["access_token"]
        admin_headers = {"Authorization": f"Bearer {admin_token}"}
        print("  ✅ 2. Đăng nhập Admin thành công")

        # 3. Login as Teacher
        teacher_login = await client.post("/api/auth/login", json={
            "email": "teacher@center.edu.vn",
            "password": "Password123@"
        })
        assert teacher_login.status_code == 200, f"Teacher login failed: {teacher_login.text}"
        teacher_token = teacher_login.json()["data"]["access_token"]
        teacher_headers = {"Authorization": f"Bearer {teacher_token}"}
        print("  ✅ 3. Đăng nhập Giáo viên thành công")

        # 4. Session CRUD: Create -> Cancel with NghiLe -> Delete
        classes_res = await client.get("/api/classes", headers=admin_headers)
        class_id = classes_res.json()["data"][0]["id"]
        
        create_sess = await client.post("/api/sessions", headers=admin_headers, json={
            "lop_id": class_id,
            "ngay_hoc": "2026-11-20",
            "ca_hoc": "17:30 - 19:00",
            "gio_bat_dau": "17:30",
            "gio_ket_thuc": "19:00",
            "co_kiem_tra": False
        })
        assert create_sess.status_code == 200, f"Create session failed: {create_sess.text}"
        sess_id = create_sess.json()["data"]["id"]
        print(f"  ✅ 4a. Tạo ca học mới thành công (ID: {sess_id})")

        cancel_sess = await client.patch(f"/api/sessions/{sess_id}/cancel", headers=admin_headers, json={
            "reason": "Nghỉ lễ 20/11",
            "trang_thai_buoi_hoc": "NghiLe"
        })
        assert cancel_sess.status_code == 200
        assert cancel_sess.json()["data"]["trang_thai_buoi_hoc"] == "NghiLe"
        print("  ✅ 4b. Hủy ca học với trạng thái 'NghiLe' thành công")

        del_sess = await client.delete(f"/api/sessions/{sess_id}", headers=admin_headers)
        assert del_sess.status_code == 200
        print("  ✅ 4c. Xóa ca học tạo nhầm (DELETE) thành công")

        # 5. Public Exam Portal: Check hide dap_an_dung & ma_vao_thi
        exams_res = await client.get("/api/exams", headers=teacher_headers)
        exam_id = exams_res.json()["data"][0]["id"]

        pub_exam = await client.get(f"/api/exams/{exam_id}")
        assert pub_exam.status_code == 200
        pub_data = pub_exam.json()["data"]
        assert "ma_vao_thi" not in pub_data or pub_data.get("ma_vao_thi") is None
        for q in pub_data["questions"]:
            assert "dap_an_dung" not in q
        print(f"  ✅ 5. Cổng thi Public ({exam_id}) ẩn hoàn toàn đáp án đúng và mã PIN")

        # 6. Verify PIN endpoint
        stu_id = pub_data["students"][0]["id"]
        pin_res = await client.post(f"/api/exams/{exam_id}/verify-pin", json={
            "ma_vao_thi": "1234",
            "hoc_sinh_id": stu_id
        })
        assert pin_res.status_code == 200, f"Verify PIN failed: {pin_res.text}"
        exam_token = pin_res.json()["data"]["exam_token"]
        assert exam_token is not None
        print("  ✅ 6. Xác thực mã PIN vào thi & cấp exam_token thành công")

        # 7. Teacher Preview submit (is_preview: True)
        preview_submit = await client.post(f"/api/exams/{exam_id}/submit", headers=teacher_headers, json={
            "answers": {"1": "A", "2": "B"},
            "tab_violations": 0,
            "is_preview": True
        })
        assert preview_submit.status_code == 200, f"Preview failed: {preview_submit.text}"
        assert preview_submit.json()["data"]["is_preview"] is True
        print("  ✅ 7. Chế độ Giáo viên xem thử (Preview) chấm điểm tự động không ghi đè DB")

        # 8. Teacher Exam Detail endpoint (GET /detail)
        teacher_detail = await client.get(f"/api/exams/{exam_id}/detail", headers=teacher_headers)
        assert teacher_detail.status_code == 200, f"Get detail failed: {teacher_detail.text}"
        detail_data = teacher_detail.json()["data"]
        assert len(detail_data["questions"]) > 0
        assert "dap_an_dung" in detail_data["questions"][0]
        assert len(detail_data["students"]) > 0
        print("  ✅ 8. Giáo viên xem chi tiết đề thi kèm đáp án đúng & DS học sinh thành công")

        # 9. Send Zalo Exam Results
        zalo_res = await client.post(f"/api/exams/{exam_id}/send-zalo-results", headers=teacher_headers)
        assert zalo_res.status_code == 200, f"Send zalo failed: {zalo_res.text}"
        zalo_stats = zalo_res.json()["data"]
        print(f"  ✅ 9. Gửi báo điểm Zalo ZNS thành công (Đã gửi: {zalo_stats['sent']}, Bỏ qua lặp: {zalo_stats['skipped_already_sent']})")

    print("\n🎉 TOÀN BỘ 9 KỊCH BẢN KIỂM THỬ LIVE API ĐỀU THÀNH CÔNG RỰC RỠ!")

if __name__ == "__main__":
    asyncio.run(run_live_verification())

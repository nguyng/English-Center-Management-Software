# 🚀 HỆ THỐNG QUẢN LÝ TRUNG TÂM TIẾNG ANH - PYTHON BACKEND (B2B SAAS)

Phần mềm Backend xử lý nghiệp vụ trung tâm tiếng Anh: Quản lý học sinh, lớp học, lịch dạy, điểm danh, thi online trắc nghiệm, nhập điểm thi giấy, Zalo Service Adapter và bộ điều phối tự động cuối ca.

---

## 📌 1. YÊU CẦU HỆ THỐNG
- **Python:** 3.11+
- **Database:** PostgreSQL 15+ (hoặc SQLite cho môi trường test in-memory)
- **Redis (Tùy chọn):** Redis 7+ cho caching & distributed locks
- **Frontend tương thích:** React 18 + Vite (`english-center-frontend/` tại `http://localhost:5173`)

---

## 🛠️ 2. HƯỚNG DẪN CÀI ĐẶT & CHẠY DỰ ÁN

### Bước 1: Di chuyển vào thư mục Backend & Tạo Virtual Environment
```bash
cd english-center-backend
python -m venv venv
```

Kích hoạt môi trường ảo:
- **Windows (PowerShell):**
  ```powershell
  .\venv\Scripts\Activate.ps1
  ```
- **Linux / macOS:**
  ```bash
  source venv/bin/activate
  ```

### Bước 2: Cài đặt thư viện phụ thuộc
```bash
pip install -r requirements.txt
```

### Bước 3: Cấu hình biến môi trường
Tạo file `.env` từ file mẫu `.env.example`:
```bash
cp .env.example .env
```
Chỉnh sửa thông số kết nối Database trong file `.env`:
```ini
DATABASE_URL="postgresql+asyncpg://postgres:postgres123@localhost:5432/english_center_db"
PORT=5000
```

### Bước 4: Chạy Migration hoặc Nạp Dữ Liệu Mẫu (Seed Data)
Để tự động khởi tạo bảng và nạp sẵn dữ liệu trung tâm, tài khoản và đề thi:
```bash
python scripts/seed_data.py
```

### Bước 5: Khởi động máy chủ Backend
```bash
uvicorn app.main:app --host 0.0.0.0 --port 5000 --reload
```
- **API Base URL:** `http://localhost:5000/api`
- **Tài liệu Swagger UI:** `http://localhost:5000/docs`
- **Tài liệu ReDoc:** `http://localhost:5000/redoc`
- **Kiểm tra trạng thái (Health Check):** `http://localhost:5000/health`

---

## 🔑 3. TÀI KHOẢN MẪU DÙNG THỬ (SEED ACCOUNTS)

| Vai trò | Email | Mật khẩu | Phạm vi quyền hạn |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `super@saas.com` | `Password123@` | Quản trị nền tảng SaaS, gia hạn bản quyền, cấu hình Token Zalo |
| **Admin Trung Tâm** | `admin@center.edu.vn` | `Password123@` | Quản lý học sinh, giáo viên, lớp học, lịch dạy, xem Dashboard |
| **Giáo Viên** | `teacher@center.edu.vn` | `Password123@` | Điểm danh ca dạy, tạo đề trắc nghiệm, nhập điểm thi giấy |
| **Trung Tâm Hết Hạn** | `admin@thanglong.edu.vn` | `Password123@` | Tài khoản mẫu kiểm thử chặn ghi khi hết hạn bản quyền |

---

## 🧪 4. HƯỚNG DẪN CHẠY KIỂM THỬ (TEST SUITE)

Hệ thống tích hợp bộ 19 test cases toàn diện sử dụng SQLite in-memory, bao phủ đầy đủ 15 Edge Cases nghiệp vụ:

```bash
pytest tests/ -v
```

Kết quả:
```text
======================= 19 passed in 19.88s =======================
```

---

## 🐳 5. KHỞI CHẠY BẰNG DOCKER COMPOSE

Chạy trọn gói FastAPI Backend, PostgreSQL 15 và Redis 7:
```bash
docker compose up -d --build
```
Kiểm tra container đang chạy:
```bash
docker compose ps
```
Xem log của backend:
```bash
docker compose logs -f backend
```
Dừng hệ thống:
```bash
docker compose down
```

---

## 🔗 6. KẾT NỐI VỚI FRONTEND REACT

1. Backend đã được cấu hình mở **CORS** cho phép `http://localhost:5173`.
2. Trong thư mục `english-center-frontend/`:
   ```bash
   npm run dev
   ```
3. Đăng nhập với tài khoản `admin@center.edu.vn` hoặc `teacher@center.edu.vn` để trải nghiệm trực tiếp hệ thống thực tế!


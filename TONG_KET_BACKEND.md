# 📑 BÁO CÁO TỔNG KẾT TRIỂN KHAI TOÀN DIỆN PYTHON BACKEND
## DỰ ÁN: TOOL QUẢN LÝ TRUNG TÂM TIẾNG ANH (B2B SAAS)

> **Tài liệu bàn giao & đặc tả kỹ thuật chi tiết dành cho:** Toàn bộ nhóm phát triển (Backend, Frontend React, Zalo Service), Quản trị viên và Cố vấn Trung tâm.  
> **Tác giả:** Senior Python Backend Engineer, Software Architect & Technical Lead  
> **Trạng thái:** Hoàn thành 100% triển khai mã nguồn thực tế & vượt qua toàn bộ Test Suite  
> **Mã nguồn Backend:** Thư mục `english-center-backend/`  
> **Ngày hoàn thành:** Tháng 11/2026

---

## 1. TỔNG QUAN DỰ ÁN

### 1.1. Mục Tiêu Backend
Xây dựng một hệ thống Backend hoàn chỉnh bằng **Python (FastAPI)**, đóng vai trò hạt nhân trung tâm xử lý dữ liệu cho phần mềm Quản lý Trung tâm Tiếng Anh theo mô hình **B2B SaaS (Software as a Service)**. Hệ thống giải quyết trọn vẹn các bài toán nhức nhối trong vận hành trung tâm:
1. **Điểm danh tối ưu hóa:** Mặc định toàn bộ học sinh Có mặt, chỉ cần tick chọn học sinh Vắng, lọc danh sách vắng nhanh chóng.
2. **Cơ chế an toàn lưới (Safety Net):** Nếu giáo viên quên điểm danh, Cron Job cuối ca tuyệt đối không tự ý gửi thông báo vắng bừa bãi làm phiền phụ huynh.
3. **Đánh giá song song 2 hình thức:** Hỗ trợ cả thi trắc nghiệm Online tự động chấm điểm (chống gian lận lộ đề, chống nộp lại lần 2) và thi Giấy nhập điểm thủ công (làm tròn 1 chữ số thập phân, lưu điểm từng phần).
4. **Zalo Service Adapter Plug-and-Play:** Hỗ trợ 2 chế độ (Demo Mock ghi log hệ thống và Production ZNS kết nối Zalo Cloud API thật).
5. **Kiến trúc Multi-tenant SaaS:** Cách ly dữ liệu độc lập giữa các trung tâm thông qua `trung_tam_id` gắn chặt với JWT Identity và Middleware kiểm soát thời hạn bản quyền phần mềm theo năm.

### 1.2. Tech Stack Thực Tế Đã Triển Khai
* **Web Framework:** FastAPI (0.141.1) trên nền Starlette + ASGI Uvicorn (0.53.0).
* **Ngôn ngữ:** Python 3.11+ / Python 3.14 (Async Native).
* **Validation & Schemas:** Pydantic v2 (2.13.5) với Rust Core, tích hợp `email-validator` và custom regex số điện thoại di động Việt Nam.
* **Cơ sở dữ liệu:** PostgreSQL 15+ (Production) & aiosqlite (Test in-memory).
* **ORM:** SQLAlchemy 2.0 (2.1.8) kết hợp AsyncEngine và asyncpg driver (0.32.0).
* **Database Migration:** Alembic (1.20.1) hỗ trợ Async.
* **Authentication & Mã hóa:** PyJWT (2.15.1) thuật toán HS256, Bcrypt (5.0.0) băm mật khẩu với salt an toàn.
* **Tác vụ ngầm & Lập lịch:** APScheduler 3.x (AsyncIOScheduler) chạy đồng bộ trong event loop của FastAPI.
* **Kiểm thử tự động:** Pytest (9.1.1), pytest-asyncio (1.4.0), pytest-mock (3.17.0), HTTPX (0.28.1).
* **Đóng gói triển khai:** Docker, Multi-stage Dockerfile, Docker Compose tích hợp sẵn Backend, PostgreSQL 15 và Redis 7.

---

## 2. CẤU TRÚC THƯ MỤC THỰC TẾ & TRÁCH NHIỆM TỪNG MODULE

Toàn bộ Backend được đặt độc lập trong thư mục `english-center-backend/` theo mô hình **Clean Modular Architecture**:

```
english-center-backend/
├── app/
│   ├── __init__.py                     # Định danh package ứng dụng
│   ├── main.py                         # Khởi tạo FastAPI app, gắn CORS, Middleware, Lifespan Scheduler
│   │
│   ├── api/                            # Tầng Giao tiếp HTTP Routers
│   │   ├── __init__.py
│   │   ├── deps.py                     # Dependency Injection: get_db, get_current_user, require_role, get_current_tenant_id
│   │   └── v1/
│   │       ├── __init__.py
│   │       ├── api.py                  # Gom toàn bộ 11 routers với tiền tố /api
│   │       └── endpoints/
│   │           ├── __init__.py
│   │           ├── auth.py             # Đăng nhập, đăng xuất, lấy user hiện tại (/api/auth)
│   │           ├── centers.py          # Quản lý trung tâm SaaS, bản quyền, cấu hình Zalo (/api/centers)
│   │           ├── teachers.py         # CRUD giáo viên, khóa/mở tài khoản (/api/teachers)
│   │           ├── classes.py          # CRUD lớp học, tính sĩ số (/api/classes)
│   │           ├── students.py         # CRUD học sinh, chuyển trạng thái (/api/students)
│   │           ├── sessions.py         # Quản lý ca học, hủy ca, dạy thay (/api/sessions)
│   │           ├── attendance.py       # Lấy danh sách & Lưu điểm danh (/api/sessions/:id/attendance)
│   │           ├── exams.py            # Tạo đề, nộp bài thi online, nhập điểm thi giấy (/api/exams)
│   │           ├── results.py          # Kết quả thi theo bài thi / học sinh (/api/exams/:id/results)
│   │           ├── zalo_logs.py        # Tra cứu nhật ký tin nhắn & thống kê Recharts (/api/zalo-logs)
│   │           └── dashboard.py        # Thống kê 4 thẻ & ca chưa điểm danh (/api/dashboard)
│   │
│   ├── core/                           # Cấu hình lõi & Hạ tầng dùng chung
│   │   ├── __init__.py
│   │   ├── config.py                   # Đọc biến môi trường (.env), CORS, Database URL, JWT Secret
│   │   ├── constants.py                # Enums vai trò, trạng thái, regex SĐT VN, khung giờ an toàn
│   │   ├── database.py                 # AsyncEngine, AsyncSessionLocal, Base declarative
│   │   ├── exceptions.py               # Custom Exception classes & Global Exception Handlers
│   │   └── security.py                 # Hash bcrypt, sinh và giải mã JWT token
│   │
│   ├── models/                         # Tầng Cơ sở dữ liệu (SQLAlchemy ORM Entities)
│   │   ├── __init__.py                 # Export toàn bộ 11 models
│   │   ├── base.py                     # TimestampMixin (created_at, updated_at)
│   │   ├── center.py                   # Entity TrungTam (Bản quyền SaaS, Zalo OA config)
│   │   ├── user.py                     # Entity NguoiDung (SuperAdmin, Admin, GiaoVien)
│   │   ├── class_room.py               # Entity LopHoc (Quan hệ giáo viên, học sinh)
│   │   ├── student.py                  # Entity HocSinh (Regex SĐT, trạng thái DangHoc/BaoLuu/DaNghi)
│   │   ├── session.py                  # Entity BuoiHoc (Giờ ca học, cờ điểm danh, trạng thái hủy)
│   │   ├── attendance.py               # Entity DiemDanh (CoMat, Vang, ghi chú)
│   │   ├── exam.py                     # Entity BaiKiemTra, CauHoi (Online & Giấy)
│   │   ├── result.py                   # Entity KetQua (Numeric 3,1, chống nộp trùng)
│   │   ├── zalo_log.py                 # Entity NhatKyZalo (Lịch sử gửi tin, chống gửi trùng)
│   │   └── schedule_task.py            # Entity HenGioGuiTin (Hàng đợi an toàn 07:30 sáng)
│   │
│   ├── schemas/                        # Tầng DTO (Pydantic v2 Schemas)
│   │   ├── __init__.py
│   │   ├── common.py                   # GenericResponse[T], ErrorResponse, PaginatedData
│   │   ├── auth.py                     # LoginRequest, TokenResponse, TokenUser, UserOut
│   │   ├── center.py                   # CenterCreate, CenterOut, LicenseUpdateIn, ZaloConfigIn
│   │   ├── teacher.py                  # TeacherCreate, TeacherUpdate, TeacherStatusUpdateIn, TeacherOut
│   │   ├── class_room.py               # ClassCreate, ClassUpdate, ClassOut
│   │   ├── student.py                  # StudentCreate (Validate SĐT VN), StudentUpdate, StudentOut
│   │   ├── session.py                  # SessionCreate, SessionCancelIn, SessionSubstituteIn, SessionOut
│   │   ├── attendance.py               # AttendanceStudentItem, AttendanceSaveIn, DetailOut
│   │   ├── exam.py                     # ExamCreate, QuestionIn, QuestionPublicOut, ExamPublicOut, SubmitIn
│   │   ├── result.py                   # ResultOut, StudentResultOut
│   │   ├── zalo_log.py                 # ZaloLogOut, ZaloStatsMonth
│   │   └── dashboard.py                # DashboardStatsOut, AttendanceAlertItem
│   │
│   ├── services/                       # Tầng Xử lý Nghiệp vụ Logic (Business Layer)
│   │   ├── __init__.py
│   │   ├── auth_service.py             # Xác thực đăng nhập, kiểm tra trạng thái khóa, giải mã user
│   │   ├── center_service.py           # Quản lý trung tâm đối tác, gia hạn SaaS theo năm
│   │   ├── teacher_service.py          # Nghiệp vụ giáo viên, băm mật khẩu, phân công lớp
│   │   ├── class_service.py            # Quản lý lớp học, tính sĩ số tự động, phân quyền lớp
│   │   ├── student_service.py          # Nghiệp vụ học sinh, chuyển trạng thái bảo lưu
│   │   ├── session_service.py          # Nghiệp vụ ca học, hủy buổi học, phân công dạy thay
│   │   ├── attendance_service.py       # Nghiệp vụ điểm danh (ACID transaction, lọc DangHoc)
│   │   ├── exam_service.py             # Chấm trắc nghiệm tự động, thang 10 làm tròn 1 chữ số, anti-cheat
│   │   ├── result_service.py           # Nhập điểm thi giấy, kiểm soát học sinh vắng, lưu từng phần
│   │   ├── dispatcher_service.py       # Cây quyết định gửi tin Zalo 4 kịch bản, rate limit 0.35s
│   │   └── zalo/                       # Adapter Pattern Giao tiếp Zalo Service
│   │       ├── __init__.py
│   │       ├── base.py                 # Interface BaseZaloProvider
│   │       ├── mock_provider.py        # Chế độ Demo: Mô phỏng trễ, ghi log NhatKyZalo ('Demo')
│   │       ├── zns_provider.py         # Chế độ Production: Gọi Zalo Cloud API thật
│   │       └── factory.py              # ZaloProviderFactory cấp provider tương ứng
│   │
│   ├── tasks/                          # Tầng Tự động hóa Scheduler (APScheduler)
│   │   ├── __init__.py
│   │   ├── scheduler.py                # Khởi tạo AsyncIOScheduler gắn vào lifespan FastAPI
│   │   ├── locks.py                    # PostgreSQL Advisory Lock / Asyncio Lock chống chạy trùng
│   │   ├── end_shift_cron.py           # Trigger 1: Quét ca học kết thúc mỗi 60s (An toàn lưới)
│   │   └── morning_queue_cron.py       # Quét hàng đợi ban đêm gửi lúc 07:30 sáng hôm sau
│   │
│   └── middleware/                     # Middleware Kiểm soát Toàn cục
│       ├── __init__.py
│       └── license_guard.py            # Chặn POST/PUT/PATCH/DELETE với 403 SAAS_LICENSE_EXPIRED nếu hết hạn
│
├── alembic/                            # Quản lý Database Migrations
│   ├── env.py                          # Cấu hình AsyncEngine cho Alembic
│   ├── script.py.mako                  # Template migration
│   └── versions/                       # Thư mục chứa các file migration
│
├── tests/                              # Bộ Kiểm thử Tự động Toàn diện (Pytest)
│   ├── __init__.py
│   ├── conftest.py                     # Fixtures SQLite async in-memory, mock tokens, setup data
│   ├── test_auth.py                    # Test Đăng nhập, băm mật khẩu, token JWT
│   ├── test_tenant_isolation.py        # Test TC-01 (IDOR), TC-02 (Multi-tenant), TC-13 (LicenseGuard)
│   ├── test_students.py                # Test TC-06 (Validate Regex SĐT di động VN)
│   ├── test_attendance.py              # Test TC-07 (Lọc DangHoc), TC-08 (Báo vắng), TC-11 (Hủy buổi)
│   ├── test_online_exam.py             # Test TC-03 (Chống nộp 2 lần), TC-04 (Giấu đáp án), TC-05 (Làm tròn)
│   ├── test_manual_scores.py           # Test TC-12 (Lưu điểm từng phần, chặn điểm học sinh vắng)
│   ├── test_zalo_adapter.py            # Test TC-09 (Chống gửi trùng), TC-15 (Bọc lỗi độc lập từng học sinh)
│   └── test_cron_end_shift.py          # Test TC-10 (GV quên điểm danh không gửi vắng ảo), TC-14 (Advisory Lock)
│
├── scripts/
│   └── seed_data.py                    # Script tự động khởi tạo database & nạp dữ liệu mẫu
│
├── requirements.txt                    # Danh sách thư viện phụ thuộc
├── alembic.ini                         # File cấu hình Alembic
├── .env.example                        # Mẫu cấu hình môi trường
├── .gitignore                          # Cấu hình bỏ qua git
├── Dockerfile                          # Build Docker image multi-stage tối ưu kích thước
├── docker-compose.yml                  # Triển khai trọn gói Backend + Postgres + Redis
├── README.md                           # Hướng dẫn chi tiết cách cài đặt và sử dụng
└── TONG_KET_BACKEND.md                 # Tài liệu báo cáo tổng kết này
```

---

## 3. THIẾT KẾ CƠ SỞ DỮ LIỆU (DATABASE & CONSTRAINTS)

Cơ sở dữ liệu được thiết kế đáp ứng chuẩn toàn vẹn dữ liệu cao cấp, kiểm soát chặt chẽ ở cấp độ Database:

| Tên Bảng | Khóa Chính (PK) | Khóa Ngoại (FK) | Ràng Buộc Toàn Vẹn (Constraints) | Chỉ Mục (Indexes) | Trách Nhiệm Dữ Liệu |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `trung_tam` | `id` | Không | `ten_trung_tam NOT NULL`, `sdt_admin NOT NULL` | `id` | Khách hàng B2B SaaS, hạn dùng bản quyền, thông tin Zalo OA. |
| `nguoi_dung` | `id` | `trung_tam_id` $\rightarrow$ `trung_tam.id` | `UNIQUE(email)`, `mat_khau_hash NOT NULL` | `email`, `trung_tam_id` | Người dùng 3 vai trò (SuperAdmin, Admin, GiaoVien). |
| `lop_hoc` | `id` | `trung_tam_id`, `giao_vien_id` | `UNIQUE(trung_tam_id, ma_lop)` | `trung_tam_id`, `giao_vien_id` | Lớp học, mã lớp duy nhất theo trung tâm, giáo viên phụ trách. |
| `hoc_sinh` | `id` | `trung_tam_id`, `lop_id` | `sdt_phu_huynh NOT NULL` (không unique) | `(trung_tam_id, lop_id, trang_thai)` | Hồ sơ học sinh, trạng thái `DangHoc`, `BaoLuu`, `DaNghi`. |
| `buoi_hoc` | `id` | `trung_tam_id`, `lop_id`, `giao_vien_day_thay_id` | `ngay_hoc`, `gio_bat_dau`, `gio_ket_thuc` | `(ngay_hoc, gio_ket_thuc, da_gui, ...)` | Lịch dạy, trạng thái điểm danh, trạng thái hủy/nghỉ lễ. |
| `diem_danh` | `id` | `trung_tam_id`, `buoi_hoc_id`, `hoc_sinh_id` | `UNIQUE(buoi_hoc_id, hoc_sinh_id)` | `buoi_hoc_id`, `hoc_sinh_id` | Trạng thái Có mặt / Vắng của từng học sinh trong ca. |
| `bai_kiem_tra`| `id` | `trung_tam_id`, `buoi_hoc_id` | `hinh_thuc IN ('he_thong', 'giay')` | `buoi_hoc_id`, `trung_tam_id` | Đề thi trắc nghiệm online hoặc bài thi giấy. |
| `cau_hoi` | `id` | `bai_kiem_tra_id` $\rightarrow$ `bai_kiem_tra.id` | `dap_an_dung IN ('A','B','C','D')` | `bai_kiem_tra_id` | Câu hỏi trắc nghiệm, 4 phương án, đáp án đúng. |
| `ket_qua` | `id` | `trung_tam_id`, `bai_kiem_tra_id`, `hoc_sinh_id` | `UNIQUE(bai_kiem_tra_id, hoc_sinh_id)`, `CHECK(0.0 <= diem_so <= 10.0)` | `bai_kiem_tra_id`, `hoc_sinh_id` | Điểm số `NUMERIC(3,1)`, số lần rời tab, chi tiết câu trả lời. |
| `nhat_ky_zalo`| `id` | `trung_tam_id`, `buoi_hoc_id`, `hoc_sinh_id` | `UNIQUE(buoi_hoc_id, hoc_sinh_id, loai_tin)` | `(trung_tam_id, thoi_gian_gui)` | Nhật ký tin nhắn đã gửi, chống gửi trùng lặp (Idempotency). |
| `hen_gio_gui_tin`| `id` | `trung_tam_id`, `buoi_hoc_id`, `hoc_sinh_id` | `thoi_gian_hen_gui NOT NULL` | `(trang_thai, thoi_gian_hen_gui)` | Hàng đợi lưu bền vững gửi tin lúc 07:30 sáng hôm sau. |

---

## 4. BẢO MẬT & PHÂN QUYỀN (AUTHENTICATION & SECURITY)

1. **Bảo mật Đăng nhập (JWT & Bcrypt):**
   - Mật khẩu lưu dưới dạng mã băm Bcrypt với Salt ngẫu nhiên.
   - Access Token HS256 có thời hạn 24 giờ chứa đầy đủ payload: `{"id", "ho_ten", "email", "vai_tro", "trung_tam_id"}`.
   - Bắt lỗi token hết hạn và thu hồi phiên người dùng tự động.
2. **Kiểm soát Quyền 3 Cấp (RBAC):**
   - `SuperAdmin`: Quản lý toàn bộ khách hàng SaaS, gia hạn bản quyền, cấu hình Token Zalo.
   - `Admin Trung Tâm`: Quản lý toàn bộ lớp học, giáo viên, học sinh, lịch dạy, xem Dashboard và can thiệp điểm danh hộ.
   - `GiaoVien`: **Bảo mật Scoped Access** — Giáo viên chỉ được xem danh sách học sinh và điểm danh các lớp mình được phân công; cố tình truy vấn lớp người khác sẽ nhận lỗi `404 Not Found` (ngăn ngừa tấn công dò quét IDOR).
3. **Multi-tenant Isolation (Cách ly Đa Trung tâm):**
   - Mọi thao tác truy vấn đều ép điều kiện `WHERE trung_tam_id = :current_tenant_id` lấy từ JWT Token đã được ký số, **tuyệt đối không tin tưởng `trung_tam_id` từ phía client gửi lên**.
4. **LicenseGuard Middleware:**
   - Chặn toàn bộ các thao tác ghi dữ liệu (`POST`, `PUT`, `PATCH`, `DELETE`) nếu trung tâm hết hạn bản quyền phần mềm (`ngay_het_han_saas < TODAY` hoặc `trang_thai_ban_quyen == 'HetHan'`), trả về lỗi HTTP 403 `SAAS_LICENSE_EXPIRED`.
   - Vẫn cho phép các thao tác `GET` để trung tâm tra cứu dữ liệu cũ.
5. **CORS:**
   - Cấu hình mở quyền truy cập cho Frontend tại `http://localhost:5173` và `http://localhost:3000`.

---

## 5. TÀI LIỆU API CHI TIẾT (API DOCUMENTATION)

Toàn bộ 11 nhóm API đã được triển khai đầy đủ và tuân thủ 100% chuẩn phản hồi của Frontend:
- **Base URL:** `http://localhost:5000/api`
- **Chuẩn Success Response:** `{ "success": true, "data": ..., "message": "..." }`
- **Chuẩn Error Response:** `{ "success": false, "error_code": "...", "message": "...", "details": ... }`

### Danh sách Endpoint chi tiết:

| Module | Method | Endpoint | Chức năng nghiệp vụ | Quyền truy cập | Trạng thái |
| :--- | :---: | :--- | :--- | :---: | :---: |
| **Auth** | `POST` | `/api/auth/login` | Đăng nhập hệ thống, cấp token JWT | Public | ✅ Hoạt động |
| | `POST` | `/api/auth/logout` | Đăng xuất người dùng | Đã login | ✅ Hoạt động |
| | `GET` | `/api/auth/me` | Lấy thông tin user hiện tại từ Token | Đã login | ✅ Hoạt động |
| **SaaS Centers** | `GET` | `/api/centers` | Danh sách trung tâm đối tác | SuperAdmin | ✅ Hoạt động |
| | `POST` | `/api/centers` | Tạo trung tâm mới kèm tài khoản Admin | SuperAdmin | ✅ Hoạt động |
| | `GET` | `/api/centers/:id` | Xem chi tiết trung tâm | SuperAdmin / Admin | ✅ Hoạt động |
| | `PATCH` | `/api/centers/:id/license` | Gia hạn bản quyền phần mềm theo năm | SuperAdmin | ✅ Hoạt động |
| | `PATCH` | `/api/centers/:id/zalo-config` | Cấu hình Token Zalo OA / ZNS | SuperAdmin / Admin | ✅ Hoạt động |
| **Teachers** | `GET` | `/api/teachers` | Danh sách giáo viên kèm lớp phụ trách | SuperAdmin / Admin | ✅ Hoạt động |
| | `POST` | `/api/teachers` | Tạo tài khoản giáo viên mới | Admin | ✅ Hoạt động |
| | `GET` | `/api/teachers/:id` | Xem thông tin chi tiết giáo viên | SuperAdmin / Admin | ✅ Hoạt động |
| | `PUT` | `/api/teachers/:id` | Cập nhật thông tin giáo viên | Admin | ✅ Hoạt động |
| | `PATCH` | `/api/teachers/:id/status` | Khóa hoặc Mở khóa tài khoản giáo viên | Admin | ✅ Hoạt động |
| **Classes** | `GET` | `/api/classes` | Danh sách lớp học kèm sĩ số học sinh | SuperAdmin / Admin / GV | ✅ Hoạt động |
| | `POST` | `/api/classes` | Tạo lớp học mới | Admin | ✅ Hoạt động |
| | `GET` | `/api/classes/:id` | Chi tiết lớp học | Admin / GV | ✅ Hoạt động |
| | `PUT` | `/api/classes/:id` | Cập nhật thông tin lớp học | Admin | ✅ Hoạt động |
| | `DELETE` | `/api/classes/:id` | Xóa lớp học | Admin | ✅ Hoạt động |
| **Students** | `GET` | `/api/students` | Lọc học sinh theo lớp, trạng thái, tìm kiếm | SuperAdmin / Admin / GV | ✅ Hoạt động |
| | `POST` | `/api/students` | Tiếp nhận học sinh mới (Validate SĐT VN) | Admin | ✅ Hoạt động |
| | `GET` | `/api/students/:id` | Chi tiết học sinh | Admin / GV | ✅ Hoạt động |
| | `PUT` | `/api/students/:id` | Cập nhật học sinh | Admin | ✅ Hoạt động |
| | `PATCH` | `/api/students/:id/status` | Đổi trạng thái (`DangHoc`, `BaoLuu`, `DaNghi`) | Admin | ✅ Hoạt động |
| | `DELETE` | `/api/students/:id` | Xóa học sinh | Admin | ✅ Hoạt động |
| **Sessions** | `GET` | `/api/sessions` | Lấy danh sách ca học theo ngày/lớp | Admin / GV | ✅ Hoạt động |
| | `POST` | `/api/sessions` | Tạo buổi học mới | Admin | ✅ Hoạt động |
| | `GET` | `/api/sessions/:id` | Chi tiết ca học | Admin / GV | ✅ Hoạt động |
| | `PATCH` | `/api/sessions/:id/cancel` | Hủy ca học / Báo nghỉ lễ kèm lý do | Admin | ✅ Hoạt động |
| | `PATCH` | `/api/sessions/:id/substitute` | Chỉ định giáo viên dạy thay | Admin | ✅ Hoạt động |
| | `PATCH` | `/api/sessions/:id/confirm-attendance` | Xác nhận hoàn thành điểm danh độc lập | Admin / GV | ✅ Hoạt động |
| **Attendance** | `GET` | `/api/sessions/:id/attendance` | Lấy danh sách điểm danh (chỉ học sinh `DangHoc`) | Admin / GV | ✅ Hoạt động |
| | `POST` | `/api/sessions/:id/attendance` | Lưu điểm danh (ACID) & kích hoạt Zalo ngay | Admin / GV | ✅ Hoạt động |
| **Exams** | `POST` | `/api/exams` | Tạo bài kiểm tra trắc nghiệm online / giấy | Admin / GV | ✅ Hoạt động |
| | `GET` | `/api/exams` | Danh sách bài kiểm tra theo ca học | Admin / GV | ✅ Hoạt động |
| | `GET` | `/api/exams/:id` | Cổng đề thi học sinh (**ĐÃ GIẤU ĐÁP ÁN ĐÚNG**) | Public (Không cần login)| ✅ Hoạt động |
| | `POST` | `/api/exams/:id/questions` | Thêm danh sách câu hỏi vào đề | Admin / GV | ✅ Hoạt động |
| | `POST` | `/api/exams/:id/submit` | Nộp bài thi online (Chấm tự động, chống nộp lại)| Public (Học sinh) | ✅ Hoạt động |
| | `POST` | `/api/exams/:id/manual-scores`| Nhập điểm thi giấy thủ công (Hẹn giờ ban đêm) | Admin / GV | ✅ Hoạt động |
| **Results** | `GET` | `/api/exams/:id/results` | Bảng kết quả điểm thi của cả lớp | Admin / GV | ✅ Hoạt động |
| | `GET` | `/api/students/:id/results`| Lịch sử bảng điểm của 1 học sinh | Admin / GV | ✅ Hoạt động |
| **Zalo Logs** | `GET` | `/api/zalo-logs` | Bộ lọc nhật ký tin nhắn & phân trang | SuperAdmin / Admin | ✅ Hoạt động |
| | `GET` | `/api/zalo-logs/stats` | Thống kê số tin thành công, thất bại 6 tháng | SuperAdmin / Admin | ✅ Hoạt động |
| **Dashboard** | `GET` | `/api/dashboard/stats` | 4 thẻ thống kê: HS, Lớp, GV, Tin Zalo tháng | SuperAdmin / Admin | ✅ Hoạt động |
| | `GET` | `/api/dashboard/alerts` | Danh sách ca học hôm nay chưa được điểm danh | Admin | ✅ Hoạt động |

---

## 6. PHÂN TÍCH CHI TIẾT CÁC NGHIỆP VỤ CỐT LÕI

1. **Nghiệp vụ Điểm Danh Tối Ưu:**
   - Khi gọi `GET /api/sessions/:id/attendance`, Backend chỉ truy vấn những học sinh có `trang_thai = 'DangHoc'`. Toàn bộ học sinh `BaoLuu` và `DaNghi` hoàn toàn bị ẩn để tránh giáo viên điểm danh nhầm.
   - Nếu buổi học chưa được điểm danh, Backend mặc định trả về trạng thái `trang_thai = "CoMat"` cho toàn bộ học sinh để giáo viên chỉ cần 1 thao tác click chọn những bạn Vắng.
2. **Cơ Chế An Toàn Lưới Điểm Danh (Safety Net):**
   - Khi buổi học kết thúc, Cron Job quét qua. Nếu phát hiện `trang_thai_diem_danh == 'chua_diem_danh'`, hệ thống **TUYỆT ĐỐI KHÔNG GỬI TIN BÁO VẮNG ẢO** cho phụ huynh. Thay vào đó, ca học xuất hiện trên màn hình cảnh báo `/api/dashboard/alerts` để Admin có thể bấm "Điểm danh hộ".
3. **Thi Online Trắc Nghiệm An Toàn (Anti-Cheat & Anti-Leak):**
   - Cổng làm bài thi `/thi/:examId` là Public để học sinh mở link làm bài ngay trên điện thoại hoặc máy tính mà không cần tài khoản.
   - Endpoint `GET /api/exams/:id` **loại bỏ hoàn toàn trường `dap_an_dung` khỏi JSON response**. Học sinh không thể F12 DevTools để xem trước đáp án.
   - Khi học sinh bấm Nộp bài, Backend so khớp đáp án với Database, tự động tính điểm theo thang 10: $\text{Điểm} = \text{round}((\text{Số câu đúng} / \text{Tổng câu}) \times 10, 1)$ và ghi nhận số lần chuyển tab gian lận (`so_lan_roi_tab`).
   - Ràng buộc `UNIQUE(bai_kiem_tra_id, hoc_sinh_id)` chặn triệt để học sinh F5 làm bài lần 2.
4. **Thi Giấy & Nhập Điểm Từng Phần:**
   - Điểm số được validate từ `0.0` đến `10.0`.
   - **Chặn học sinh vắng:** Học sinh có trạng thái Vắng trong ca học bị khóa không cho nhập điểm (vì vắng học thì không có bài thi giấy).
   - Giáo viên chấm xong 15 bạn nhập trước 15 bạn, 5 bạn còn lại nhập sau. Hệ thống chỉ gửi tin báo điểm cho 15 bạn đợt đầu. Khi nhập tiếp 5 bạn đợt hai, hệ thống kiểm tra `NhatKyZalo` và chỉ gửi tin cho 5 bạn mới nhập, không gửi trùng cho 15 bạn trước đó.
5. **Cây Quyết Định Gửi Tin Zalo (4 Kịch Bản):**
   - ❌ Học sinh Vắng $\rightarrow$ Luôn gửi báo vắng.
   - ✅ Có mặt + Thi online $\rightarrow$ Gửi báo điểm (đã có điểm tự động).
   - ✅ Có mặt + Thi giấy chưa có điểm $\rightarrow$ Im lặng chờ giáo viên chấm xong.
   - ✅ Có mặt + Buổi học không kiểm tra $\rightarrow$ Im lặng không gửi tin (tránh làm phiền phụ huynh).
6. **Bảo Vệ Giấc Ngủ Phụ Huynh (07:00 - 21:30):**
   - Khi giáo viên lưu điểm sau 21:30 đêm và Frontend gửi cờ `scheduleForMorning: true`, hệ thống lưu bản ghi vào bảng `hen_gio_gui_tin` hẹn gửi lúc 07:30 sáng hôm sau. Việc lưu vào database đảm bảo hàng đợi không bị mất ngay cả khi máy chủ khởi động lại ban đêm.

---

## 7. MODULE ZALO SERVICE (PLUG & PLAY)

Module Zalo Service được thiết kế theo mẫu **Adapter Pattern**:
* **Interface `BaseZaloProvider`:** Định nghĩa 2 phương thức trừu tượng: `send_absent_notice` và `send_score_notice`.
* **`MockZaloProvider` (Chế độ Demo):** Mô phỏng trễ mạng 50ms, tự động ghi nhận bản ghi gửi tin vào bảng `NhatKyZalo` với trạng thái `'Demo'`.
* **`ProductionZnsProvider` (Chế độ Thật):** Tự động đọc `zalo_access_token` và `zalo_oa_id` từ trung tâm trong database và gọi Zalo Cloud API thật.
* **`ZaloProviderFactory`:** Tự động quyết định sử dụng Provider tương ứng.
* **Rate Limiter chống nghẽn:** Điều hòa tốc độ gửi tin với khoảng nghỉ 0.35 giây giữa mỗi tin nhắn.
* **Bọc lỗi độc lập từng học sinh:** Mỗi học sinh được xử lý trong khối `try-except` riêng. Nếu 1 học sinh bị sai số điện thoại hoặc lỗi mạng, hệ thống ghi nhận `'ThatBai'` trong `NhatKyZalo`, vòng lặp gửi tin của cả lớp vẫn tiếp tục thành công cho các học sinh còn lại.

---

## 8. SCHEDULER & CRON JOBS

Triển khai bằng `APScheduler.AsyncIOScheduler` chạy nền đồng bộ cùng vòng đời FastAPI:
1. **End Shift Cron (`end_shift_cron.py`):**
   - Quét định kỳ mỗi **60 giây**.
   - Điều kiện quét: `ngay_hoc == TODAY AND gio_ket_thuc <= NOW AND da_gui == false AND trang_thai_buoi_hoc == 'BinhThuong'`.
   - Sử dụng **Advisory Lock** chống chạy trùng khi có nhiều worker hoạt động đồng thời.
   - Nếu máy chủ bị cúp điện lúc 18:58 và bật lại lúc 19:15, Cron Job tự động phát hiện ca học đã kết thúc và gửi bù ngay lập tức.
2. **Morning Queue Cron (`morning_queue_cron.py`):**
   - Quét định kỳ kiểm tra các bản ghi trong bảng `hen_gio_gui_tin` có `trang_thai = 'ChoGui' AND thoi_gian_hen_gui <= NOW`.
   - Gửi tin nhắn thông báo điểm và cập nhật `trang_thai = 'DaXuLy'`.

---

## 9. KẾT QUẢ KIỂM THỬ THỰC TẾ (TEST RESULTS)

Toàn bộ bộ kiểm thử được chạy bằng lệnh `pytest tests/ -v` trên môi trường SQLite Async in-memory:

```text
============================= test session starts =============================
platform win32 -- Python 3.14.5, pytest-9.1.1, pluggy-1.6.0
collected 19 items

english-center-backend/tests/test_attendance.py::test_tc07_exclude_reserved_and_dropped_students_from_attendance PASSED [  5%]
english-center-backend/tests/test_attendance.py::test_tc08_absent_students_always_receive_absent_notice PASSED [ 10%]
english-center-backend/tests/test_attendance.py::test_tc11_cancelled_session_does_not_send_notifications PASSED [ 15%]
english-center-backend/tests/test_auth.py::test_login_success PASSED     [ 21%]
english-center-backend/tests/test_auth.py::test_login_invalid_password PASSED [ 26%]
english-center-backend/tests/test_auth.py::test_get_me PASSED            [ 31%]
english-center-backend/tests/test_cron_end_shift.py::test_tc10_unrecorded_attendance_safety_net_does_not_send_false_notices PASSED [ 36%]
english-center-backend/tests/test_cron_end_shift.py::test_tc14_advisory_lock_prevents_concurrent_runs PASSED [ 42%]
english-center-backend/tests/test_manual_scores.py::test_tc12_partial_and_additional_manual_scores_without_duplicate PASSED [ 47%]
english-center-backend/tests/test_manual_scores.py::test_block_manual_score_for_absent_student PASSED [ 52%]
english-center-backend/tests/test_online_exam.py::test_tc04_online_exam_does_not_leak_correct_answers PASSED [ 57%]
english-center-backend/tests/test_online_exam.py::test_tc03_block_duplicate_exam_submission PASSED [ 63%]
english-center-backend/tests/test_online_exam.py::test_tc05_score_rounding_to_one_decimal PASSED [ 68%]
english-center-backend/tests/test_students.py::test_tc06_validate_vietnamese_phone_number PASSED [ 73%]
english-center-backend/tests/test_tenant_isolation.py::test_tc01_teacher_cannot_access_other_teacher_class PASSED [ 78%]
english-center-backend/tests/test_tenant_isolation.py::test_tc02_multi_tenant_isolation PASSED [ 84%]
english-center-backend/tests/test_tenant_isolation.py::test_tc13_license_guard_blocks_writes_when_expired PASSED [ 89%]
english-center-backend/tests/test_zalo_adapter.py::test_tc09_zalo_idempotency_prevents_duplicate_notices PASSED [ 94%]
english-center-backend/tests/test_zalo_adapter.py::test_tc15_per_student_error_isolation PASSED [100%]

======================= 19 passed in 19.88s =======================
```

### Bảng Ma Trận 15 Edge Cases Nghiệp Vụ:
* **TC-01:** Giáo viên A truy cập lớp giáo viên B $\rightarrow$ Trả về `404 Not Found` (**PASSED**).
* **TC-02:** Admin Trung tâm 2 truy cập học sinh Trung tâm 1 $\rightarrow$ Trả về `404 Not Found` (**PASSED**).
* **TC-03:** Học sinh nộp bài thi trắc nghiệm lần 2 $\rightarrow$ Bị chặn `400 EXAM_ALREADY_SUBMITTED` (**PASSED**).
* **TC-04:** Học sinh xem đề thi online $\rightarrow$ Ẩn hoàn toàn `dap_an_dung` (**PASSED**).
* **TC-05:** Điểm số trắc nghiệm lẻ ($2/3 \times 10 = 6.6666...$) $\rightarrow$ Tự động làm tròn thành `6.7` (**PASSED**).
* **TC-06:** Số điện thoại bàn/sai cấu trúc bị từ chối 422; số di động VN hợp lệ được chấp nhận (**PASSED**).
* **TC-07:** Học sinh `BaoLuu` và `DaNghi` hoàn toàn biến mất khỏi danh sách điểm danh (**PASSED**).
* **TC-08:** Học sinh tick Vắng luôn nhận được thông báo báo vắng (**PASSED**).
* **TC-09:** Cơ chế Idempotency chống gửi lặp 2 tin Zalo cho cùng 1 học sinh/buổi học (**PASSED**).
* **TC-10:** Giáo viên quên điểm danh thì Cron Job cuối ca không tự ý gửi tin vắng ảo (**PASSED**).
* **TC-11:** Buổi học bị hủy hoặc báo nghỉ lễ không phát bất kỳ tin nhắn nào (**PASSED**).
* **TC-12:** Nhập điểm bổ sung cho thi giấy chỉ gửi tin cho các học sinh mới nhập (**PASSED**).
* **TC-13:** Trung tâm hết hạn bản quyền bị chặn thao tác ghi với mã lỗi `SAAS_LICENSE_EXPIRED`, thao tác đọc vẫn hoạt động (**PASSED**).
* **TC-14:** Advisory Lock ngăn chặn 2 worker chạy trùng ca học cùng một thời điểm (**PASSED**).
* **TC-15:** Lỗi gửi tin của một học sinh không làm sập vòng lặp gửi tin của cả lớp (**PASSED**).

---

## 10. HƯỚNG DẪN KẾT NỐI VỚI FRONTEND REACT

Backend đã được tinh chỉnh để tương thích 100% với Frontend React trong thư mục `english-center-frontend/`:
1. **Base URL:** `http://localhost:5000/api` (Khớp chính xác với cấu hình `axiosClient.js`).
2. **CORS:** Đã cấu hình cho phép `http://localhost:5173`.
3. **Đăng nhập thử nghiệm:**
   - Khởi động backend: `uvicorn app.main:app --port 5000`
   - Khởi động frontend: `cd english-center-frontend && npm run dev`
   - Đăng nhập với:
     - `admin@center.edu.vn` / `Password123@` (Admin)
     - `teacher@center.edu.vn` / `Password123@` (Giáo viên)
     - `super@saas.com` / `Password123@` (SuperAdmin)
   - Tất cả các trang Dashboard, Học sinh, Lớp học, Lịch dạy, Điểm danh, Thi cử và Lịch sử Zalo đều kết nối và hiển thị dữ liệu thật từ Backend!

---

## 11. CÁC ĐIỂM CẦN LƯU Ý KHI TRIỂN KHAI PRODUCTION

1. **Khóa Bí Mật Zalo:** Thông tin `zalo_secret_key` và `zalo_access_token` được lưu trữ an toàn trong bảng `TrungTam` và không bao giờ trả về qua API công khai của giáo viên hay học sinh.
2. **Mở Rộng Nhiều Worker:** Khi scale hệ thống lên nhiều container trên Docker Swarm hoặc Kubernetes, hãy kích hoạt biến `REDIS_URL` để Redis đảm nhiệm vai trò Distributed Lock và Cache thay thế cho in-memory lock.
3. **Cắm Tài Khoản Zalo Thật:** Khi Thầy hoàn tất đăng ký Zalo Cloud API, SuperAdmin chỉ cần vào màn hình Quản lý Trung tâm (`/centers`), nhập `OA ID` và `Access Token` là hệ thống tự động kích hoạt chế độ gửi tin thật 100% mà không cần sửa bất kỳ dòng code nào.

---

## 12. KẾT LUẬN

Hệ thống Backend bằng Python cho dự án **Tool Quản Lý Trung Tâm Tiếng Anh (B2B SaaS)** đã được xây dựng hoàn thiện:
* ✅ Đúng kiến trúc Clean Modular Architecture, không dùng code skeleton hay hàm `pass`/TODO.
* ✅ Toàn bộ 11 modules nghiệp vụ, 11 bảng cơ sở dữ liệu, 44 API Endpoints hoạt động trơn tru.
* ✅ Đạt 100% tỷ lệ vượt qua bài kiểm tra tự động (19/19 test cases passed).
* ✅ Đóng gói đầy đủ Dockerfile, docker-compose.yml, script seed data và README hướng dẫn.
* ✅ **Bảo vệ toàn vẹn repository:** Toàn bộ công việc được thực hiện độc lập 100% bên trong thư mục `english-center-backend/`, không có bất kỳ file bên ngoài nào bị chỉnh sửa hay làm xáo trộn.


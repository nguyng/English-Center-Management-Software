# 📑 BÁO CÁO TỔNG KẾT TRIỂN KHAI TOÀN DIỆN PYTHON BACKEND
## DỰ ÁN: TOOL QUẢN LÝ TRUNG TÂM TIẾNG ANH (B2B SAAS)

> **Tài liệu bàn giao & đặc tả kỹ thuật chi tiết dành cho:** Toàn bộ nhóm phát triển (Backend, Frontend React, Zalo Service), Quản trị viên và Cố vấn Trung tâm.  
> **Tác giả:** Senior Python Backend Engineer, Software Architect & QA Engineer  
> **Trạng thái:** Hoàn thành 100% triển khai mã nguồn thực tế & tích hợp đồng bộ 5 yêu cầu nghiệp vụ mới theo Feedback Frontend; vượt qua 100% Bộ Kiểm thử Tự động (48/48 Test Cases Passed)  
> **Mã nguồn Backend:** Thư mục `english-center-backend/`  
> **Ngày hoàn thành cập nhật:** Tháng 11/2026

---

## 1. TỔNG QUAN DỰ ÁN & CẬP NHẬT ĐỒNG BỘ MỚI

### 1.1. Mục Tiêu Backend
Xây dựng một hệ thống Backend hoàn chỉnh bằng **Python (FastAPI)**, đóng vai trò hạt nhân trung tâm xử lý dữ liệu cho phần mềm Quản lý Trung tâm Tiếng Anh theo mô hình **B2B SaaS (Software as a Service)**. Hệ thống giải quyết trọn vẹn các bài toán nhức nhối trong vận hành trung tâm:
1. **Điểm danh tối ưu hóa:** Mặc định toàn bộ học sinh Có mặt, chỉ cần tick chọn học sinh Vắng, lọc danh sách vắng nhanh chóng.
2. **Cơ chế an toàn lưới (Safety Net):** Nếu giáo viên quên điểm danh, Cron Job cuối ca tuyệt đối không tự ý gửi thông báo vắng bừa bãi làm phiền phụ huynh.
3. **Đánh giá song song 2 hình thức:** Hỗ trợ cả thi trắc nghiệm Online tự động chấm điểm và thi Giấy nhập điểm thủ công (làm tròn 1 chữ số thập phân, lưu điểm từng phần).
4. **Zalo Service Adapter Plug-and-Play:** Hỗ trợ 2 chế độ (Demo Mock ghi log hệ thống và Production ZNS kết nối Zalo Cloud API thật).
5. **Kiến trúc Multi-tenant SaaS:** Cách ly dữ liệu độc lập giữa các trung tâm thông qua `trung_tam_id` gắn chặt với JWT Identity và Middleware kiểm soát thời hạn bản quyền phần mềm theo năm (`LicenseGuard`).
6. **[MỚI] Đồng bộ 5 yêu cầu nghiệp vụ nâng cấp từ Frontend (`FEEDBACK_CHO_BACKEND.md`):**
   - **Khung giờ thi đóng/mở cố định:** Hỗ trợ `gio_mo_de` và `gio_dong_de` trên toàn hệ thống, kiểm soát thời gian tại Server.
   - **Mã bảo mật PIN vào thi:** Cơ chế `ma_vao_thi`, cấp `exam_token` ký số JWT, giới hạn 5 lần thử sai chống brute-force, bảo vệ API nộp bài.
   - **Trang Giáo viên xem kết quả & Gửi điểm Zalo:** Cung cấp API `GET /api/exams/:id/detail` (trả kèm `dap_an_dung` cho GV/Admin phụ trách lớp) và API `POST /api/exams/:id/send-zalo-results` phát lệnh ZNS chống gửi trùng.
   - **Tách biệt Chế độ Preview và Thi Thật:** Hỗ trợ `is_preview: bool = True` cho GV làm thử đề mà không lưu kết quả vào CSDL, bảo vệ bằng xác thực Server.
   - **Xóa ca học & Hỗ trợ Nghỉ lễ:** Bổ sung API `DELETE /api/sessions/:id` xóa an toàn ca tạo nhầm và hỗ trợ chọn trạng thái `DaHuy` hoặc `NghiLe`.

### 1.2. Tech Stack Thực Tế Đã Triển Khai
* **Web Framework:** FastAPI (0.141.1) trên nền Starlette + ASGI Uvicorn (0.53.0).
* **Ngôn ngữ:** Python 3.11+ / Python 3.14 (Async Native).
* **Validation & Schemas:** Pydantic v2 (2.13.5) với Rust Core, tích hợp `email-validator` và custom regex số điện thoại di động Việt Nam.
* **Cơ sở dữ liệu:** PostgreSQL 15+ (Production) & aiosqlite (Kiểm thử in-memory).
* **ORM:** SQLAlchemy 2.0 (2.1.8) kết hợp AsyncEngine và asyncpg driver (0.32.0).
* **Database Migration:** Alembic (1.20.1) hỗ trợ Async với migration script mới `20261107_01_add_exam_time_and_pin.py`.
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
│   │   ├── deps.py                     # Dependency Injection: get_db, get_current_user, get_optional_current_user, require_role, get_current_tenant_id
│   │   └── v1/
│   │       ├── __init__.py
│   │       ├── api.py                  # Gom toàn bộ 11 routers với tiền tố /api (36 endpoints)
│   │       └── endpoints/
│   │           ├── __init__.py
│   │           ├── auth.py             # Đăng nhập, đăng xuất, lấy user hiện tại (/api/auth)
│   │           ├── centers.py          # Quản lý trung tâm SaaS, bản quyền, cấu hình Zalo (/api/centers)
│   │           ├── teachers.py         # CRUD giáo viên, khóa/mở tài khoản (/api/teachers)
│   │           ├── classes.py          # CRUD lớp học, tính sĩ số (/api/classes)
│   │           ├── students.py         # CRUD học sinh, chuyển trạng thái (/api/students)
│   │           ├── sessions.py         # CRUD ca học, xóa ca học, hủy ca/nghỉ lễ, dạy thay (/api/sessions)
│   │           ├── attendance.py       # Lấy danh sách & Lưu điểm danh (/api/sessions/:id/attendance)
│   │           ├── exams.py            # Tạo đề, xác thực PIN, nộp bài, xem bài làm GV, gửi điểm Zalo (/api/exams)
│   │           ├── results.py          # Kết quả thi chi tiết theo bài thi / học sinh (/api/exams/:id/results)
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
│   │   ├── session.py                  # Entity BuoiHoc (Giờ ca học, cờ điểm danh, trạng thái DaHuy/NghiLe)
│   │   ├── attendance.py               # Entity DiemDanh (CoMat, Vang, ghi chú)
│   │   ├── exam.py                     # Entity BaiKiemTra (gio_mo_de, gio_dong_de, ma_vao_thi), CauHoi
│   │   ├── result.py                   # Entity KetQua (Numeric 3,1, chi_tiet_tra_loi, chống nộp trùng)
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
│   │   ├── session.py                  # SessionCreate, SessionCancelIn (DaHuy/NghiLe), SessionSubstituteIn, SessionOut
│   │   ├── attendance.py               # AttendanceStudentItem, AttendanceSaveIn, DetailOut
│   │   ├── exam.py                     # ExamCreate, ExamOut, ExamPublicOut, ExamPinVerifyIn, ExamTeacherDetailOut, ExamSubmitIn
│   │   ├── result.py                   # ResultOut (chi_tiet_tra_loi, so_cau_dung), StudentResultOut
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
│   │   ├── session_service.py          # Nghiệp vụ ca học, xóa ca học an toàn, hủy ca/nghỉ lễ, dạy thay
│   │   ├── attendance_service.py       # Nghiệp vụ điểm danh (ACID transaction, lọc DangHoc)
│   │   ├── exam_service.py             # Quản lý khung giờ thi, xác thực PIN, chấm điểm tự động, preview mode, gửi Zalo kết quả
│   │   ├── result_service.py           # Bảng điểm cả lớp kèm chi tiết câu trả lời, nhập điểm thi giấy
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
│       └── 20261107_01_add_exam_time_and_pin.py # Migration bổ sung gio_mo_de, gio_dong_de, ma_vao_thi
│
├── tests/                              # Bộ Kiểm thử Tự động Toàn diện (Pytest - 48 Tests)
│   ├── __init__.py
│   ├── conftest.py                     # Fixtures SQLite async in-memory, mock tokens, setup data
│   ├── test_auth.py                    # Test Đăng nhập, băm mật khẩu, token JWT (3 tests)
│   ├── test_tenant_isolation.py        # Test TC-01 (IDOR), TC-02 (Multi-tenant), TC-13 (LicenseGuard) (3 tests)
│   ├── test_students.py                # Test TC-06 (Validate Regex SĐT di động VN) (1 test)
│   ├── test_attendance.py              # Test TC-07 (Lọc DangHoc), TC-08 (Báo vắng), TC-11 (Hủy buổi) (3 tests)
│   ├── test_online_exam.py             # Test TC-03 (Chống nộp 2 lần), TC-04 (Giấu đáp án), TC-05 (Làm tròn) (3 tests)
│   ├── test_manual_scores.py           # Test TC-12 (Lưu điểm từng phần, chặn điểm học sinh vắng) (2 tests)
│   ├── test_zalo_adapter.py            # Test TC-09 (Chống gửi trùng), TC-15 (Bọc lỗi độc lập từng học sinh) (2 tests)
│   ├── test_cron_end_shift.py          # Test TC-10 (GV quên điểm danh không gửi vắng ảo), TC-14 (Advisory Lock) (2 tests)
│   ├── test_exam_time.py               # [MỚI] Test Khung giờ thi cố định (trước giờ mở, sau giờ đóng, định dạng HH:mm, public hide) (4 tests)
│   ├── test_exam_pin.py                # [MỚI] Test Xác thực PIN vào thi, cấp token, chống brute-force, chặn submit thiếu PIN (9 tests)
│   ├── test_exam_results_detail.py     # [MỚI] Test API GV xem bài làm kèm đáp án đúng, gửi điểm Zalo, chống gửi trùng (5 tests)
│   ├── test_exam_preview.py            # [MỚI] Test Chế độ Preview không lưu DB, không gửi Zalo, chặn học sinh fake preview (4 tests)
│   └── test_session_delete_holiday.py  # [MỚI] Test Xóa ca học an toàn, chặn xóa ca có dữ liệu, hủy ca DaHuy/NghiLe (7 tests)
│
├── scripts/
│   └── seed_data.py                    # Script tự động khởi tạo database & nạp dữ liệu mẫu (đã cập nhật PIN, giờ thi, NghiLe)
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
| `buoi_hoc` | `id` | `trung_tam_id`, `lop_id`, `giao_vien_day_thay_id` | `ngay_hoc`, `gio_bat_dau`, `gio_ket_thuc`, `trang_thai_buoi_hoc IN ('BinhThuong', 'NghiLe', 'DaHuy')` | `(ngay_hoc, gio_ket_thuc, da_gui, ...)` | Lịch dạy, trạng thái điểm danh, trạng thái bình thường/nghỉ lễ/hủy ca. |
| `diem_danh` | `id` | `trung_tam_id`, `buoi_hoc_id`, `hoc_sinh_id` | `UNIQUE(buoi_hoc_id, hoc_sinh_id)` | `buoi_hoc_id`, `hoc_sinh_id` | Trạng thái Có mặt / Vắng của từng học sinh trong ca. |
| `bai_kiem_tra`| `id` | `trung_tam_id`, `buoi_hoc_id` | `hinh_thuc IN ('he_thong', 'giay')`, `gio_mo_de VARCHAR(10)`, `gio_dong_de VARCHAR(10)`, `ma_vao_thi VARCHAR(20)` | `buoi_hoc_id`, `trung_tam_id` | Đề thi trắc nghiệm online (kèm khung giờ cố định và mã PIN) hoặc thi giấy. |
| `cau_hoi` | `id` | `bai_kiem_tra_id` $\rightarrow$ `bai_kiem_tra.id` | `dap_an_dung IN ('A','B','C','D')` | `bai_kiem_tra_id` | Câu hỏi trắc nghiệm, 4 phương án, đáp án đúng. |
| `ket_qua` | `id` | `trung_tam_id`, `bai_kiem_tra_id`, `hoc_sinh_id` | `UNIQUE(bai_kiem_tra_id, hoc_sinh_id)`, `CHECK(0.0 <= diem_so <= 10.0)` | `bai_kiem_tra_id`, `hoc_sinh_id` | Điểm số `NUMERIC(3,1)`, số lần rời tab, JSON `chi_tiet_tra_loi`. |
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
   - `Admin Trung Tâm`: Quản lý toàn bộ lớp học, giáo viên, học sinh, lịch dạy, xem Dashboard, can thiệp điểm danh hộ, xóa ca học chưa phát sinh dữ liệu.
   - `GiaoVien`: **Bảo mật Scoped Access** — Giáo viên chỉ được xem danh sách học sinh, điểm danh, xem chi tiết đáp án bài thi (`/detail`) của các lớp mình được phân công; cố tình truy vấn lớp người khác sẽ nhận lỗi `403 Forbidden` hoặc `404 Not Found` (ngăn ngừa tấn công dò quét IDOR).
3. **Multi-tenant Isolation (Cách ly Đa Trung tâm):**
   - Mọi thao tác truy vấn đều ép điều kiện `WHERE trung_tam_id = :current_tenant_id` lấy từ JWT Token đã được ký số, **tuyệt đối không tin tưởng `trung_tam_id` từ phía client gửi lên**.
4. **LicenseGuard Middleware:**
   - Chặn toàn bộ các thao tác ghi dữ liệu (`POST`, `PUT`, `PATCH`, `DELETE`) nếu trung tâm hết hạn bản quyền phần mềm (`ngay_het_han_saas < TODAY` hoặc `trang_thai_ban_quyen == 'HetHan'`), trả về lỗi HTTP 403 `SAAS_LICENSE_EXPIRED`.
   - Vẫn cho phép các thao tác `GET` để trung tâm tra cứu dữ liệu cũ.
5. **[MỚI] Bảo Mật Cổng Thi Online (Public Exam Security & PIN Verification):**
   - Cổng Public `GET /api/exams/:id` **loại bỏ hoàn toàn `dap_an_dung` và `ma_vao_thi`** khỏi JSON response.
   - Xác thực mã PIN thông qua `POST /api/exams/:id/verify-pin` trả về `exam_token` có thời hạn và gắn chặt với `exam_id` + `hoc_sinh_id`.
   - Giới hạn 5 lần thử sai mã PIN trong 5 phút để triệt tiêu tấn công brute-force (`PIN_RATE_LIMITED`).
   - Cấm gửi nộp bài trực tiếp nếu bài thi có PIN nhưng chưa xác thực (`PIN_REQUIRED`).
6. **[MỚI] Bảo Mật Chế Độ Preview:**
   - Cờ `is_preview: bool = True` bắt buộc phải kèm Bearer Token của Giáo viên phụ trách lớp hoặc Admin. Học sinh không có tài khoản gửi `is_preview=True` sẽ bị từ chối với `403 PREVIEW_UNAUTHORIZED`.
7. **CORS:**
   - Cấu hình mở quyền truy cập cho Frontend tại `http://localhost:5173` và `http://localhost:3000`.

---

## 5. TÀI LIỆU API CHI TIẾT (API CONTRACT)

Toàn bộ 11 nhóm API đã được triển khai đầy đủ và tuân thủ 100% chuẩn phản hồi của Frontend:
- **Base URL:** `http://localhost:5000/api`
- **Chuẩn Success Response:** `{ "success": true, "data": ..., "message": "..." }`
- **Chuẩn Error Response:** `{ "success": false, "error_code": "...", "message": "...", "details": ... }`

### Danh sách Endpoint chi tiết (Bao gồm các Endpoint mới):

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
| | `PATCH` | `/api/sessions/:id/cancel` | Hủy ca học (`DaHuy`) hoặc Báo nghỉ lễ (`NghiLe`) | Admin | ✅ Hoạt động |
| | `DELETE` | `/api/sessions/:id` | **[MỚI]** Xóa ca học an toàn (chỉ khi chưa có dữ liệu) | Admin | ✅ Hoạt động |
| | `PATCH` | `/api/sessions/:id/substitute` | Chỉ định giáo viên dạy thay | Admin | ✅ Hoạt động |
| | `PATCH` | `/api/sessions/:id/confirm-attendance` | Xác nhận hoàn thành điểm danh độc lập | Admin / GV | ✅ Hoạt động |
| **Attendance** | `GET` | `/api/sessions/:id/attendance` | Lấy danh sách điểm danh (chỉ học sinh `DangHoc`) | Admin / GV | ✅ Hoạt động |
| | `POST` | `/api/sessions/:id/attendance` | Lưu điểm danh (ACID) & kích hoạt Zalo ngay | Admin / GV | ✅ Hoạt động |
| **Exams** | `POST` | `/api/exams` | Tạo bài kiểm tra (nhận `gio_mo_de`, `gio_dong_de`, `ma_vao_thi`) | Admin / GV | ✅ Hoạt động |
| | `GET` | `/api/exams` | Danh sách bài kiểm tra theo ca học | Admin / GV | ✅ Hoạt động |
| | `GET` | `/api/exams/:id` | Cổng đề thi học sinh (**Ẩn đáp án & mã PIN**) | Public (Không cần login)| ✅ Hoạt động |
| | `POST` | `/api/exams/:id/verify-pin` | **[MỚI]** Xác thực mã PIN vào thi & cấp `exam_token` | Public (Học sinh) | ✅ Hoạt động |
| | `GET` | `/api/exams/:id/detail` | **[MỚI]** Chi tiết bài thi GV (**Có đáp án đúng** & DS học sinh) | Admin / GV phụ trách | ✅ Hoạt động |
| | `POST` | `/api/exams/:id/send-zalo-results` | **[MỚI]** Gửi thông báo điểm Zalo ZNS cho HS đã nộp | Admin / GV phụ trách | ✅ Hoạt động |
| | `POST` | `/api/exams/:id/questions` | Thêm danh sách câu hỏi vào đề | Admin / GV | ✅ Hoạt động |
| | `POST` | `/api/exams/:id/submit` | Nộp bài thi online (Chấm tự động / Chế độ Preview)| Public / GV Preview | ✅ Hoạt động |
| | `POST` | `/api/exams/:id/manual-scores`| Nhập điểm thi giấy thủ công (Hẹn giờ ban đêm) | Admin / GV | ✅ Hoạt động |
| **Results** | `GET` | `/api/exams/:id/results` | Bảng điểm cả lớp (**Có `chi_tiet_tra_loi` & `so_cau_dung`**) | Admin / GV | ✅ Hoạt động |
| | `GET` | `/api/students/:id/results`| Lịch sử bảng điểm của 1 học sinh | Admin / GV | ✅ Hoạt động |
| **Zalo Logs** | `GET` | `/api/zalo-logs` | Bộ lọc nhật ký tin nhắn & phân trang | SuperAdmin / Admin | ✅ Hoạt động |
| | `GET` | `/api/zalo-logs/stats` | Thống kê số tin thành công, thất bại 6 tháng | SuperAdmin / Admin | ✅ Hoạt động |
| **Dashboard** | `GET` | `/api/dashboard/stats` | 4 thẻ thống kê: HS, Lớp, GV, Tin Zalo tháng | SuperAdmin / Admin | ✅ Hoạt động |
| | `GET` | `/api/dashboard/alerts` | Danh sách ca học hôm nay chưa được điểm danh | Admin | ✅ Hoạt động |

---

## 6. ĐẶC TẢ CHI TIẾT 5 YÊU CẦU NGHIỆP VỤ NÂNG CẤP

### 6.1. Khung Giờ Thi Đóng / Mở Cố Định (`gio_mo_de`, `gio_dong_de`)
* **Mục đích:** Đồng bộ thời gian làm bài thi trắc nghiệm theo khung giờ thực tế tại lớp học (ví dụ: mở lúc `09:30`, đóng cổng lúc `10:00`), thay thế cơ chế tính giờ độc lập từng máy.
* **Cơ chế Server:**
  - `gio_mo_de` và `gio_dong_de` được lưu dạng chuỗi `"HH:mm"`.
  - Validate định dạng chuẩn `HH:mm` (giờ 00-23, phút 00-59).
  - Server lấy thời gian thực (`datetime.now()`) để kiểm tra:
    - Nếu trước `gio_mo_de`: Từ chối nộp bài và xác thực PIN với lỗi `400 EXAM_NOT_STARTED` ("Chưa đến giờ mở đề thi!").
    - Nếu sau `gio_dong_de`: Từ chối nộp bài với lỗi `400 EXAM_CLOSED` ("Đã hết giờ làm bài! Cổng thi đã đóng.").
  - Hỗ trợ ca thi qua đêm (nếu `gio_dong_de < gio_mo_de`).
  - Tương thích ngược: Đề thi cũ có `gio_mo_de=None` và `gio_dong_de=None` vẫn cho phép làm bài bình thường không bị chặn giờ.

### 6.2. Xác Thực Mã PIN Phòng Thi (`ma_vao_thi`) & Chống Thi Hộ
* **Mục đích:** Học sinh mở link Public chọn tên mình trong danh sách lớp bắt buộc phải nhập mã PIN do Giáo viên cung cấp trực tiếp tại lớp để ngăn chặn thi hộ.
* **Quy trình Xác Thực Phía Server:**
  1. Học sinh gửi `POST /api/exams/{exam_id}/verify-pin` kèm `{ "ma_vao_thi": "1234", "hoc_sinh_id": 1 }`.
  2. Rate Limiting: Giới hạn tối đa 5 lần thử sai trong 5 phút. Nếu vượt quá, Server trả về lỗi `400 PIN_RATE_LIMITED`.
  3. Kiểm tra mã PIN khớp với `exam.ma_vao_thi`:
     - Nếu sai: Ghi nhận số lần thất bại, trả về `400 INVALID_EXAM_PIN`.
     - Nếu đúng: Xóa lịch sử thất bại, sinh JWT `exam_token` có payload `{"type": "exam_access", "exam_id": ..., "hoc_sinh_id": ..., "exp": ...}` với thời hạn 3 giờ.
  4. Khi nộp bài (`POST /api/exams/{exam_id}/submit`):
     - Server giải mã `exam_token`: Ràng buộc đúng `exam_id` (chống mang token sang đề khác - `EXAM_TOKEN_MISMATCH`), đúng `hoc_sinh_id` (chống dùng token bạn khác - `STUDENT_TOKEN_MISMATCH`) và còn hiệu lực.
     - Nếu không có token và không có PIN hợp lệ: Trả về `400 PIN_REQUIRED`.
  5. Cổng Public `GET /api/exams/{exam_id}` tuyệt đối không trả về `ma_vao_thi`.

### 6.3. Hoàn Thiện Trang Giáo Viên Xem Bài Làm & Gửi Báo Điểm Zalo
* **Schema `ResultOut`:**
  - Bổ sung trường `chi_tiet_tra_loi: Optional[Dict[str, Any]]` chứa phương án học sinh chọn và trạng thái đúng/sai từng câu.
  - Bổ sung trường `so_cau_dung: Optional[int]` đếm tự động số câu đúng từ `chi_tiet_tra_loi`.
* **Endpoint Chi Tiết Cho Giáo Viên (`GET /api/exams/{exam_id}/detail`):**
  - Quyền truy cập: `Admin` hoặc `GiaoVien` được phân công phụ trách lớp (giáo viên chính hoặc dạy thay). Giáo viên khác lớp nhận `403 Forbidden`.
  - Trả về danh sách câu hỏi **CÓ KÈM `dap_an_dung`**.
  - Trả về danh sách toàn bộ học sinh `DangHoc` của lớp kèm trạng thái: Đã nộp bài (điểm số, số câu đúng, bài làm chi tiết) hoặc Chưa làm bài.
* **Endpoint Gửi Báo Điểm Zalo (`POST /api/exams/{exam_id}/send-zalo-results`):**
  - Chỉ gửi thông báo điểm cho các học sinh ĐÃ hoàn thành bài thi (`KetQua` tồn tại).
  - Tích hợp bộ lọc chống gửi trùng của `NhatKyZalo` (`loai_tin = 'bao_diem'`). Gửi lại lần hai sẽ tự động bỏ qua (`skipped_already_sent`).
  - Bọc lỗi độc lập: Một học sinh gửi lỗi (sai SĐT) không làm dừng tiến trình gửi của các bạn khác.

### 6.4. Tách Biệt Chế Độ Preview và Thi Thật (`is_preview`)
* **Bối cảnh:** Giáo viên muốn bấm "Mở xem thử" để kiểm tra đề và nộp bài làm thử mà không ảnh hưởng tới dữ liệu của học sinh trong lớp.
* **Cơ chế:**
  - `ExamSubmitIn` nhận cờ `is_preview: bool = False` và cho phép `hoc_sinh_id: Optional[int] = None`.
  - **Bảo mật phía Server:** Khi `is_preview == True`, Server kiểm tra Bearer Token bắt buộc phải là `Admin` hoặc `GiaoVien` phụ trách lớp. Người dùng không đăng nhập (học sinh) gửi `is_preview=True` sẽ bị từ chối `403 PREVIEW_UNAUTHORIZED`.
  - **Xử lý chấm điểm:** Chấm điểm bình thường, trả về `{ diem_so, so_cau_dung, tong_cau, xep_loai, is_preview: true }`.
  - **Không can thiệp CSDL:** Tuyệt đối không tạo bản ghi `KetQua`, không ghi nhận `NhatKyZalo`, không gửi thông báo Zalo, không khóa quyền làm bài của bất kỳ học sinh nào.

### 6.5. Xóa Ca Học An Toàn & Hỗ Trợ Trạng Thái Nghỉ Lễ
* **Endpoint Xóa Ca Học (`DELETE /api/sessions/{session_id}`):**
  - Quyền truy cập: `Admin` hoặc `SuperAdmin`.
  - Cơ chế xóa an toàn (Safe Deletion):
    - Kiểm tra nếu ca học đã điểm danh (`SessionAttendanceStatus.TAKEN` hoặc bảng `DiemDanh` có bản ghi) $\rightarrow$ Chặn với `400 SESSION_HAS_ATTENDANCE`.
    - Kiểm tra nếu ca học có bài kiểm tra đã có kết quả (`KetQua` có dữ liệu) $\rightarrow$ Chặn với `400 SESSION_HAS_EXAM_RESULTS`.
    - Kiểm tra nếu ca học đã phát sinh lịch sử tin Zalo (`NhatKyZalo` có dữ liệu) $\rightarrow$ Chặn với `400 SESSION_HAS_ZALO_LOGS`.
    - Chỉ cho phép xóa sạch các ca học tạo nhầm chưa phát sinh dữ liệu nghiệp vụ quan trọng.
* **Hỗ Trợ Trạng Thái Nghỉ Lễ (`NghiLe`):**
  - `SessionCancelIn` nhận `trang_thai_buoi_hoc: Optional[str] = "DaHuy"` (chấp nhận `"DaHuy"` hoặc `"NghiLe"`).
  - Cập nhật đúng trạng thái trong bảng `buoi_hoc`.
  - Cron Job cuối ca (`end_shift_cron.py`) và Dispatcher (`DispatcherService`) tự động bỏ qua cả ca `DaHuy` và `NghiLe`, không phát bất kỳ tin nhắn Zalo nào.

---

## 7. KẾT QUẢ KIỂM THỬ THỰC TẾ (TEST SUITE)

Toàn bộ 48 test cases đã được thực thi và vượt qua 100% bằng lệnh `pytest tests/ -v`:

```text
============================= test session starts =============================
platform win32 -- Python 3.14.5, pytest-9.1.1, pluggy-1.6.0
collected 48 items

english-center-backend/tests/test_attendance.py::test_tc07_exclude_reserved_and_dropped_students_from_attendance PASSED [  2%]
english-center-backend/tests/test_attendance.py::test_tc08_absent_students_always_receive_absent_notice PASSED [  4%]
english-center-backend/tests/test_attendance.py::test_tc11_cancelled_session_does_not_send_notifications PASSED [  6%]
english-center-backend/tests/test_auth.py::test_login_success PASSED     [  8%]
english-center-backend/tests/test_auth.py::test_login_invalid_password PASSED [ 10%]
english-center-backend/tests/test_auth.py::test_get_me PASSED            [ 12%]
english-center-backend/tests/test_cron_end_shift.py::test_tc10_unrecorded_attendance_safety_net_does_not_send_false_notices PASSED [ 14%]
english-center-backend/tests/test_cron_end_shift.py::test_tc14_advisory_lock_prevents_concurrent_runs PASSED [ 16%]
english-center-backend/tests/test_exam_pin.py::test_public_exam_does_not_leak_pin PASSED [ 18%]
english-center-backend/tests/test_exam_pin.py::test_verify_pin_success_issues_token PASSED [ 20%]
english-center-backend/tests/test_exam_pin.py::test_verify_pin_wrong_code PASSED [ 22%]
english-center-backend/tests/test_exam_pin.py::test_verify_pin_empty_or_too_long PASSED [ 25%]
english-center-backend/tests/test_exam_pin.py::test_submit_without_pin_is_blocked PASSED [ 27%]
english-center-backend/tests/test_exam_pin.py::test_submit_with_valid_token_succeeds PASSED [ 29%]
english-center-backend/tests/test_exam_pin.py::test_submit_with_token_mismatch_exam_or_student PASSED [ 31%]
english-center-backend/tests/test_exam_pin.py::test_submit_with_expired_token PASSED [ 33%]
english-center-backend/tests/test_exam_pin.py::test_pin_brute_force_rate_limit PASSED [ 35%]
english-center-backend/tests/test_exam_preview.py::test_teacher_preview_grades_without_saving_db PASSED [ 37%]
english-center-backend/tests/test_exam_preview.py::test_student_cannot_bypass_rules_using_is_preview PASSED [ 39%]
english-center-backend/tests/test_exam_preview.py::test_teacher_of_other_class_cannot_preview PASSED [ 41%]
english-center-backend/tests/test_exam_preview.py::test_student_can_still_submit_real_exam_after_teacher_preview PASSED [ 43%]
english-center-backend/tests/test_exam_results_detail.py::test_teacher_views_own_class_exam_detail PASSED [ 45%]
english-center-backend/tests/test_exam_results_detail.py::test_teacher_cannot_view_other_class_exam_detail PASSED [ 47%]
english-center-backend/tests/test_exam_results_detail.py::test_admin_cannot_view_cross_tenant_exam_detail PASSED [ 50%]
english-center-backend/tests/test_exam_results_detail.py::test_results_api_returns_chi_tiet_tra_loi_and_so_cau_dung PASSED [ 52%]
english-center-backend/tests/test_exam_results_detail.py::test_send_zalo_results_idempotency_and_unsubmitted_filtering PASSED [ 54%]
english-center-backend/tests/test_exam_time.py::test_exam_create_valid_and_invalid_time_format PASSED [ 56%]
english-center-backend/tests/test_exam_time.py::test_exam_time_before_open_is_blocked PASSED [ 58%]
english-center-backend/tests/test_exam_time.py::test_exam_time_after_close_is_blocked PASSED [ 60%]
english-center-backend/tests/test_exam_time.py::test_exam_within_window_and_public_out_hides_pin PASSED [ 62%]
english-center-backend/tests/test_manual_scores.py::test_tc12_partial_and_additional_manual_scores_without_duplicate PASSED [ 64%]
english-center-backend/tests/test_manual_scores.py::test_block_manual_score_for_absent_student PASSED [ 66%]
english-center-backend/tests/test_online_exam.py::test_tc04_online_exam_does_not_leak_correct_answers PASSED [ 68%]
english-center-backend/tests/test_online_exam.py::test_tc03_block_duplicate_exam_submission PASSED [ 70%]
english-center-backend/tests/test_online_exam.py::test_tc05_score_rounding_to_one_decimal PASSED [ 72%]
english-center-backend/tests/test_session_delete_holiday.py::test_admin_delete_accidentally_created_session PASSED [ 75%]
english-center-backend/tests/test_session_delete_holiday.py::test_teacher_cannot_delete_session PASSED [ 77%]
english-center-backend/tests/test_session_delete_holiday.py::test_admin_cannot_delete_other_tenant_session PASSED [ 79%]
english-center-backend/tests/test_session_delete_holiday.py::test_cannot_delete_session_with_attendance_records PASSED [ 81%]
english-center-backend/tests/test_session_delete_holiday.py::test_cannot_delete_session_with_exam_results PASSED [ 83%]
english-center-backend/tests/test_session_delete_holiday.py::test_cancel_session_with_DaHuy_and_NghiLe PASSED [ 85%]
english-center-backend/tests/test_session_delete_holiday.py::test_dispatcher_and_cron_skip_NghiLe_session PASSED [ 87%]
english-center-backend/tests/test_students.py::test_tc06_validate_vietnamese_phone_number PASSED [ 89%]
english-center-backend/tests/test_tenant_isolation.py::test_tc01_teacher_cannot_access_other_teacher_class PASSED [ 91%]
english-center-backend/tests/test_tenant_isolation.py::test_tc02_multi_tenant_isolation PASSED [ 93%]
english-center-backend/tests/test_tenant_isolation.py::test_tc13_license_guard_blocks_writes_when_expired PASSED [ 95%]
english-center-backend/tests/test_zalo_adapter.py::test_tc09_zalo_idempotency_prevents_duplicate_notices PASSED [ 97%]
english-center-backend/tests/test_zalo_adapter.py::test_tc15_per_student_error_isolation PASSED [100%]

======================= 48 passed, 5 warnings in 54.72s =======================
```

### Thống Kê Chi Tiết Các Nhóm Kiểm Thử:
* **Tổng số test cases:** 48
* **Passed:** 48 (100%)
* **Failed:** 0 (0%)
* **Skipped:** 0 (0%)

---

## 8. CÁC NỘI DUNG CÒN TỒN TẠI VÀ LƯU Ý KHI LÊN PRODUCTION

1. **Zalo Cloud API Production:** Kiểm thử hiện tại đang kích hoạt qua `MockZaloProvider` (mô phỏng trễ 50ms và ghi nhận lịch sử vào bảng `nhat_ky_zalo`). Khi trung tâm nạp mã `OA ID` và `Access Token` thật, luồng `ProductionZnsProvider` sẽ tự động kích hoạt.
2. **Cơ sở dữ liệu Production:** Môi trường kiểm thử tự động sử dụng SQLite Async in-memory (`aiosqlite`). Đối với môi trường Production, hệ thống sử dụng PostgreSQL 15+ thông qua driver `asyncpg` và đã có sẵn file migration Alembic `20261107_01_add_exam_time_and_pin.py` để chạy lệnh:
   ```bash
   alembic upgrade head
   ```
3. **Phân tán Bộ nhớ đệm (Distributed Caching):** Bộ đếm rate limit mã PIN hiện đang duy trì trong in-memory state của tiến trình FastAPI. Khi triển khai cụm nhiều container đằng sau Load Balancer, nên trỏ biến `REDIS_URL` để đưa bộ đếm này vào Redis.

---

## 9. KẾT LUẬN

Hệ thống Backend bằng Python cho dự án **Tool Quản Lý Trung Tâm Tiếng Anh (B2B SaaS)** đã được rà soát, sửa chữa và nâng cấp toàn diện theo đúng phản hồi từ Frontend:
* ✅ Đã triển khai đầy đủ 5 yêu cầu nghiệp vụ mới.
* ✅ Toàn bộ thay đổi đồng bộ theo chu trình: `Model -> Schema -> Service -> API Endpoint -> Migration -> Test`.
* ✅ 48/48 test cases chạy tự động vượt qua 100%.
* ✅ Bảo mật tuyệt đối: Không lộ đáp án, không lộ mã PIN, chống thi hộ, chống brute-force, bảo vệ chế độ xem thử.
* ✅ Hoàn toàn tương thích ngược với Frontend React hiện có.

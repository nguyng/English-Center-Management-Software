# 📋 PHẢN HỒI KỸ THUẬT & YÊU CẦU ĐỒNG BỘ DÀNH CHO BACKEND
## DỰ ÁN: TOOL QUẢN LÝ TRUNG TÂM TIẾNG ANH (B2B SAAS)

> **Người gửi:** Phụ trách Frontend (`english-center-frontend/`) & Product Owner  
> **Người nhận:** Phụ trách Backend (`english-center-backend/`)  
> **Ngày tạo:** 07/11/2026  
> **Mục đích:** Đánh giá báo cáo `TONG_KET_BACKEND.md` và liệt kê chi tiết **5 thay đổi nghiệp vụ mới** vừa được cập nhật trên Frontend để Backend bổ sung API & Database Schema tương ứng.

---

## 1. ĐÁNH GIÁ CHUNG VỀ BẢN TRIỂN KHAI BACKEND HIỆN TẠI

Qua việc đọc và đối chiếu mã nguồn thực tế trong `english-center-backend/` cùng tài liệu `TONG_KET_BACKEND.md`, phía Frontend đánh giá rất cao chất lượng của Backend hiện tại:
* ✅ **Kiến trúc & Chuẩn giao tiếp:** Cấu trúc Clean Modular (`api`, `core`, `models`, `schemas`, `services`, `tasks`, `middleware`), chuẩn hóa `GenericResponse` (`{ success, data, message }`) và cấu hình CORS `http://localhost:5173` khớp hoàn toàn với `axiosClient.js` của Frontend.
* ✅ **Bảo mật Multi-tenant & RBAC:** Tách biệt dữ liệu theo `trung_tam_id` từ JWT, chống IDOR cho vai trò `GiaoVien`, và Middleware `LicenseGuard` chặn thao tác ghi khi hết hạn bản quyền (`403 SAAS_LICENSE_EXPIRED`).
* ✅ **Nghiệp vụ Điểm danh, Thi giấy & Cron Job:** Xử lý rất tốt việc lọc học sinh `DangHoc`, khóa nhập điểm cho học sinh vắng, chống gửi trùng Zalo (`NhatKyZalo`), hàng đợi ban đêm (`HenGioGuiTin` gửi lúc 07:30 sáng) và cơ chế Safety Net không báo vắng ảo khi giáo viên quên điểm danh.

---

## 2. 5 THAY ĐỔI NGHIỆP VỤ MỚI CẦN BACKEND CẬP NHẬT ĐỒNG BỘ

Trong quá trình kiểm thử thực tế luồng người dùng trên giao diện, dự án đã phát hiện và khắc phục **5 vấn đề logic cốt lõi** ở phía Frontend. Để khi ghép nối toàn trình (Full-stack Integration) không xảy ra lệch dữ liệu hoặc thiếu trường, đề nghị Backend cập nhật bổ sung 5 mục sau:

---

### 🔴 Yêu cầu 1: Đổi thời gian thi Online sang Khung Giờ Đóng/Mở Cố Định (`gio_mo_de`, `gio_dong_de`)
* **Bối cảnh nghiệp vụ:** Thời gian thi thực tế tại trung tâm là **khung giờ cố định** (ví dụ: mở đề lúc `09:30`, đóng cổng thu bài lúc `10:00`), không phải tính đếm ngược độc lập từ lúc từng học sinh bấm vào thi (tránh việc học sinh vào muộn lúc 09:55 vẫn có nguyên 15 phút làm bài sau khi các bạn khác đã thi xong và biết đề).
* **Hiện trạng Backend (`app/models/exam.py`, `app/schemas/exam.py`):**
  - Bảng `bai_kiem_tra` và schema `ExamCreate`, `ExamOut`, `ExamPublicOut` mới chỉ có `thoi_gian_phut: int`.
* **Yêu cầu chỉnh sửa Backend:**
  1. **Model `BaiKiemTra` (`app/models/exam.py`):** Bổ sung 2 cột:
     - `gio_mo_de: Mapped[Optional[str]] = mapped_column(String(10), nullable=True, default="08:00")` (Định dạng `"HH:mm"`)
     - `gio_dong_de: Mapped[Optional[str]] = mapped_column(String(10), nullable=True, default="22:00")` (Định dạng `"HH:mm"`)
     - *(Giữ lại `thoi_gian_phut` có giá trị mặc định để tương thích ngược với các test case cũ).*
  2. **Schemas (`app/schemas/exam.py`):** Thêm `gio_mo_de: Optional[str] = "08:00"` và `gio_dong_de: Optional[str] = "22:00"` vào `ExamCreate`, `ExamOut`, và `ExamPublicOut`.
  3. **Service (`app/services/exam_service.py`):** Lưu và trả về đầy đủ `gio_mo_de`, `gio_dong_de`.

---

### 🔴 Yêu cầu 2: Bổ sung Mã Bảo Mật PIN Vào Thi chống thi hộ (`ma_vao_thi`)
* **Bối cảnh nghiệp vụ:** Vì link thi (`/thi/:examId`) là Public không cần tài khoản và học sinh chọn tên mình từ danh sách lớp, cần có **Mã PIN vào phòng thi** do giáo viên tạo và đọc trực tiếp trên lớp để ngăn chặn việc bấm nhầm tên bạn khác hoặc người ngoài vào thi hộ.
* **Hiện trạng Backend:** Bảng `bai_kiem_tra` chưa có trường lưu mã PIN này.
* **Yêu cầu chỉnh sửa Backend:**
  1. **Model `BaiKiemTra` (`app/models/exam.py`):** Thêm cột `ma_vao_thi: Mapped[Optional[str]] = mapped_column(String(20), nullable=True, default="1234")`.
  2. **Schemas (`app/schemas/exam.py`):**
     - Thêm `ma_vao_thi: Optional[str] = "1234"` vào `ExamCreate` và `ExamOut` (dành cho Giáo viên xem lại mã PIN).
     - Thêm `ma_vao_thi: Optional[str] = None` vào `ExamSubmitIn` hoặc tạo endpoint `POST /api/exams/{exam_id}/verify-pin` nhận `{ "ma_vao_thi": "..." }` để xác thực mã PIN trước khi cho phép mở đề / nộp bài (tránh lộ mã PIN nếu học sinh mở F12 Network ở cổng Public).

---

### 🔴 Yêu cầu 3: Bổ sung API & Dữ liệu cho Trang Giáo Viên Xem Điểm và Bài Làm Của Học Sinh (`/exam/results/:examId`)
* **Bối cảnh nghiệp vụ:** Giáo viên đã có trang **Bảng Điểm & Phân Tích Bài Thi (`ExamResultsPage.jsx`)** để xem thống kê cả lớp, bấm vào từng học sinh để xem chi tiết học sinh đó chọn phương án nào (A/B/C/D), câu nào đúng, câu nào sai so với đáp án gốc, và bấm nút gửi báo điểm Zalo.
* **Hiện trạng Backend (`app/schemas/result.py`, `app/services/result_service.py`, `app/api/v1/endpoints/exams.py`):**
  - Bảng `KetQua` đã lưu rất tốt cột JSON `chi_tiet_tra_loi` (`{"1": {"selected": "B", "is_correct": true}, ...}`), nhưng schema `ResultOut` của API `GET /api/exams/{exam_id}/results` **chưa trả trường `chi_tiet_tra_loi` và `so_cau_dung` ra ngoài**.
  - API `GET /api/exams/{exam_id}` là cổng Public nên đã ẩn `dap_an_dung`, nhưng **chưa có API dành riêng cho Giáo viên** để lấy nội dung câu hỏi kèm `dap_an_dung` phục vụ hiển thị đối chiếu đáp án trên trang kết quả.
* **Yêu cầu chỉnh sửa Backend:**
  1. **Schema `ResultOut` (`app/schemas/result.py`) & `ResultService.get_results_by_exam`:**
     - Bổ sung trả về `chi_tiet_tra_loi: Optional[Dict[str, Any]] = None` (hoặc map phẳng `answers: Dict[str, str]`) và `so_cau_dung: Optional[int] = None`.
  2. **Endpoint Chi tiết đề thi cho Giáo viên (`app/api/v1/endpoints/exams.py`):**
     - Thêm `GET /api/exams/{exam_id}/detail` (yêu cầu đăng nhập `Admin` / `GiaoVien`) trả về thông tin đề thi + danh sách câu hỏi **CÓ KÈM `dap_an_dung`** + danh sách toàn bộ học sinh `DangHoc` của lớp đó (để Frontend hiển thị cả những học sinh `Đã nộp bài` lẫn `Chưa làm bài`).
  3. **Endpoint Gửi báo điểm Zalo cho bài thi Online (`POST /api/exams/{exam_id}/send-zalo-results`):**
     - Cho phép Giáo viên chủ động bấm nút phát thông báo điểm Zalo ZNS cho các học sinh đã hoàn thành bài thi (vẫn đi qua bộ lọc chống gửi trùng `NhatKyZalo` của Backend).

---

### 🔴 Yêu cầu 4: Tách biệt Chế độ Giáo Viên Xem Thử Đề (`is_preview`) với Học Sinh Thi Thật
* **Bối cảnh nghiệp vụ:** Khi giáo viên tạo đề xong và bấm **"👁️ Mở xem thử (Chế độ Giáo viên)"** (`/thi/:examId?preview=true`), giáo viên muốn làm thử và bấm nộp thử để kiểm tra tính năng chấm điểm. Trước đây nếu giáo viên chọn 1 học sinh trong lớp để test thì học sinh thật vào thi sẽ bị báo `EXAM_ALREADY_SUBMITTED` ("Bạn đã hoàn thành bài thi này rồi!").
* **Yêu cầu chỉnh sửa Backend (`app/schemas/exam.py`, `app/services/exam_service.py`):**
  - Trong `ExamSubmitIn`, bổ sung cờ tùy chọn `is_preview: bool = False` và cho phép `hoc_sinh_id: Optional[int] = None` khi `is_preview == True`.
  - Trong `ExamService.submit_exam`: Nếu `data.is_preview == True`, hệ thống vẫn chấm điểm tự động và trả về `{ diem_so, so_cau_dung, tong_cau, xep_loai }` như thật nhưng **KHÔNG lưu (`db.add(ket_qua)`) vào bảng `ket_qua`**, đảm bảo dữ liệu bài thi của lớp hoàn toàn sạch sẽ.

---

### 🔴 Yêu cầu 5: Bổ sung API Xóa Ca Học (`DELETE /api/sessions/{session_id}`) & Hỗ trợ trạng thái `NghiLe`
* **Bối cảnh nghiệp vụ:** Trên trang **Quản lý Lịch học (`SchedulePage.jsx`)**, Admin có:
  1. Nút **"+ Lên lịch ca học mới"** (`POST /api/sessions` — Backend đã có sẵn).
  2. Nút **"Xóa ca học"** (khi Admin tạo nhầm lịch học).
  3. Nút **"Hủy / Nghỉ"** cho phép chọn 1 trong 2 trạng thái: `DaHuy` (Hủy đột xuất) hoặc `NghiLe` (Báo nghỉ lễ).
* **Hiện trạng Backend (`app/api/v1/endpoints/sessions.py`, `app/services/session_service.py`):**
  - Chưa có endpoint `DELETE /api/sessions/{session_id}`.
  - `SessionService.cancel_session` hiện đang gán cứng `session.trang_thai_buoi_hoc = SessionState.CANCELLED.value` (`"DaHuy"`).
* **Yêu cầu chỉnh sửa Backend:**
  1. Thêm endpoint `DELETE /api/sessions/{session_id}` (Quyền `Admin`) trong `app/api/v1/endpoints/sessions.py` và `SessionService.delete_session(db, tenant_id, session_id)` để xóa buổi học bị tạo nhầm.
  2. Trong `SessionCancelIn` (`app/schemas/session.py`), bổ sung trường tùy chọn `trang_thai_buoi_hoc: Optional[str] = "DaHuy"` (chấp nhận `"DaHuy"` hoặc `"NghiLe"`) để lưu đúng trạng thái nghỉ lễ khi Admin chọn.

---

## 3. TÓM TẮT CHECKLIST NGHIỆM THU (ĐÃ HOÀN TẤT 100%)

- [x] **Migration / Model `BaiKiemTra`**: Thêm `gio_mo_de`, `gio_dong_de`, `ma_vao_thi`.
- [x] **Endpoint `POST /api/exams/{exam_id}/verify-pin`**: Xác thực mã PIN vào thi & cấp `exam_token` cho học sinh, rate-limit 5 lần sai.
- [x] **Endpoint `POST /api/exams/{exam_id}/submit`**: Hỗ trợ cờ `is_preview: bool = False` (chấm thử không lưu DB) và kiểm tra khung giờ đóng/mở đề.
- [x] **Endpoint `GET /api/exams/{exam_id}/detail`**: Trả đề thi kèm `dap_an_dung` cho Giáo viên/Admin.
- [x] **Schema `ResultOut` (`GET /api/exams/{exam_id}/results`)**: Trả kèm `chi_tiet_tra_loi` và `so_cau_dung`.
- [x] **Endpoint `POST /api/exams/{exam_id}/send-zalo-results`**: Kích hoạt gửi điểm Zalo ZNS từ trang Bảng điểm (chống gửi trùng).
- [x] **Endpoint `DELETE /api/sessions/{session_id}` & `PATCH /api/sessions/{session_id}/cancel`**: Hỗ trợ xóa ca học tạo nhầm và chọn trạng thái `DaHuy` / `NghiLe`.
- [x] Chạy lại `pytest tests/ -v` (48/48 test cases PASSED 100%) và cập nhật `scripts/seed_data.py` với các trường mới.


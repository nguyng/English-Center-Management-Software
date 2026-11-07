# 📑 BÁO CÁO TỔNG KẾT & TÀI LIỆU HƯỚNG DẪN FRONTEND (REACT)
## DỰ ÁN: TOOL QUẢN LÝ TRUNG TÂM TIẾNG ANH (B2B SaaS)

> **Dành cho:** Tất cả thành viên trong nhóm phát triển (Backend, Zalo Service), Quản trị viên và Người kế thừa dự án.  
> **Mục tiêu:** Giúp người đọc nắm bắt toàn bộ kiến trúc giao diện, luồng nghiệp vụ đã xử lý, cách chạy thử nghiệm và đặc tả API kết nối mà **không cần phải đọc từng dòng code**.

---

## 📌 1. TỔNG QUAN CÔNG NGHỆ (TECH STACK)

| Thành phần | Công nghệ lựa chọn | Lý do sử dụng |
| :--- | :--- | :--- |
| **Framework** | **React 18 + Vite** | Khởi động siêu nhanh, tối ưu hóa kích thước bundle khi build. |
| **UI Library** | **Ant Design (antd 5.x)** | Đầy đủ bộ UI chuẩn doanh nghiệp: Table, Form, Modal, DatePicker, Segmented, Switch... |
| **Icons** | **@ant-design/icons** | Bộ icon đồng bộ chuẩn UX. |
| **Routing** | **React Router DOM v6** | Định tuyến SPA, hỗ trợ `ProtectedRoute` phân quyền theo Role. |
| **State & Fetching**| **TanStack React Query & Context API** | Quản lý cache dữ liệu server và quản lý phiên người dùng (`AuthContext`). |
| **Biểu đồ** | **Recharts** | Trực quan hóa dữ liệu chi phí tin nhắn Zalo hàng tháng trên Dashboard. |
| **Xử lý Thời gian** | **Day.js** | Nhẹ hơn Moment.js, định dạng ngày tháng tiếng Việt chuẩn (`DD/MM/YYYY`). |
| **HTTP Client** | **Axios** | Cấu hình Base URL tập trung, tự động gắn JWT Bearer token và bắt lỗi 401. |

---

## 📂 2. CẤU TRÚC THƯ MỤC DỰ ÁN (`english-center-frontend/src/`)

```
src/
├── api/                      # 11 modules API Axios sẵn sàng cắm Backend thật
│   ├── axiosClient.js        # Gắn token Authorization Bearer, xử lý tự động đăng xuất nếu 401
│   ├── authApi.js            # Đăng nhập, đăng xuất, lấy user hiện tại
│   ├── classApi.js           # CRUD lớp học
│   ├── studentApi.js         # CRUD học sinh, chuyển trạng thái (Đang học / Bảo lưu / Đã nghỉ)
│   ├── teacherApi.js         # CRUD danh sách & tài khoản giáo viên
│   ├── sessionApi.js         # Buổi học, hủy ca / báo nghỉ lễ, xác nhận điểm danh
│   ├── attendanceApi.js      # Lưu điểm danh, kích hoạt gửi tin Zalo
│   ├── examApi.js            # Tạo đề trắc nghiệm, nộp bài online, nhập điểm thi giấy
│   ├── resultApi.js          # Kết quả thi theo bài thi / học sinh
│   ├── zaloLogApi.js         # Nhật ký gửi tin ZNS và thống kê cước phí
│   └── centerApi.js          # Quản lý trung tâm đối tác SaaS và cấu hình Token Zalo
│
├── components/               # Các component dùng chung và tái sử dụng
│   ├── Layout/               # Layout chuẩn: Sidebar động theo quyền, Header người dùng, MainContent
│   ├── ProtectedRoute.jsx    # "Cổng bảo vệ" chỉ cho phép truy cập theo đúng Role
│   ├── ScoreInput.jsx        # Ô nhập điểm: chặn 0.0 - 10.0, tự đổi dấu phẩy (,) thành (.)
│   ├── PhoneInput.jsx        # Validate số điện thoại di động Việt Nam (Regex 10 số đầu 03, 05, 07, 08, 09)
│   ├── StatusBadge.jsx       # Tag màu hiển thị trạng thái chuẩn UX
│   └── ConfirmModal.jsx      # Hộp thoại xác nhận trước các hành động quan trọng (gửi tin, xóa, hủy)
│
├── contexts/
│   └── AuthContext.jsx       # Quản lý trạng thái đăng nhập, giải mã JWT, lưu trữ phiên
│
├── pages/                    # Toàn bộ giao diện phân theo nhóm người dùng
│   ├── auth/                 # Trang Đăng nhập hệ thống (LoginPage)
│   ├── teacher/              # Dành cho Giáo viên (Điểm danh, xem lớp, nhập điểm, tạo đề)
│   ├── student/              # Dành cho Học sinh (Cổng làm bài thi online không cần login)
│   ├── admin/                # Dành cho Quản lý Trung tâm (Dashboard, Học sinh, Lớp, Lịch dạy, Nhật ký Zalo)
│   └── super-admin/          # Dành cho Chủ nền tảng SaaS (Bản quyền phần mềm, Token Zalo đối tác)
│
└── utils/                    # Hằng số, hàm định dạng hiển thị và kiểm tra ràng buộc dữ liệu
    ├── constants.js          # Enums vai trò, trạng thái điểm danh, trạng thái Zalo...
    ├── formatters.js         # Format ngày giờ, điểm số 1 chữ số thập phân, SĐT, xếp loại...
    └── validators.js         # Kiểm tra SĐT, kiểm tra khung giờ an toàn 07:00 - 21:30...
```

---

## 🌟 3. CÁC MÀN HÌNH CHÍNH & LOGIC NGHIỆP VỤ ĐÃ CODE HOÀN TẤT

### 👨‍🏫 A. Phân Hệ Giáo Viên (Teacher)

#### 1. Màn hình Điểm danh & Gửi Zalo (`AttendancePage.jsx` - ⭐ Core Feature)
- **Tối ưu thao tác điểm danh:** Mặc định toàn bộ học sinh được gán `Có mặt`. Giáo viên chỉ việc click những bạn `Vắng`.
- **Thanh lọc nhanh:** Nút Segmented `[Tất cả]` và `[Học sinh vắng (X bạn)]` giúp giáo viên rà soát danh sách vắng trong 1 giây trước khi gửi.
- **Công tắc kiểm tra:** Checkbox *"Buổi học này có bài kiểm tra"*:
  - **Tắt:** Buổi học bình thường. Hệ thống chỉ gửi thông báo cho học sinh Vắng, không gửi cho học sinh Có mặt.
  - **Bật:** Chọn 1 trong 2 hình thức:
    - `💻 Thi online`: Hệ thống hiển thị ghi chú học sinh sẽ làm trên web và tự chấm điểm.
    - `📝 Thi giấy`: Tự động mở thêm cột **Nhập điểm thi giấy** trực tiếp trên bảng.
- **Nhập điểm thi giấy an toàn:**
  - Học sinh vắng hiển thị nhãn: `Vắng — Không thi` (chặn không cho nhập điểm).
  - Học sinh có mặt: Nhập điểm `0.0 - 10.0`, tự động làm tròn 1 chữ số thập phân. Gõ phím `,` tự đổi thành phím `.`.
  - Tự động hiển thị xếp loại (`Xuất sắc`, `Giỏi`, `Khá`, `Trung bình`, `Yếu`).
- **Hộp thoại xác nhận gửi Zalo:** Trước khi phát lệnh gửi tin, hiển thị tóm tắt chi tiết:
  - Danh sách học sinh sẽ nhận tin **Báo Vắng**.
  - Danh sách học sinh sẽ nhận tin **Báo Điểm**.
  - Cảnh báo rõ ràng hành động không thể hoàn tác.

#### 2. Nhập điểm bổ sung cho thi giấy (`ExamScorePage.jsx`)
- Dành cho trường hợp sau giờ học giáo viên mới chấm xong bài thi giấy.
- **Bảo vệ giấc ngủ phụ huynh (Khung giờ an toàn 07:00 - 21:30):** Nếu giáo viên bấm lưu điểm sau 21:30 đêm hoặc trước 07:00 sáng, hệ thống tự động cảnh báo và đề xuất: *"Hẹn giờ tự động gửi vào 07:30 sáng mai"*.

#### 3. Tạo đề thi online trắc nghiệm & Cấu hình bảo mật (`ExamCreatePage.jsx`)
- Giáo viên chọn Lớp học áp dụng, đặt tên bài kiểm tra.
- **Khung giờ thi cố định:** Cài đặt **Giờ mở đề** (ví dụ `09:30`) và **Giờ đóng cổng** (ví dụ `10:00`).
- **Mã PIN vào thi (Chống thi hộ):** Giáo viên đặt mã bảo mật (ví dụ `1234`), chỉ cấp cho học sinh trong lớp.
- Thêm từng câu hỏi trắc nghiệm, các lựa chọn A, B, C, D và chọn đáp án đúng.
- Tạo xong tự động xuất đường link làm bài kèm nút sao chép link và nút mở xem thử (Preview Mode).

#### 4. Xem bảng điểm & Chi tiết bài làm học sinh (`ExamResultsPage.jsx` - Mới)
- Thống kê sĩ số lớp, số học sinh đã nộp bài, điểm trung bình, điểm cao nhất.
- Bảng danh sách học sinh kèm trạng thái, thời gian nộp, số câu đúng, điểm số và xếp loại.
- **Xem chi tiết bài làm:** Click xem từng câu học sinh chọn đáp án nào, đúng/sai thế nào so với đáp án chuẩn.
- Nút **[Gửi báo điểm Zalo]** để phát lệnh gửi tin nhắn kết quả đến phụ huynh.

#### 5. Xem lớp phụ trách & Lịch dạy (`MyClassesPage.jsx`, `MySchedulePage.jsx`)
- Giáo viên chỉ nhìn thấy các lớp mình được phân công (đảm bảo bảo mật không xem chéo lớp).
- Hiển thị trực quan buổi học hôm nay đã điểm danh hay chưa kèm nút tắt dẫn thẳng vào điểm danh và xem bảng điểm bài thi.

---

### 🎓 B. Phân Hệ Học Sinh (Student)

#### Cổng Thi Trắc Nghiệm Online (`ExamTakingPage.jsx` - Đường dẫn: `/thi/:examId`)
- **Không cần tài khoản:** Học sinh truy cập link bài thi, chọn đúng tên mình trong danh sách lớp.
- **Bảo mật mã PIN:** Bắt buộc nhập đúng mã bảo mật do giáo viên cung cấp tại lớp mới được mở đề (chống thi hộ).
- **Khung giờ thi cố định:**
  - Trước giờ mở đề: Cổng thi bị khóa, hiển thị đồng hồ đếm ngược chờ mở.
  - Trong giờ thi: Thời gian đếm ngược chính xác từ giờ hiện tại đến giờ đóng cổng (vào muộn sẽ bị trừ bớt thời gian).
  - Hết giờ đóng cổng: Tự động khóa và thu bài (Auto-Submit).
- **Tách biệt Chế độ Giáo viên Xem thử (`?preview=true`):** Giáo viên mở xem thử đề sẽ có banner cảnh báo riêng, bài làm thử không bị ghi đè hay làm mất dữ liệu của học sinh thật.
- **Cơ chế chống mất bài khi rớt mạng / sập nguồn:** Mọi đáp án học sinh tick chọn đều được tự động lưu ngay vào `localStorage`. F5 trình duyệt hoặc mở lại link vẫn tiếp tục bài thi bình thường.
- **Cơ chế chống gian lận chuyển tab (`visibilitychange`):**
  - Học sinh chuyển tab để tra từ điển / Google lần 1: Hệ thống phát cảnh báo vi phạm.
  - Học sinh chuyển tab lần 2: Tự động tịch thu bài thi và nộp ngay lập tức.
- **Tự động chấm điểm:** So khớp đáp án, tính điểm trên thang 10, làm tròn 1 chữ số thập phân và hiển thị kết quả ngay sau khi nộp.

---

### 🏢 C. Phân Hệ Admin Trung Tâm (Center Admin)

#### 1. Bảng điều khiển (`DashboardPage.jsx`)
- 4 thẻ thống kê: Tổng học sinh đang học, tổng lớp học, tổng giáo viên, tổng tin Zalo gửi trong tháng.
- **Biểu đồ chi phí Zalo:** Biểu đồ cột (Recharts) theo dõi số tin ZNS thành công, thất bại và hết tiền cước theo từng tháng.
- **Bảng cảnh báo ca học chưa điểm danh:** Liệt kê các ca học trong ngày mà giáo viên chưa thực hiện điểm danh.

#### 2. Quản lý Học sinh (`StudentListPage.jsx`)
- Danh sách học sinh kèm lớp và ngày nhập học.
- **Validate số điện thoại VN:** Form chỉ cho phép lưu SĐT đúng chuẩn (10 chữ số, đầu 03, 05, 07, 08, 09) để đảm bảo không bị lỗi khi gửi ZNS.
- Quản lý trạng thái: `Đang học`, `Bảo lưu`, `Đã nghỉ`. (Học sinh nghỉ/bảo lưu sẽ tự ẩn khỏi danh sách điểm danh hàng ngày).
- Bổ sung nút **Xóa học sinh** nếu tạo nhầm.

#### 3. Quản lý Lớp & Giáo viên (`ClassListPage.jsx`, `TeacherListPage.jsx`)
- Tạo mới và phân công giáo viên phụ trách từng lớp.
- Tạo tài khoản đăng nhập cho giáo viên, phân công nhiều lớp phụ trách, khóa/mở khóa tài khoản giáo viên trực tiếp.

#### 4. Quản lý Lịch Dạy & An Toàn Lưới (`SchedulePage.jsx`, `AttendanceAlertPage.jsx`)
- **Lên lịch ca học mới:** Admin bấm nút **`+ Lên lịch ca học mới`** để chọn lớp, ngày học, giờ bắt đầu/kết thúc và phân công giáo viên phụ trách.
- **Hủy buổi học / Báo nghỉ lễ:** Admin có thể đánh dấu buổi học thành `Nghỉ lễ` hoặc `Đã hủy`. Khi đó hệ thống sẽ **vô hiệu hóa Cron Job cuối ca**, tuyệt đối không bắn tin nhắn nhầm cho phụ huynh.
- **Chỉ định giáo viên dạy thay:** Phân công giáo viên khác dạy thay khi có người báo bận đột xuất.
- **Admin điểm danh hộ:** Nếu giáo viên quên điểm danh cả ca, Admin có quyền can thiệp điểm danh hộ trực tiếp.

#### 5. Nhật ký tin nhắn Zalo (`ZaloHistoryPage.jsx`)
- Bảng tra cứu toàn bộ tin nhắn đã gửi: thời gian, học sinh, lớp, loại tin (`Báo vắng` / `Báo điểm`), số điện thoại, nội dung chi tiết và trạng thái (`Thành công`, `Thất bại`, `Demo`).
- Bộ lọc đa năng theo ngày, loại tin, trạng thái và ô tìm kiếm từ khóa.

---

### 👑 D. Phân Hệ Super Admin (Chủ Phần Mềm SaaS)

#### Quản lý Khách hàng & Bản quyền SaaS (`CenterListPage.jsx`)
- Quản lý danh sách các Trung tâm Tiếng Anh sử dụng phần mềm.
- Tính năng **Gia hạn bản quyền phần mềm** theo từng năm (`+ 365 ngày`).
- Tính năng **Cấu hình Zalo ZNS Token**: Điền `OA ID`, `App ID`, `Secret Key`, `Access Token` của từng trung tâm để chuyển từ chế độ Demo Mock sang bắn tin thật 100%.

---

## 🔌 4. ĐẶC TẢ GIAO TIẾP VỚI BACKEND (API CONTRACTS)

Dành cho **Người 2 (Backend)** triển khai các API tương thích trực tiếp với giao diện:

### 1. Chuẩn Header & Format Dữ Liệu
- Mọi request gửi lên (trừ login/thi online) đều đính kèm:
  ```http
  Authorization: Bearer <JWT_TOKEN>
  Content-Type: application/json
  ```
- Chuẩn response Backend trả về:
  ```json
  {
    "success": true,
    "data": { ... },
    "message": "Thông báo nếu có"
  }
  ```

### 2. Danh sách Endpoints chính Backend cần cung cấp:

| Nhóm chức năng | Method | Endpoint | Payload gửi lên / Ghi chú |
| :--- | :---: | :--- | :--- |
| **Xác thực** | `POST` | `/api/auth/login` | `{ "email": "...", "password": "..." }` |
| | `GET` | `/api/auth/me` | Lấy thông tin user đăng nhập từ token |
| **Học sinh** | `GET` | `/api/students?classId=&status=` | Lấy DS học sinh theo bộ lọc |
| | `POST` | `/api/students` | `{ "ho_ten": "...", "sdt_phu_huynh": "...", "lop_id": 1 }` |
| | `PATCH` | `/api/students/:id/status` | `{ "trang_thai": "DangHoc" \| "BaoLuu" \| "DaNghi" }` |
| **Lớp học** | `GET` | `/api/classes` | Lấy DS lớp kèm sĩ số và GV phụ trách |
| | `POST` | `/api/classes` | `{ "ma_lop": "A1-2026", "ten_lop": "...", "giao_vien_id": 1 }` |
| **Buổi học** | `GET` | `/api/sessions?date=&classId=` | Danh sách ca học theo ngày/lớp |
| | `PATCH` | `/api/sessions/:id/cancel` | `{ "trang_thai": "DaHuy" \| "NghiLe" }` |
| | `PATCH` | `/api/sessions/:id/substitute` | `{ "giao_vien_id": 3 }` (Chỉ định dạy thay) |
| **Điểm danh** | `GET` | `/api/sessions/:id/attendance` | Lấy danh sách điểm danh buổi học |
| | `POST` | `/api/sessions/:id/attendance` | `{ "attendance": { "1": "CoMat", "2": "Vang" }, "sendZalo": true, "scores": {...} }` |
| **Bài kiểm tra** | `POST` | `/api/exams` | `{ "ten_bai_kiem_tra": "...", "hinh_thuc": "he_thong" \| "giay", "thoi_gian_phut": 15, "questions": [...] }` |
| | `POST` | `/api/exams/:id/submit` | `{ "hoc_sinh_id": 1, "answers": { "1": "A", "2": "B" } }` (HS nộp thi online) |
| | `POST` | `/api/exams/:id/manual-scores` | `{ "scores": { "1": 8.5, "2": 7.0 }, "scheduleForMorning": false }` |
| **Nhật ký Zalo** | `GET` | `/api/zalo-logs` | Bộ lọc theo ngày, lớp, loại tin, trạng thái |
| | `GET` | `/api/zalo-logs/stats` | Thống kê số tin thành công, thất bại theo tháng cho biểu đồ |
| **SaaS Admin** | `PATCH` | `/api/centers/:id/license` | `{ "ngay_het_han_saas": "2027-11-05" }` |
| | `PATCH` | `/api/centers/:id/zalo-config` | `{ "zalo_oa_id": "...", "zalo_access_token": "..." }` |

---

## 🚀 5. HƯỚNG DẪN KHỞI CHẠY & THỬ NGHIỆM

### Bước 1: Khởi động ứng dụng
Mở terminal và gõ các lệnh sau:
```powershell
cd d:\English-Center-Management-Software\english-center-frontend
npm run dev
```
Trình duyệt sẽ mở tại địa chỉ: `http://localhost:5173`

### Bước 2: Tài khoản thử nghiệm (Có sẵn chế độ Mock tự động)
Không cần chờ Backend, trang đăng nhập đã tích hợp sẵn cơ chế Mock Token thông minh:

1. **Thử vai trò Quản Trị Viên (Admin Trung Tâm):**
   - Email: `admin@center.edu.vn` (Mật khẩu tùy ý)
   - Truy cập: Toàn bộ Dashboard, Quản lý lớp, Quản lý học sinh, Lịch dạy, Cảnh báo chưa điểm danh, Nhật ký Zalo.
2. **Thử vai trò Giáo Viên:**
   - Email: `teacher@center.edu.vn` (Mật khẩu tùy ý)
   - Trực tiếp trải nghiệm tính năng: Điểm danh buổi học, lọc học sinh vắng, nhập điểm thi giấy, bấm gửi thông báo Zalo.
3. **Thử vai trò Chủ Nền Tảng (Super Admin):**
   - Email: `super@saas.com` (Mật khẩu tùy ý)
   - Trải nghiệm quản lý các trung tâm khách hàng, gia hạn thuê bao SaaS theo năm, cấu hình Zalo Token.
4. **Thử vai trò Học Sinh (Thi online):**
   - Mở trực tiếp link: `http://localhost:5173/thi/101`
   - Chọn tên học sinh, trải nghiệm đếm ngược làm bài trắc nghiệm, thử đổi sang tab khác để xem cảnh báo chống gian lận, và nộp bài để xem tự động chấm điểm.

---

## 🎯 6. DANH SÁCH CÁC MỤC CẦN XÁC NHẬN (ACTION CHECKLIST)

> 🔔 **Lưu ý cho các thành viên:** Dưới đây là những điểm Frontend đã thiết kế dựa trên tài liệu nghiệp vụ. Các bạn vui lòng kiểm tra và phản hồi (xem hướng dẫn ở **Mục 7**).

### 6.1. Cần Người 2 (Backend & Database) xác nhận:
- [ ] **1. API Endpoints & Base URL:** Base URL Backend dự kiến là `http://localhost:5000/api` hay cổng khác? Danh sách endpoints ở **Mục 4** có cần đổi tên path nào không?
- [ ] **2. Cấu trúc JWT Payload:** Token trả về khi Login có đúng các trường sau không:
  ```json
  { "id": 1, "ho_ten": "Nguyễn Văn A", "email": "a@...", "vai_tro": "GiaoVien", "trung_tam_id": 1 }
  ```
- [ ] **3. Logic lọc điểm danh:** Backend đã filter `WHERE trang_thai = 'DangHoc'` để loại bỏ học sinh `BaoLuu` và `DaNghi` khỏi bảng điểm danh chưa?
- [ ] **4. Điểm số thập phân:** Backend cam kết làm tròn 1 chữ số thập phân (`round(diem, 1)`) trước khi lưu DB và gửi Zalo chứ?
- [ ] **5. Khóa bài thi Online:** Ràng buộc `UNIQUE(hoc_sinh_id, bai_kiem_tra_id)` trong DB đã sẵn sàng để chặn học sinh làm bài lần 2 chưa?

### 6.2. Cần Người 3 (Zalo Service & Tự động hóa) xác nhận:
- [ ] **1. Trạng thái tin nhắn:** Bảng `NhatKyZalo` cột `trang_thai` có khớp với 4 giá trị: `'ThanhCong' | 'ThatBai' | 'HetTien' | 'Demo'` không?
- [ ] **2. Điều kiện kích hoạt Cron Job cuối ca:** Cron Job đã có 2 điều kiện tiên quyết: `trang_thai_diem_danh == 'da_diem_danh'` **VÀ** `trang_thai_buoi_hoc == 'BinhThuong'` (không phải `NghiLe`/`DaHuy`) chưa?
- [ ] **3. Hẹn giờ an toàn ban đêm:** Zalo Service đã hỗ trợ hàng đợi hẹn giờ gửi lúc `07:30 sáng` nếu GV nhập điểm giấy sau `21:30` chưa?

### 6.3. Cần Thầy / Cố vấn xác nhận:
- [ ] **1. Giao diện điểm danh:** Thao tác mặc định tất cả có mặt, chỉ tick vắng như hiện tại đã đúng thói quen giảng dạy của Thầy chưa?
- [ ] **2. Mẫu tin nhắn:** Hai mẫu tin Báo vắng và Báo điểm ở giao diện xem trước đã đúng văn phong mong muốn chưa?

---

## 💬 7. QUY TRÌNH GIAO TIẾP & PHẢN HỒI QUA GIT (GIT-ONLY WORKFLOW)

Vì nhóm chúng ta **chỉ giao tiếp qua Git** (không dùng chat ngoài), vui lòng chọn một trong hai cách dưới đây để phản hồi:

### 📌 CÁCH 1: Phản hồi trực tiếp vào file này và Push lên Git (Khuyên dùng)
1. Kéo code mới nhất về:
   ```bash
   git pull origin main
   ```
2. Mở file `TONG_KET_FRONTEND.md`, chuyển `[ ]` thành `[x]` tại các mục bạn đồng ý ở **Mục 6**.
3. Nếu có góp ý hoặc muốn sửa endpoint, hãy ghi chú ngay dưới mục đó dạng:
   > **[Backend phản hồi]:** *Endpoint /api/sessions/:id/attendance đổi thành /api/attendance/session/:id nhé.*
4. Commit và Push lên Git:
   ```bash
   git add TONG_KET_FRONTEND.md
   git commit -m "docs(fe-confirm): backend xác nhận api và cập nhật endpoint"
   git push origin <branch-cua-ban>
   ```

### 📌 CÁCH 2: Phản hồi thông qua Git Pull Request (PR Review / Issue)
1. Khi tạo Pull Request để merge code Backend hoặc Zalo Service, gắn thẻ (tag) commit hoặc trích dẫn các mục ở **Mục 6**.
2. Sử dụng định dạng comment chuẩn trong PR:
   ```markdown
   ### 📝 Phản hồi Frontend từ Backend:
   - [x] Mục 6.1.1: Đồng ý danh sách API, Base URL là `http://localhost:8000/api`.
   - [x] Mục 6.1.2: Payload JWT đã khớp 100%.
   - [!] Mục 6.1.4: Lưu ý điểm thi online hệ thống tự chấm theo thang 10.
   ```

### 🏷️ Quy ước Commit Message của nhóm:
Để dễ dàng theo dõi tiến độ qua `git log`, nhóm quy ước prefix commit như sau:
- `fe(feature):` Các thay đổi giao diện Frontend
- `be(feature):` Các thay đổi API / Database Backend
- `zalo(service):` Các cập nhật module Zalo / Cron Job
- `docs(confirm):` Phản hồi xác nhận hoặc thảo luận tài liệu
- `fix(scope):` Sửa lỗi kết nối giữa các bên

---

## 🏁 8. KẾT LUẬN & TRẠNG THÁI TIẾP THEO

- **Frontend:** Đã hoàn thành 100% Sprint 1 & Sprint 2, sẵn sàng Mock Data và giao diện.
- **Bước tiếp theo:** Chờ phản hồi commit từ **Người 2 (Backend)** để tiến hành nối API thật, bỏ lớp Mock Token.



# 📊 SƠ ĐỒ HỆ THỐNG: TOOL QUẢN LÝ TRUNG TÂM TIẾNG ANH

> **Tài liệu trực quan hóa kiến trúc & quy trình nghiệp vụ**  
> Dự án: Phần mềm Quản lý Trung tâm Tiếng Anh (Mô hình B2B SaaS)  
> Nhóm phát triển: 3 thành viên

---

## 🏛️ 1. SƠ ĐỒ KIẾN TRÚC TỔNG THỂ (SYSTEM ARCHITECTURE)

Sơ đồ mô tả cách các thành phần trong hệ thống kết nối với nhau từ giao diện người dùng đến server và các dịch vụ bên ngoài:

```mermaid
flowchart TD
    subgraph CLIENT["NGƯỜI DÙNG (TRÌNH DUYỆT WEB / MOBILE)"]
        U1["👑 Super Admin (Trang quản trị SaaS)"]
        U2["🏢 Admin Trung tâm (Quản lý vận hành)"]
        U3["👨‍🏫 Giáo viên (Điểm danh & Chấm điểm)"]
        U4["🎓 Học sinh (Làm bài thi online)"]
    end

    subgraph FRONTEND["FRONTEND WEB APP"]
        FE["Giao diện Web (React / Vue / HTML5)"]
    end

    subgraph BACKEND["BACKEND SERVER (Node.js / Python)"]
        API["API Gateway & Bộ xử lý nghiệp vụ"]
        CRON["Bộ lập lịch ngầm (Cron Job / Scheduler)"]
        Z_SVC["Zalo Service (Chế độ Demo / Thật)"]
    end

    subgraph DATABASE["HỆ QUẢN TRỊ CƠ SỞ DỮ LIỆU"]
        DB[("Database (PostgreSQL / MySQL)")]
    end

    subgraph EXTERNAL["DỊCH VỤ BÊN NGOÀI"]
        ZALO["Cổng Zalo Cloud API / ZNS"]
        PARENTS["📲 Điện thoại Phụ huynh (Nhận Zalo)"]
    end

    U1 --> FE
    U2 --> FE
    U3 --> FE
    U4 --> FE

    FE <-->|REST API / JSON| API

    API <--> DB
    CRON <--> DB

    API --> Z_SVC
    CRON --> Z_SVC

    Z_SVC -->|Gửi tin tự động| ZALO
    ZALO -->|Tin nhắn Zalo| PARENTS
```

---

## 🗄️ 2. SƠ ĐỒ THỰC THỂ CƠ SỞ DỮ LIỆU (DATABASE ERD)

Sơ đồ thể hiện mối quan hệ giữa các bảng trong hệ thống, bao gồm bảng trung tâm, người dùng, lớp học, buổi học, điểm danh, bài kiểm tra và nhật ký tin nhắn:

```mermaid
erDiagram
    TRUNG_TAM ||--o{ NGUOI_DUNG : "co"
    TRUNG_TAM ||--o{ LOP_HOC : "quan_ly"
    TRUNG_TAM ||--o{ NHAT_KY_ZALO : "chi_tra"
    
    LOP_HOC ||--o{ HOC_SINH : "chua"
    LOP_HOC ||--o{ BUOI_HOC : "to_chuc"
    
    BUOI_HOC ||--o{ DIEM_DANH : "co"
    HOC_SINH ||--o{ DIEM_DANH : "duoc_diem_danh"
    
    BUOI_HOC ||--o{ BAI_KIEM_TRA : "to_chuc_thi"
    BAI_KIEM_TRA ||--o{ CAU_HOI : "chua"
    BAI_KIEM_TRA ||--o{ KET_QUA : "co"
    HOC_SINH ||--o{ KET_QUA : "nhan"
    
    HOC_SINH ||--o{ NHAT_KY_ZALO : "nhan_tin"
    BUOI_HOC ||--o{ NHAT_KY_ZALO : "tao_ra"

    TRUNG_TAM {
        int id PK
        string ten_trung_tam
        string sdt_admin
        date ngay_het_han_saas
        string trang_thai_ban_quyen
        string zalo_oa_id
        string zalo_access_token
    }

    NGUOI_DUNG {
        int id PK
        int trung_tam_id FK
        string ho_ten
        string email
        string mat_khau_hash
        string vai_tro
        string trang_thai
    }

    LOP_HOC {
        int id PK
        int trung_tam_id FK
        string ma_lop
        string ten_lop
        int giao_vien_id FK
    }

    HOC_SINH {
        int id PK
        int trung_tam_id FK
        int lop_id FK
        string ho_ten
        string sdt_phu_huynh
        date ngay_nhap_hoc
        string trang_thai
    }

    BUOI_HOC {
        int id PK
        int trung_tam_id FK
        int lop_id FK
        date ngay_hoc
        string ca_hoc
        time gio_bat_dau
        time gio_ket_thuc
        boolean co_kiem_tra
        boolean da_gui
        string trang_thai_diem_danh
        string trang_thai_buoi_hoc
    }

    DIEM_DANH {
        int id PK
        int buoi_hoc_id FK
        int hoc_sinh_id FK
        string trang_thai
    }

    BAI_KIEM_TRA {
        int id PK
        int trung_tam_id FK
        int buoi_hoc_id FK
        string ten_bai_kiem_tra
        string hinh_thuc
        date ngay_kiem_tra
        int thoi_gian_phut
    }

    CAU_HOI {
        int id PK
        int bai_kiem_tra_id FK
        string noi_dung
        string dap_an_a
        string dap_an_b
        string dap_an_c
        string dap_an_d
        string dap_an_dung
    }

    KET_QUA {
        int id PK
        int bai_kiem_tra_id FK
        int hoc_sinh_id FK
        float diem_so
        float diem_thu_cong
        datetime thoi_gian_nop
    }

    NHAT_KY_ZALO {
        int id PK
        int trung_tam_id FK
        int buoi_hoc_id FK
        int hoc_sinh_id FK
        string loai_tin
        string sdt_nhan
        string noi_dung
        string trang_thai
        datetime thoi_gian_gui
    }
```

---

## 🔄 3. QUY TRÌNH ĐIỂM DANH & KÍCH HOẠT TỰ ĐỘNG CUỐI CA

Sơ đồ thể hiện toàn bộ vòng đời của một buổi học từ lúc vào lớp cho đến khi kết thúc ca học:

```mermaid
flowchart TD
    START(["Bắt đầu ca học"]) --> GV_VAO["Giáo viên đăng nhập vào lớp"]
    
    GV_VAO --> CHECK_LE{"Buổi học có bị HỦY / NGHỈ LỄ không?"}
    CHECK_LE -- "Có (Admin đã hủy)" --> STOP_LE["Dừng ca học - Không gửi bất kỳ tin nào"]
    
    CHECK_LE -- "Không (Học bình thường)" --> DD["Giáo viên mở màn hình Điểm danh"]
    DD --> DEFAULT["Hệ thống mặc định tick: Có mặt tất cả"]
    DEFAULT --> TICK_VANG["Giáo viên click chọn các bạn: Vắng"]
    
    TICK_VANG --> FILTER["Bấm nút: 'Lọc học sinh vắng' để kiểm tra lại"]
    FILTER --> CONFIRM["Giáo viên bấm: 'Xác nhận điểm danh'"]
    CONFIRM --> SET_FLAG["Set: trang_thai_diem_danh = 'da_diem_danh'"]
    
    SET_FLAG --> OPTION_SEND{"Giáo viên có bấm 'Gửi Zalo ngay' không?"}
    OPTION_SEND -- "Có (Gửi thủ công)" --> SEND_MANUAL["Kích hoạt gửi tin ngay lập tức"]
    SEND_MANUAL --> SET_SENT["Cập nhật: da_gui = true"]
    
    OPTION_SEND -- "Không (Để cuối ca tự gửi)" --> WAIT_CRON["Chờ đến giờ kết thúc ca học"]
    
    WAIT_CRON --> CRON_RUN["Cron Job cuối ca kích hoạt quét"]
    CRON_RUN --> CHECK_SENT{"Đã gửi tin chưa (da_gui == true)?"}
    
    CHECK_SENT -- "Đã gửi rồi" --> END_SHIFT(["Kết thúc ca - Không gửi lại"])
    CHECK_SENT -- "Chưa gửi" --> CHECK_ATT{"Đã điểm danh chưa (da_diem_danh)?"}
    
    CHECK_ATT -- "Chưa điểm danh (GV quên)" --> ALERT_ADMIN["Báo động đỏ: 'Lớp chưa điểm danh' - KHÔNG gửi tin vắng ảo"]
    CHECK_ATT -- "Đã điểm danh rồi" --> AUTO_SEND["Tự động gửi tin Zalo theo đúng logic"]
    AUTO_SEND --> SET_SENT
    SET_SENT --> END_SHIFT
```

---

## 📝 4. QUY TRÌNH KIỂM TRA: THI ONLINE VS THI GIẤY

Sơ đồ so sánh hai luồng làm bài thi và cách xử lý điểm số:

```mermaid
flowchart TD
    CREATE_TEST["Giáo viên tạo Bài kiểm tra: Nhập Tên bài + Chọn Ngày thi"] --> CHOOSE_TYPE{"Chọn hình thức thi"}

    %% NHÁNH THI ONLINE
    CHOOSE_TYPE -- "Thi trên hệ thống (Online)" --> INPUT_QS["Giáo viên tạo câu hỏi trắc nghiệm A, B, C, D"]
    INPUT_QS --> HS_LOGIN["Học sinh click link bài thi - Chọn tên mình"]
    HS_LOGIN --> DO_TEST["Học sinh làm bài + Đồng hồ đếm ngược"]
    DO_TEST --> CHECK_TAB{"Học sinh có rời tab tra Google?"}
    CHECK_TAB -- "Lần 1" --> WARN["Cảnh báo pop-up"]
    CHECK_TAB -- "Lần 2" --> AUTO_SUBMIT["Tự động nộp bài ngay lập tức"]
    
    DO_TEST --> SUBMIT["Học sinh bấm Nộp bài hoặc Hết giờ"]
    SUBMIT --> AUTO_GRADE["Backend tự chấm điểm: So sánh đáp án"]
    AUTO_GRADE --> ROUND_SCORE["Làm tròn điểm 1 chữ số thập phân"]
    ROUND_SCORE --> SAVE_ONLINE["Lưu vào bảng KetQua"]
    SAVE_ONLINE --> READY_ONLINE["Điểm sẵn sàng: Báo Zalo ngay cuối ca (Trigger 1)"]

    %% NHÁNH THI GIẤY
    CHOOSE_TYPE -- "Thi giấy (Offline)" --> PAPER_EXAM["Học sinh làm bài ra giấy tại lớp"]
    PAPER_EXAM --> TEACHER_GRADE["Giáo viên chấm bài giấy thủ công"]
    TEACHER_GRADE --> ENTER_SCORE["Giáo viên mở web nhập điểm (Validate 0 - 10)"]
    ENTER_SCORE --> SAVE_PAPER["Giáo viên bấm: 'Lưu điểm'"]
    SAVE_PAPER --> CHECK_TIME{"Thời gian lưu điểm hiện tại?"}
    
    CHECK_TIME -- "07:00 - 21:30 (Ban ngày)" --> SEND_PAPER_NOW["Gửi tin báo điểm ngay (Trigger 2)"]
    CHECK_TIME -- "Sau 21:30 (Đêm khuya)" --> SCHEDULE_MORNING["Hẹn giờ tự động gửi vào 07:30 sáng mai"]
```

---

## 📲 5. CÂY QUYẾT ĐỊNH BẮN TIN NHẮN ZALO (DECISION TREE)

Sơ đồ thuật toán mà Server sử dụng trước khi quyết định gửi tin cho một học sinh:

```mermaid
flowchart TD
    CHECK_STUDENT["Xét 1 Học sinh trong danh sách"] --> IS_ABSENT{"Trạng thái điểm danh?"}

    %% HỌC SINH VẮNG
    IS_ABSENT -- "VẮNG" --> CHECK_LOG_VANG{"Đã gửi tin báo vắng chưa?"}
    CHECK_LOG_VANG -- "Đã gửi rồi" --> SKIP_VANG["Bỏ qua - Không gửi trùng"]
    CHECK_LOG_VANG -- "Chưa gửi" --> SEND_VANG["GỬI TIN BÁO VẮNG HỌC"]
    SEND_VANG --> LOG_VANG["Ghi nhật ký: loai_tin = 'bao_vang'"]

    %% HỌC SINH CÓ MẶT
    IS_ABSENT -- "CÓ MẶT" --> HAS_TEST{"Buổi học có bài kiểm tra không?"}
    
    HAS_TEST -- "Không có kiểm tra" --> SILENT_NO_TEST["IM LẶNG - Không gửi tin nào"]
    
    HAS_TEST -- "Có bài kiểm tra" --> HAS_SCORE{"Đã có điểm số hợp lệ chưa?"}
    HAS_SCORE -- "Chưa có điểm (Đang chờ GV chấm giấy)" --> WAIT_SCORE["IM LẶNG - Chờ khi nào có điểm mới gửi"]
    
    HAS_SCORE -- "Đã có điểm số" --> CHECK_LOG_SCORE{"Đã gửi tin báo điểm chưa?"}
    CHECK_LOG_SCORE -- "Đã gửi rồi" --> SKIP_SCORE["Bỏ qua - Không gửi trùng"]
    CHECK_LOG_SCORE -- "Chưa gửi" --> SEND_SCORE["GỬI TIN BÁO ĐIỂM SỐ"]
    SEND_SCORE --> LOG_SCORE["Ghi nhật ký: loai_tin = 'bao_diem'"]
```

---

## 👥 6. MÔ HÌNH PHÂN QUYỀN 3 CẤP (RBAC HIERARCHY)

Sơ đồ thể hiện ranh giới quản lý và phân quyền giữa 3 vai trò trong hệ thống:

```mermaid
flowchart TD
    subgraph LEVEL_1["CẤP 1: NỀN TẢNG SAAS"]
        SUPER["👑 SUPER ADMIN (Nhóm phát triển)<br>• Quản lý danh sách các Trung tâm<br>• Cấp / Khóa bản quyền SaaS theo năm<br>• Cấu hình mã bí mật Zalo API<br>• Giám sát hệ thống & Server Logs"]
    end

    subgraph LEVEL_2["CẤP 2: VẬN HÀNH TRUNG TÂM"]
        ADMIN["🏢 ADMIN TRUNG TÂM (Thầy / Quản lý)<br>• Quản lý tài khoản Giáo viên & Học sinh<br>• Xếp lớp & Điều phối phòng/ca học<br>• Hủy buổi học / Báo nghỉ lễ<br>• Chỉ định Giáo viên dạy thay<br>• Màn hình cảnh báo GV quên điểm danh<br>• Giám sát cước phí Zalo tháng"]
    end

    subgraph LEVEL_3["CẤP 3: GIẢNG DẠY THỰC TẾ"]
        TEACHER["👨‍🏫 GIÁO VIÊN<br>• Điểm danh & Lọc học sinh vắng lớp mình<br>• Tạo bài thi & Nhập điểm (Online/Giấy)<br>• Ghi chú nhận xét từng học sinh<br>• Đăng ký lịch dạy / Xin nghỉ / Báo bận<br>• BẢO MẬT: Không xem chéo lớp người khác"]
    end

    SUPER -->|Khởi tạo & Thu phí SaaS| ADMIN
    ADMIN -->|Phân công & Giám sát| TEACHER
```

---

> 💡 **Hướng dẫn xem sơ đồ:** Tài liệu này dùng cú pháp chuẩn **Mermaid**. Khi mở trên GitHub hoặc VS Code / Markdown Preview, các khối mã trên sẽ tự động vẽ thành các sơ đồ đồ họa trực quan và tương tác được.


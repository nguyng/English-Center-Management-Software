# 🚀 LỘ TRÌNH TRIỂN KHAI DỰ ÁN: TOOL QUẢN LÝ TRUNG TÂM TIẾNG ANH

> **Tài liệu hướng dẫn dành cho:** Nhóm phát triển (3 thành viên: Bạn, Bạn "t", Bạn Hưng)
> **Khách hàng / Cố vấn:** Thầy giáo trung tâm tiếng Anh
> **Mô hình mục tiêu:** Phần mềm dạng dịch vụ (SaaS) - Thu phí bản quyền theo năm.
> **Cập nhật mới nhất:** Nghiệp vụ điểm danh (chỉ báo vắng) & Báo điểm linh hoạt theo buổi & Hỗ trợ 2 hình thức thi: Trên hệ thống và thi giấy & Tự động thông báo cuối ca nếu giáo viên chưa gửi thủ công.

---

## 📌 PHẦN 1: TỔNG QUAN & QUY TẮC NGHIỆP VỤ MỚI NHẤT

Dự án nhằm xây dựng một **Web App (Tool)** quản lý tinh gọn, tập trung giải quyết đúng các bài toán nhức nhối nhất của trung tâm tiếng Anh:

### 1. Điểm danh học sinh (Tối ưu hóa)

- Mặc định khi vào lớp: Toàn bộ học sinh được tick **"Có mặt"**. Giáo viên chỉ cần click chọn những bạn **"Vắng"**.
- Có thanh công cụ / nút **"Lọc học sinh vắng"** để giáo viên kiểm tra nhanh danh sách trước khi gửi báo cáo.
- **Quy tắc gửi thông báo Zalo:**
  - Học sinh **vắng** → Luôn luôn thông báo cho phụ huynh.
  - Học sinh **có mặt + có điểm** → Thông báo điểm cho phụ huynh.
  - Học sinh **có mặt + không có điểm** → Không gửi gì (không làm phiền phụ huynh).

### 2. Tự động chấm điểm & Báo điểm linh hoạt

- **Buổi học thường (Không có kiểm tra):** Hệ thống chỉ gửi thông báo điểm danh cho học sinh vắng.
- **Buổi học có kiểm tra:** Hệ thống hỗ trợ **2 hình thức thi song song**:
  | Hình thức                    | Mô tả                                                 | Cách nhập điểm                                                          |
  | :----------------------------- | :------------------------------------------------------ | :-------------------------------------------------------------------------- |
  | **Thi trên hệ thống** | Học sinh làm bài trắc nghiệm trực tiếp trên Web | Hệ thống **tự động chấm điểm** ngay sau khi nộp bài         |
  | **Thi giấy**            | Học sinh làm bài ra giấy tại lớp                  | Giáo viên **nhập điểm thủ công** vào hệ thống sau buổi thi |
- **Quy tắc gửi điểm:** Dù thi theo hình thức nào, sau khi có điểm (tự động hoặc được nhập tay), hệ thống đều gửi kết quả về cho phụ huynh theo cùng một cách.

### 3. Tích hợp Zalo Doanh nghiệp & Cơ chế Demo (Plug & Play)

- Thầy có kế hoạch đăng ký tài khoản Zalo Doanh nghiệp (ZNS).
- **Giai đoạn hiện tại (Demo):** Hệ thống chạy chế độ mô phỏng (Mock), hiển thị lịch sử gửi tin giả lập trên Web hoặc bắn thông báo qua bot thử nghiệm.
- **Giai đoạn có tài khoản thật:** Chỉ cần cắm Access Token của Thầy vào là hệ thống tự động bắn tin thật 100%, không cần viết lại giao diện hay database.

### 4. Tự động thông báo cuối ca (Tính năng an toàn lưới)
> *Mục đích: Đảm bảo phụ huynh luôn nhận được thông tin dù giáo viên có quên bấm nút gửi thủ công.*

> *Lưu ý nghiệp vụ: Trung tâm **không có thi bù** → Học sinh vắng = không thi = không có điểm trong buổi đó.*

#### ⚠️ Quy tắc bất biến số 1:
> **Học sinh vắng → HỆ THỐNG LUÔN LUÔN THÔNG BÁO CHO PHỤ HUYNH, không có ngoại lệ.**

---

#### 🔔 Trigger 1 — Cuối ca (Cron Job tự động):
> **Điều kiện tiên quyết để kích hoạt:** Buổi học phải ở trạng thái bình thường (không bị Hủy / Nghỉ lễ) **VÀ** Giáo viên đã bấm nút **"Xác nhận điểm danh"** (`trang_thai_diem_danh == 'da_diem_danh'`). Nếu giáo viên chưa điểm danh, hệ thống sẽ KHÔNG tự ý gửi tin (xem chi tiết mục 1.1 Phần 3).

| Trạng thái học sinh | Hệ thống gửi gì? |
|:---|:---|
| ❌ Vắng + Buổi không có kiểm tra | ✅ **LUÔN** thông báo **vắng học** |
| ❌ Vắng + Buổi có thi giấy | ✅ **LUÔN** thông báo **vắng học** (không có điểm vì không thi) |
| ❌ Vắng + Buổi có thi online | ✅ **LUÔN** thông báo **vắng học** (không có điểm vì không thi) |
| ✅ Có mặt + Thi online | Thông báo **điểm số** (hệ thống tự chấm ngay) |
| ✅ Có mặt + Thi giấy (chưa có điểm) | ⛔ Im lặng, chờ GV nhập điểm (Trigger 2) |
| ✅ Có mặt + Không có kiểm tra | ⛔ Không gửi gì |

#### 🔔 Trigger 2 — Khi giáo viên nhập điểm & bấm [Lưu điểm]:
> *Chỉ áp dụng cho thi giấy. Thi online đã có điểm ngay từ Trigger 1.*

| Học sinh | Hệ thống gửi gì? |
|:---|:---|
| ✅ Có mặt → Vừa được nhập điểm | Thông báo **điểm số** |
| ❌ Vắng | ⛔ Không có trong danh sách nhập điểm (đã báo vắng ở Trigger 1) |

**Quy tắc chung để không gửi trùng:**
- Bảng `NhatKyZalo` ghi lại mỗi loại tin đã gửi cho từng học sinh trong từng buổi.
- Trước khi gửi bất kỳ tin nào, hệ thống kiểm tra: *"Loại tin này đã gửi chưa?"* → Nếu rồi thì bỏ qua.
- Cột `da_gui: boolean` trong bảng `BuoiHoc` theo dõi giáo viên đã gửi thủ công chưa.

---

## 🗺️ PHẦN 2: LỘ TRÌNH 5 GIAI ĐOẠN CHI TIẾT

```
[GĐ 1: Chốt yêu cầu & Quy tắc nghiệp vụ] 
        ↓
[GĐ 2: Thiết kế Database & Giao diện (Thêm bộ lọc vắng)]
        ↓
[GĐ 3: Phân chia vai trò 3 người]
        ↓
[GĐ 4: Lập trình tính năng (Có chế độ Zalo Demo)]
        ↓
[GĐ 5: Kiểm thử Hộp đen cùng Thầy & Bàn giao]
```

---

### 🟢 GIAI ĐOẠN 1: KHẢO SÁT & CHỐT YÊU CẦU

> *Mục tiêu: Thống nhất logic nghiệp vụ chính xác với Thầy.*

- [X] Đã thống nhất: Điểm danh chỉ gửi tin cho học sinh vắng.
- [X] Đã thống nhất: Phân loại buổi học có bài kiểm tra vs buổi học thường.
- [X] Đã thống nhất: Hỗ trợ 2 hình thức thi — **Thi trên hệ thống** (tự chấm) và **Thi giấy** (giáo viên nhập điểm thủ công).
- [ ] Xác nhận với Thầy: Tiến độ chuẩn bị giấy tờ đăng ký Zalo Doanh nghiệp của trung tâm.
- [ ] Chốt mẫu tin nhắn thông báo vắng học và mẫu thông báo điểm thi.

---

### 🟡 GIAI ĐOẠN 2: THIẾT KẾ HỆ THỐNG & DỮ LIỆU

> *Mục tiêu: Đưa các nghiệp vụ mới vào thiết kế Database và UI.*

1. **Thiết kế Cơ sở Dữ liệu (Database Design):**
   *(Lưu ý kiến trúc SaaS: Tất cả các bảng đều có `trung_tam_id` để sau này sẵn sàng bán bản quyền cho nhiều trung tâm mà không bị lẫn dữ liệu).*

   - Bảng `TrungTam` (`id`, `ten_trung_tam`, `sdt_admin`, `ngay_het_han_saas: date`, `trang_thai_ban_quyen: 'HoatDong' | 'HetHan'`, `zalo_oa_id`, `zalo_secret_key`, `zalo_access_token`).
   - Bảng `NguoiDung` (`id`, `trung_tam_id`, `ho_ten`, `email`, `mat_khau_hash`, `vai_tro: 'SuperAdmin' | 'Admin' | 'GiaoVien'`, `trang_thai: 'HoatDong' | 'Khoa'`).
   - Bảng `LopHoc` (`id`, `trung_tam_id`, Mã lớp, tên lớp, giáo viên phụ trách).
   - Bảng `HocSinh` (`id`, `trung_tam_id`, Họ tên, SĐT phụ huynh, lớp, `ngay_nhap_hoc: date`, `trang_thai: 'DangHoc' | 'BaoLuu' | 'DaNghi'`).  
     *(Chỉ những học sinh `DangHoc` mới hiển thị trên bảng điểm danh hàng ngày).*
   - Bảng `BuoiHoc` (`id`, `trung_tam_id`, Mã buổi, ngày học, ca học, `co_kiem_tra: boolean`, `gio_ket_thuc`, `da_gui: boolean`, `trang_thai_diem_danh: 'chua_diem_danh' | 'da_diem_danh'`, `trang_thai_buoi_hoc: 'BinhThuong' | 'NghiLe' | 'DaHuy'`).
   - Bảng `DiemDanh` (`id`, Học sinh, Buổi học, `trang_thai: CoMat | Vang`).
   - Bảng `BaiKiemTra` (`id`, `trung_tam_id`, `buoi_hoc_id`, `ten_bai_kiem_tra`, `hinh_thuc: 'he_thong' | 'giay'`, `ngay_kiem_tra: date`, `thoi_gian_phut`).
   - Bảng `CauHoi` (Dành cho thi online: `id`, `bai_kiem_tra_id`, `noi_dung`, `dap_an_a`, `dap_an_b`, `dap_an_c`, `dap_an_d`, `dap_an_dung`).
   - Bảng `KetQua` (`id`, `bai_kiem_tra_id`, `hoc_sinh_id`, `diem_so: float`, `diem_thu_cong: float`, `thoi_gian_nop: datetime`).  
     *(Điểm số bắt buộc luôn làm tròn 1 chữ số thập phân, ví dụ: `8.5`, không để `8.3333333`).*
   - Bảng `NhatKyZalo` (`id`, `trung_tam_id`, `hoc_sinh_id`, `buoi_hoc_id`, `loai_tin: 'bao_vang' | 'bao_diem'`, Ngày giờ, SĐT nhận, Nội dung, Trạng thái: Thành công / Thất bại / Hết tiền, Trạng thái Demo/Thật).
2. **Thiết kế Giao diện (UI Mockup):**

   - Màn hình Quản lý Lớp & Lịch dạy (Dành cho Admin/Giáo viên):
     - Widget Dashboard: **Báo cáo chi phí Zalo tháng** (Tổng số tin đã gửi, số tin thất bại, ước tính tiền cước).
     - Lịch các ca học trong tuần.
     - Nút hành động của Admin: **[ 🚫 Hủy buổi học / Báo nghỉ lễ ]** (để tắt lịch và vô hiệu hóa Cron Job gửi tin của buổi đó).
   - Màn hình Điểm danh:
     - Nút chuyển chế độ lọc: **[Tất cả]** | **[Học sinh vắng (X bạn)]**.
     - Nút bật/tắt: **"Buổi học này có bài kiểm tra"** (Checkmark).
     - Nếu bật kiểm tra: Chọn hình thức thi: **( ) Thi trên hệ thống** | **( ) Thi giấy**.
     - Hiện ô nhập **Ngày kiểm tra** 📅 (mặc định = ngày hôm nay, giáo viên có thể sửa lại trước khi xác nhận).
     - Nếu chọn **Thi giấy**: Hiện thêm cột nhập điểm thủ công cạnh tên từng học sinh (chặn chỉ cho nhập `0.0 - 10.0`, tự đổi `,` thành `.`).
     - Nút hành động: **[Xác nhận & Gửi thông báo Zalo]**.
   - Màn hình Lịch sử tin nhắn: Xem lại danh sách các tin đã gửi cho phụ huynh.

---

### 🔵 GIAI ĐOẠN 3: PHÂN CHIA CÔNG VIỆC CHO 3 THÀNH VIÊN

| Thành viên        | Phụ trách                              | Nhiệm vụ cụ thể                                                                                                                                                                                                                   |
| :------------------ | :--------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Người 1** | **Frontend (Giao diện)**          | • Làm giao diện Điểm danh (Có nút lọc học sinh vắng)• Làm công tắc bật/tắt "Buổi học có kiểm tra"• Làm màn hình xem lịch sử tin nhắn gửi đi                                                              |
| **Người 2** | **Backend & Database**             | • Viết API lưu điểm danh & lấy danh sách học sinh theo lớp<br>• Viết logic lọc: `WHERE class = ... AND trang_thai = 'Vang'`<br>• Xử lý logic 2 trigger gửi thông báo (cuối ca tự động & khi GV lưu điểm thi giấy) |
| **Người 3** | **Zalo Service & Tự động hóa** | • Viết module `zaloService` với chế độ Demo (`CHE_DO_DEMO = true`)• Thiết lập Webhook/Bot thử nghiệm nhảy tin nhắn về điện thoại Thầy• Nghiên cứu tài liệu Zalo ZNS để sẵn sàng cắm tài khoản thật |

---

### 🟠 GIAI ĐOẠN 4: LẬP TRÌNH BẢN CHẠY THỬ (MVP 1.0)

- [ ] **Tuần 1-2:** Dựng khung web, quản lý danh sách học sinh, lớp học.
- [ ] **Tuần 3:** Hoàn thiện tính năng Điểm danh (Tích chọn vắng, lọc danh sách vắng).
- [ ] **Tuần 4:** Hoàn thiện tính năng kiểm tra với **2 luồng song song**:
  - **Luồng 1 - Thi trên hệ thống:** Giáo viên tạo đề trắc nghiệm, học sinh làm bài trên Web, hệ thống tự chấm điểm.
  - **Luồng 2 - Thi giấy:** Giáo viên mở giao diện nhập điểm thủ công từng học sinh, hệ thống lưu và gửi điểm y như luồng 1.
- [ ] **Tuần 5:** Tích hợp logic gửi Zalo theo đúng các trường hợp:
  - Học sinh **vắng**: Luôn kích hoạt gửi thông báo vắng.
  - Học sinh **có mặt**:
    - Nếu thi online (đã có điểm ngay): Gửi báo điểm ngay.
    - Nếu thi giấy (chưa nhập điểm): Tạm thời không gửi, chờ khi giáo viên nhập điểm và bấm [Lưu điểm] thì mới kích hoạt gửi báo điểm.
  - Chạy thử nghiệm ở chế độ Demo (ghi log & hiện trên giao diện).
- [ ] **Tuần 6:** Lập trình tính năng **Tự động thông báo cuối ca**:
  - Dùng **Scheduler / Cron Job** chạy ngầm trên Server: Cứ đến giờ kết thúc ca học (`gio_ket_thuc`) là hệ thống tự kiểm tra.
  - Logic kiểm tra: Nếu `da_gui == false` (giáo viên chưa gửi thủ công) thì tiến hành gửi tự động theo bảng logic đã chốt.
  - Sau khi gửi xong, cập nhật `da_gui = true` để không gửi lại lần 2.
  - Ghi lại toàn bộ vào bảng `NhatKyZalo` (Trạng thái: *"Tự động - Cuối ca"*) để giáo viên tra cứu.

---

### 🔴 GIAI ĐOẠN 5: KIỂM THỬ HỘP ĐEN & BÀN GIAO THỰC TẾ

1. **Deploy hệ thống lên môi trường chạy thử (Vercel, Render...).**
2. **Bàn giao tài khoản thử nghiệm cho Thầy:**
   - Thầy thao tác tạo buổi học -> chọn vắng 2 bạn -> bấm gửi.
   - Thầy kiểm tra bảng lịch sử tin nhắn xem hệ thống lọc đúng 2 bạn vắng chưa.
   - Thầy tạo buổi học có kiểm tra -> nhập điểm -> bấm gửi -> kiểm tra nội dung có điểm kèm theo hay không.
3. **Chuyển đổi sang tài khoản Zalo Doanh nghiệp thật:**
   - Khi Thầy hoàn tất đăng ký Zalo OA, chỉ cần điền Token vào file cấu hình là xong!

---

## 💬 MẪU NỘI DUNG TIN NHẮN TỰ ĐỘNG DỰ KIẾN

### 1. Mẫu tin báo VẮNG HỌC (Áp dụng cho mọi buổi học khi học sinh vắng):

> *"Kính gửi phụ huynh bé [Tên Học Sinh], Trung tâm Tiếng Anh xin thông báo: Hôm nay ngày [dd/mm], bé vắng mặt trong buổi học ca [17h30]. Quý phụ huynh vui lòng liên hệ trung tâm nếu cần hỗ trợ sắp xếp lịch học bù. Trân trọng!"*

### 2. Mẫu tin báo ĐIỂM SỐ (Áp dụng khi học sinh có mặt và có điểm thi):

> *"Kính gửi phụ huynh bé [Tên Học Sinh], Trung tâm xin gửi kết quả bài kiểm tra của bé trong buổi học ca [17h30]:*
> *- Chuyên cần: Có mặt đúng giờ.*
> *- Bài kiểm tra: [Từ vựng Unit 3] (Ngày kiểm tra: [dd/mm/yyyy]).*
> *- Điểm số: [8.5 / 10] - Xếp loại: Giỏi.*
> *Chi tiết bài làm phụ huynh có thể liên hệ giáo viên phụ trách. Trân trọng!"*

### 3. Trường hợp KHÔNG gửi tin:
> ✅ Học sinh có mặt + Không có kiểm tra (hoặc thi giấy chưa có điểm) → **Hệ thống không gửi tin nào** để tránh làm phiền phụ huynh.

---

## 🛡️ PHẦN 3: KỊCH BẢN XỬ LÝ NGOẠI LỆ & KIỂM THỬ THỰC TẾ (EDGE CASES)

Tài liệu kiểm thử dành cho nhóm phát triển và Thầy khi chạy thử nghiệm "hộp đen". Đảm bảo hệ thống xử lý mượt mà mọi tình huống thực tế:

### 1. Ngoại lệ về Điểm danh & Lịch học
* **1.1. Giáo viên quên không điểm danh cả buổi:**
  - *Hiện tượng:* Buổi học trôi qua nhưng GV không vào web điểm danh.
  - *Xử lý hệ thống:* Bảng `BuoiHoc` vẫn ở cờ `trang_thai_diem_danh = 'chua_diem_danh'`. Đến cuối ca, Cron Job kiểm tra thấy chưa điểm danh thì **TUYỆT ĐỐI KHÔNG gửi tin báo vắng bừa bãi**, đồng thời gửi cảnh báo đỏ trên màn hình Admin/GV: *"Cảnh báo: Lớp [Tên lớp] hôm nay chưa được điểm danh!"*.
* **1.2. Học sinh đi trễ (Lúc đầu tick Vắng, sau đó đổi thành Có mặt):**
  - *Hiện tượng:* 17h30 GV tick Vắng cho bé An. Đến 17h45 bé An vào lớp, GV đổi lại thành Có mặt.
  - *Xử lý trước giờ hết ca:* Cập nhật DB bình thường, cuối ca không gửi tin báo vắng cho bé An.
  - *Xử lý sau giờ hết ca (tin đã gửi lúc 19h00):* Web hiển thị cảnh báo cho GV: *"Tin báo vắng đã gửi cho phụ huynh lúc 19:00. Bạn có muốn gửi tin đính chính: 'Bé An đi trễ nhưng có tham gia buổi học' không?"*.
* **1.3. Ngày Nghỉ Lễ / Nghỉ đột xuất (Bão, cúp điện) & Giáo viên bận việc gấp:**
  - *Trường hợp Nghỉ Lễ / Thời tiết xấu:* Admin vào màn hình Lịch dạy bấm nút **[ 🚫 Hủy buổi học / Báo nghỉ lễ ]**. Buổi học chuyển sang trạng thái `NghiLe` hoặc `DaHuy`. Cron Job cuối ca sẽ **tự động bỏ qua buổi này**, không gửi bất kỳ tin nhắn nào đến phụ huynh.
  - *Trường hợp Giáo viên có việc bận gấp:* 
    - **Quy trình nghiệp vụ:** Giáo viên **phải chủ động nhắn tin/gọi điện báo cho Trung tâm** trước ca dạy để trung tâm kịp thời xử lý.
    - **Hướng xử lý trên hệ thống:**
      - *Nếu có Giáo viên dạy thay:* Admin vào hệ thống đổi người phụ trách buổi học đó sang Giáo viên dạy thay để giáo viên mới đăng nhập vào điểm danh bình thường.
      - *Nếu không có người dạy thay (Cả lớp nghỉ):* Admin bấm nút **"Hủy buổi học"** trên web và phát thông báo dời lịch học cho phụ huynh. Cron Job của ca đó sẽ tự động bị khóa, không gửi tin nhầm.

### 2. Ngoại lệ về Kiểm tra & Thi cử
* **2.1. Thi online — Rớt mạng, hết pin, tắt nhầm trình duyệt:**
  - *Hiện tượng:* Học sinh đang làm dở bài thì điện thoại sập nguồn hoặc mất mạng WiFi.
  - *Xử lý hệ thống:* Frontend dùng `localStorage` tự động lưu từng câu học sinh tick chọn. Khi mở lại trình duyệt, web tự phục hồi các câu đã làm và tiếp tục đồng hồ đếm ngược.
* **2.2. Thi online — Học sinh F5 / vào lại link để làm lại bài:**
  - *Hiện tượng:* Học sinh làm xong điểm thấp, cố tình vào lại để làm bài lần 2.
  - *Xử lý hệ thống:* Backend chặn với ràng buộc `UNIQUE(hoc_sinh_id, bai_kiem_tra_id)`. Nếu học sinh đã nộp bài, web hiện thông báo: *"Bạn đã hoàn thành bài thi này rồi! Điểm của bạn: X/10"*, không cho làm lại.
* **2.3. Thi online — Hết giờ mà học sinh chưa bấm "Nộp bài":**
  - *Xử lý hệ thống:* Khi đồng hồ đếm về `00:00`, JavaScript trên web tự động khóa các nút chọn và kích hoạt hàm nộp bài tự động (Auto-submit).
* **2.4. Thi giấy — Giáo viên nhập sót điểm cho một số bạn trong lớp:**
  - *Hiện tượng:* Lớp 20 bạn, GV nhập trước 17 bạn rồi bấm `[Lưu điểm]`. Còn 3 bạn chưa chấm xong.
  - *Xử lý hệ thống:* Hệ thống chỉ gửi tin báo điểm cho 17 bạn có điểm hợp lệ (khác `null`). Khi GV nhập bổ sung cho 3 bạn còn lại, hệ thống kiểm tra `NhatKyZalo` thấy 17 bạn kia đã gửi thì bỏ qua, **chỉ gửi điểm cho 3 bạn mới nhập**.
* **2.5. Làm tròn điểm số (Tránh gửi chuỗi số lẻ dài ngoằng):**
  - *Hiện tượng:* Đề 15 câu, đúng 11 câu -> Điểm ra `7.333333333333333`.
  - *Xử lý hệ thống:* Backend luôn làm tròn 1 chữ số thập phân (`round(diem, 1)` -> `7.3`) trước khi lưu vào DB và gửi qua Zalo.
* **2.6. Chống gian lận khi thi online (Rời tab / Tra Google):**
  - *Hiện tượng:* Học sinh vừa làm bài vừa mở tab mới tra Google Dịch hoặc từ điển.
  - *Xử lý hệ thống:* Bắt sự kiện `visibilitychange`. Học sinh rời tab lần 1: Hiện cảnh báo pop-up. Rời tab lần 2: Tự động khóa và nộp bài ngay lập tức, ghi chú cho giáo viên biết.
* **2.7. Ràng buộc nhập điểm thi giấy (Input Validation):**
  - *Hiện tượng:* Giáo viên gõ nhầm điểm âm, điểm > 10 (ví dụ gõ 90 thay vì 9.0), hoặc gõ dấu phẩy (8,5).
  - *Xử lý hệ thống:* Ô nhập điểm chặn chỉ cho nhập từ `0.0` đến `10.0`, tự động chuyển dấu phẩy `,` thành dấu chấm `.`. Nếu nhập sai khoảng thì báo đỏ và khóa nút Lưu.

### 3. Ngoại lệ về Tự động hóa & Zalo
* **3.1. Server bị mất điện / bảo trì đúng giờ tan ca (19h00):**
  - *Hiện tượng:* Lúc 18h58 server tắt, 19h10 mới bật lại.
  - *Xử lý hệ thống:* Cron Job quét theo điều kiện:
    ```sql
    WHERE gio_ket_thuc <= GIO_HIEN_TAI 
      AND da_gui = false 
      AND ngay_hoc = NGAY_HOM_NAY
    ```
    Hệ thống sẽ **gửi bù ngay lập tức** khi server khởi động lại, không bị bỏ sót ca học.
* **3.2. Chống nghẽn lệnh (Rate Limit của Zalo API):**
  - *Hiện tượng:* Nhiều lớp cùng tan ca một lúc, hàng chục tin nhắn gửi đi trong 1 giây có thể bị Zalo từ chối do nghi spam.
  - *Xử lý hệ thống:* Xử lý gửi theo hàng đợi (Queue), mỗi tin nhắn cách nhau từ 0.3 - 0.5 giây để đảm bảo tỷ lệ gửi thành công 100%.
* **3.3. Số điện thoại phụ huynh sai định dạng / không dùng Zalo:**
  - *Xử lý hệ thống:* Đặt khối `try-catch` trong hàm gửi tin. Nếu gửi thất bại, ghi nhận vào `NhatKyZalo` trạng thái `'ThatBai'` kèm mã lỗi, không để lỗi của 1 học sinh làm sập cả vòng lặp gửi tin của cả lớp.
* **3.4. Khung giờ gửi tin an toàn (Tránh quấy rầy phụ huynh đêm khuya 07:00 - 21:30):**
  - *Hiện tượng:* Giáo viên chấm bài thi giấy xong lúc 23h30 đêm rồi bấm [Lưu điểm].
  - *Xử lý hệ thống:* Nếu lưu điểm ngoài khung giờ an toàn (sau 21:30 hoặc trước 07:00), web cảnh báo và đề xuất: **"Hẹn giờ tự động gửi vào 07:30 sáng mai"** để không làm phiền giấc ngủ của phụ huynh.
* **3.5. Tài khoản Zalo Doanh nghiệp bị hết tiền giữa chừng (Out of Balance):**
  - *Hiện tượng:* Tài khoản ZNS cạn số dư khi đang gửi dở dang danh sách học sinh.
  - *Xử lý hệ thống:* Bắt mã lỗi hết tiền từ Zalo, dừng vòng lặp ngay, ghi log trạng thái `'HetTien'` và hiện cảnh báo đỏ trên màn hình Admin để kịp nạp tiền.

### 4. Ngoại lệ về Dữ liệu Học sinh & Phụ huynh
* **4.1. Một phụ huynh có 2 con cùng học ở trung tâm (trùng SĐT):**
  - *Xử lý hệ thống:* Cột `so_dien_thoai` trong bảng `HocSinh` **không được đặt là UNIQUE**.
  - Mẫu tin nhắn Zalo luôn kèm rõ họ tên từng bé: *"Kính gửi phụ huynh bé [Họ và tên con]..."* để phụ huynh không bị nhầm lẫn giữa 2 bé.
* **4.2. Nhập số điện thoại sai chuẩn:**
  - *Xử lý hệ thống:* Form nhập liệu của Frontend phải kiểm tra Regex số điện thoại Việt Nam (10 chữ số, đầu số hợp lệ 03, 05, 07, 08, 09) trước khi cho phép lưu vào Database.
* **4.3. Học sinh nhập học muộn hoặc nghỉ học giữa chừng (Bảo lưu):**
  - *Học sinh vào giữa khóa:* Chỉ tính điểm danh và bài kiểm tra từ ngày `ngay_nhap_hoc` trở đi, không tính vắng ảo các buổi trước.
  - *Học sinh bảo lưu / đã nghỉ:* Cập nhật `trang_thai = 'DaNghi'`, hệ thống tự động ẩn khỏi bảng điểm danh của giáo viên, không bao giờ gửi tin nhắn báo vắng nhầm cho phụ huynh.

---

## 👥 PHẦN 4: MA TRẬN PHÂN QUYỀN HỆ THỐNG (RBAC - 3 ROLES)

Hệ thống được thiết kế theo mô hình B2B SaaS gồm 3 cấp bậc vai trò rõ ràng:

### 1. Chi tiết 3 Vai trò (Roles)

* 👑 **Super Admin (Nhóm phát triển / Bạn):**
  - Quản lý toàn bộ danh sách khách hàng (các Trung tâm Tiếng Anh).
  - Quản lý **Hạn dùng bản quyền phần mềm (SaaS)** theo năm: Gia hạn ngày sử dụng hoặc khóa trung tâm nếu hết hạn đóng phí.
  - Cấu hình thông tin kết nối Zalo OA / ZNS (`App ID`, `Secret Key`, `Access Token`) cho từng trung tâm.
  - Quản lý hạ tầng server, giám sát nhật ký lỗi hệ thống (System Logs).

* 🏢 **Admin Trung tâm (Thầy / Chủ trung tâm / Quản lý):**
  - Quản lý đội ngũ Giáo viên (Tạo tài khoản, phân công lớp, cấp quyền).
  - Quản lý Học sinh (Tiếp nhận học sinh mới, xếp lớp, bảo lưu, chuyển lớp).
  - Quản lý Lịch dạy: Hủy buổi học / Báo nghỉ lễ, duyệt lịch đăng ký của giáo viên.
  - **Chỉ định Giáo viên dạy thay** khi có giáo viên báo bận đột xuất.
  - Màn hình giám sát: Xem cảnh báo **"Giáo viên nào chưa điểm danh"** theo từng ca học.
  - Xem Dashboard chi phí cước tin nhắn Zalo hàng tháng.

* 👨‍🏫 **Giáo viên (Người trực tiếp giảng dạy):**
  - Điểm danh và lọc học sinh vắng trong ca dạy của mình.
  - Tạo đề kiểm tra trắc nghiệm online hoặc nhập điểm thi giấy.
  - Thêm **Ghi chú nhận xét từng học sinh** (khen ngợi, nhắc nhở) gửi kèm Zalo.
  - Đăng ký lịch dạy / Xin nghỉ / Báo bận để Admin phê duyệt.
  - **Bảo mật dữ liệu:** Chỉ được xem và thao tác trên các lớp mình phụ trách, **không được xem chéo** dữ liệu lớp của giáo viên khác.

* 👨‍👩‍👧‍👦 **Học sinh & Phụ huynh:**
  - **KHÔNG CẦN TẠO TÀI KHOẢN:** Nhận thông tin trực tiếp qua Zalo, hoặc dùng số điện thoại tra cứu trên web, đảm bảo sự tiện lợi tối đa cho phụ huynh.

---

### 2. Bảng Ma trận Phân quyền (Permission Matrix)

| Chức năng chi tiết | 👑 Super Admin | 🏢 Admin Trung tâm | 👨‍🏫 Giáo viên |
|:---|:---:|:---:|:---:|
| **Quản lý danh sách các Trung tâm (Khách hàng SaaS)** | ✅ Toàn quyền | ❌ | ❌ |
| **Cấp / Khóa bản quyền phần mềm theo năm** | ✅ Toàn quyền | ❌ | ❌ |
| **Cấu hình Token API Zalo Doanh nghiệp** | ✅ Toàn quyền | ❌ | ❌ |
| **Xem log lỗi hệ thống & Tình trạng Server** | ✅ Toàn quyền | ❌ | ❌ |
| **Quản lý Giáo viên (Tạo nick, phân lớp)** | ❌ | ✅ Toàn quyền | ❌ |
| **Quản lý Học sinh (Tiếp nhận, chuyển lớp, bảo lưu)** | ❌ | ✅ Toàn quyền | 👁️ Xem lớp mình |
| **Hủy buổi học / Báo nghỉ lễ** | ❌ | ✅ Toàn quyền | ❌ |
| **Chỉ định Giáo viên dạy thay** | ❌ | ✅ Toàn quyền | ❌ |
| **Duyệt đơn xin nghỉ / đổi ca của GV** | ❌ | ✅ Toàn quyền | ❌ |
| **Xem bảng Cảnh báo "GV chưa điểm danh"** | ❌ | ✅ Toàn quyền | ❌ |
| **Xem Báo cáo Chi phí tiền cước Zalo** | ❌ | ✅ Toàn quyền | ❌ |
| **Đăng ký lịch dạy / Báo bận / Xin nghỉ** | ❌ | ❌ | ✅ Thao tác |
| **Điểm danh & Lọc học sinh vắng** | ❌ | 👁️ Xem & Điểm danh hộ | ✅ Lớp mình dạy |
| **Tạo đề thi & Chấm điểm (Online / Giấy)** | ❌ | 👁️ Xem kết quả | ✅ Lớp mình dạy |
| **Ghi chú nhận xét từng học sinh** | ❌ | 👁️ Xem | ✅ Lớp mình dạy |

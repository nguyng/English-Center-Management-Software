// Vai trò người dùng
export const ROLES = {
  SUPER_ADMIN: 'SuperAdmin',
  ADMIN: 'Admin',
  GIAO_VIEN: 'GiaoVien',
};

// Trạng thái điểm danh
export const ATTENDANCE_STATUS = {
  CO_MAT: 'CoMat',
  VANG: 'Vang',
};

// Trạng thái học sinh
export const STUDENT_STATUS = {
  DANG_HOC: 'DangHoc',
  BAO_LUU: 'BaoLuu',
  DA_NGHI: 'DaNghi',
};

// Trạng thái buổi học
export const SESSION_STATUS = {
  BINH_THUONG: 'BinhThuong',
  NGHI_LE: 'NghiLe',
  DA_HUY: 'DaHuy',
};

// Trạng thái điểm danh buổi học
export const ATTENDANCE_STATE = {
  CHUA_DIEM_DANH: 'chua_diem_danh',
  DA_DIEM_DANH: 'da_diem_danh',
};

// Hình thức thi
export const EXAM_TYPE = {
  HE_THONG: 'he_thong',   // Thi online
  GIAY: 'giay',           // Thi giấy
};

// Loại tin nhắn Zalo
export const ZALO_LOG_TYPE = {
  BAO_VANG: 'bao_vang',
  BAO_DIEM: 'bao_diem',
};

// Trạng thái tin nhắn Zalo
export const ZALO_STATUS = {
  THANH_CONG: 'ThanhCong',
  THAT_BAI: 'ThatBai',
  HET_TIEN: 'HetTien',
  DEMO: 'Demo',
};

// Trạng thái bản quyền SaaS
export const LICENSE_STATUS = {
  HOAT_DONG: 'HoatDong',
  HET_HAN: 'HetHan',
};

// Trạng thái tài khoản người dùng
export const USER_STATUS = {
  HOAT_DONG: 'HoatDong',
  KHOA: 'Khoa',
};

// Khung giờ gửi tin an toàn
export const SAFE_SEND_HOURS = {
  START: 7,   // 07:00
  END: 21.5,  // 21:30
};

// Menu Sidebar theo role
export const MENU_CONFIG = {
  [ROLES.SUPER_ADMIN]: [
    { key: '/super-admin/centers', icon: 'BankOutlined', label: 'Quản lý Trung tâm' },
    { key: '/super-admin/logs', icon: 'FileTextOutlined', label: 'Log Hệ thống' },
    { type: 'divider' },
    { key: '/dashboard', icon: 'DashboardOutlined', label: 'Dashboard' },
    { key: '/classes', icon: 'TeamOutlined', label: 'Lớp học' },
    { key: '/students', icon: 'UserOutlined', label: 'Học sinh' },
    { key: '/zalo-history', icon: 'MessageOutlined', label: 'Lịch sử Zalo' },
  ],
  [ROLES.ADMIN]: [
    { key: '/dashboard', icon: 'DashboardOutlined', label: 'Dashboard' },
    { key: '/teachers', icon: 'SolutionOutlined', label: 'Giáo viên' },
    { key: '/students', icon: 'UserOutlined', label: 'Học sinh' },
    { key: '/classes', icon: 'TeamOutlined', label: 'Lớp học' },
    { key: '/schedule', icon: 'CalendarOutlined', label: 'Lịch dạy' },
    { key: '/attendance-alerts', icon: 'AlertOutlined', label: 'Cảnh báo điểm danh' },
    { key: '/zalo-history', icon: 'MessageOutlined', label: 'Lịch sử Zalo' },
  ],
  [ROLES.GIAO_VIEN]: [
    { key: '/my-classes', icon: 'TeamOutlined', label: 'Lớp của tôi' },
    { key: '/my-schedule', icon: 'CalendarOutlined', label: 'Lịch dạy' },
    { key: '/exam/create', icon: 'FormOutlined', label: 'Tạo bài kiểm tra' },
    { key: '/exam/results/101', icon: 'TrophyOutlined', label: 'Bảng điểm bài thi' },
    { key: '/zalo-history', icon: 'MessageOutlined', label: 'Lịch sử Zalo' },
  ],
};

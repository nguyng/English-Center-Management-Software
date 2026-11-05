import dayjs from 'dayjs';

/**
 * Format ngày theo dd/mm/yyyy
 */
export function formatDate(date) {
  if (!date) return '';
  return dayjs(date).format('DD/MM/YYYY');
}

/**
 * Format ngày giờ theo dd/mm/yyyy HH:mm
 */
export function formatDateTime(date) {
  if (!date) return '';
  return dayjs(date).format('DD/MM/YYYY HH:mm');
}

/**
 * Format điểm số: làm tròn 1 chữ số thập phân
 */
export function formatScore(score) {
  if (score === null || score === undefined) return '—';
  return Number(score).toFixed(1);
}

/**
 * Xếp loại theo điểm số
 */
export function getGradeLabel(score) {
  if (score === null || score === undefined) return '';
  if (score >= 9) return 'Xuất sắc';
  if (score >= 8) return 'Giỏi';
  if (score >= 6.5) return 'Khá';
  if (score >= 5) return 'Trung bình';
  return 'Yếu';
}

/**
 * Format số điện thoại: 0901234567 → 090 123 4567
 */
export function formatPhone(phone) {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length !== 10) return phone;
  return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
}

/**
 * Tên trạng thái học sinh
 */
export function getStudentStatusLabel(status) {
  const map = {
    DangHoc: 'Đang học',
    BaoLuu: 'Bảo lưu',
    DaNghi: 'Đã nghỉ',
  };
  return map[status] || status;
}

/**
 * Tên trạng thái buổi học
 */
export function getSessionStatusLabel(status) {
  const map = {
    BinhThuong: 'Bình thường',
    NghiLe: 'Nghỉ lễ',
    DaHuy: 'Đã hủy',
  };
  return map[status] || status;
}

/**
 * Tên trạng thái Zalo
 */
export function getZaloStatusLabel(status) {
  const map = {
    ThanhCong: 'Thành công',
    ThatBai: 'Thất bại',
    HetTien: 'Hết tiền',
    Demo: 'Demo',
  };
  return map[status] || status;
}

/**
 * Màu tag cho trạng thái Zalo
 */
export function getZaloStatusColor(status) {
  const map = {
    ThanhCong: 'green',
    ThatBai: 'red',
    HetTien: 'orange',
    Demo: 'default',
  };
  return map[status] || 'default';
}

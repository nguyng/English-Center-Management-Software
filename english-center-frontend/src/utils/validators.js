/**
 * Regex số điện thoại Việt Nam: 10 chữ số, đầu số hợp lệ
 */
export const VN_PHONE_REGEX = /^(0[35789])\d{8}$/;

/**
 * Validate số điện thoại VN
 */
export function isValidPhone(phone) {
  if (!phone) return false;
  return VN_PHONE_REGEX.test(phone);
}

/**
 * Validate điểm số: 0.0 - 10.0
 */
export function isValidScore(score) {
  if (score === null || score === undefined || score === '') return true; // Cho phép trống (chưa nhập)
  const num = Number(score);
  return !isNaN(num) && num >= 0 && num <= 10;
}

/**
 * Làm tròn điểm 1 chữ số thập phân
 */
export function roundScore(score) {
  if (score === null || score === undefined) return null;
  return Math.round(Number(score) * 10) / 10;
}

/**
 * Chuẩn hóa input điểm: đổi dấu phẩy thành dấu chấm
 */
export function normalizeScoreInput(input) {
  if (!input) return input;
  return String(input).replace(',', '.');
}

/**
 * Validate email
 */
export function isValidEmail(email) {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Kiểm tra có trong khung giờ gửi tin an toàn không (07:00 - 21:30)
 */
export function isInSafeSendHours() {
  const now = new Date();
  const hours = now.getHours() + now.getMinutes() / 60;
  return hours >= 7 && hours <= 21.5;
}

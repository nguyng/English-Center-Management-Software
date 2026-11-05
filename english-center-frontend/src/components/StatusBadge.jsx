import { Tag } from 'antd';
import { ATTENDANCE_STATUS, STUDENT_STATUS, SESSION_STATUS } from '../utils/constants';

const attendanceConfig = {
  [ATTENDANCE_STATUS.CO_MAT]: { color: 'green', text: 'Có mặt ✅' },
  [ATTENDANCE_STATUS.VANG]: { color: 'red', text: 'Vắng ❌' },
};

const studentConfig = {
  [STUDENT_STATUS.DANG_HOC]: { color: 'green', text: 'Đang học' },
  [STUDENT_STATUS.BAO_LUU]: { color: 'orange', text: 'Bảo lưu' },
  [STUDENT_STATUS.DA_NGHI]: { color: 'default', text: 'Đã nghỉ' },
};

const sessionConfig = {
  [SESSION_STATUS.BINH_THUONG]: { color: 'blue', text: 'Bình thường' },
  [SESSION_STATUS.NGHI_LE]: { color: 'gold', text: 'Nghỉ lễ' },
  [SESSION_STATUS.DA_HUY]: { color: 'red', text: 'Đã hủy' },
};

export default function StatusBadge({ type = 'attendance', status }) {
  let config;
  switch (type) {
    case 'student':
      config = studentConfig[status];
      break;
    case 'session':
      config = sessionConfig[status];
      break;
    default:
      config = attendanceConfig[status];
  }

  if (!config) return <Tag>{status}</Tag>;

  return <Tag color={config.color}>{config.text}</Tag>;
}

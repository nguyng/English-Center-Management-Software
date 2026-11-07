import { Tag } from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  PauseCircleOutlined,
  MinusCircleOutlined,
  CalendarOutlined,
  StopOutlined,
} from '@ant-design/icons';
import { ATTENDANCE_STATUS, STUDENT_STATUS, SESSION_STATUS } from '../utils/constants';

const attendanceConfig = {
  [ATTENDANCE_STATUS.CO_MAT]: { color: 'success', icon: <CheckCircleOutlined />, text: 'Có mặt' },
  [ATTENDANCE_STATUS.VANG]: { color: 'error', icon: <CloseCircleOutlined />, text: 'Vắng mặt' },
};

const studentConfig = {
  [STUDENT_STATUS.DANG_HOC]: { color: 'success', icon: <CheckCircleOutlined />, text: 'Đang theo học' },
  [STUDENT_STATUS.BAO_LUU]: { color: 'warning', icon: <PauseCircleOutlined />, text: 'Bảo lưu' },
  [STUDENT_STATUS.DA_NGHI]: { color: 'default', icon: <MinusCircleOutlined />, text: 'Đã nghỉ học' },
};

const sessionConfig = {
  [SESSION_STATUS.BINH_THUONG]: { color: 'processing', icon: <CalendarOutlined />, text: 'Hoạt động' },
  [SESSION_STATUS.NGHI_LE]: { color: 'gold', icon: <PauseCircleOutlined />, text: 'Nghỉ lễ' },
  [SESSION_STATUS.DA_HUY]: { color: 'error', icon: <StopOutlined />, text: 'Đã hủy ca' },
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

  return (
    <Tag color={config.color} icon={config.icon} style={{ borderRadius: 6, fontWeight: 500 }}>
      {config.text}
    </Tag>
  );
}

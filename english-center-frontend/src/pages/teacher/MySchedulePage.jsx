import { Table, Tag, Typography, Button, Space, App as AntApp } from 'antd';
import { CalendarOutlined, EditOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { formatDate } from '../../utils/formatters';
import StatusBadge from '../../components/StatusBadge';

const { Title } = Typography;

const mockSchedule = [
  { id: 101, lop: 'Lớp A1 - Starter', ngay_hoc: '2026-11-05', ca_hoc: '17:30 - 19:00', trang_thai_buoi_hoc: 'BinhThuong', trang_thai_diem_danh: 'chua_diem_danh' },
  { id: 102, lop: 'Lớp A1 - Starter', ngay_hoc: '2026-11-07', ca_hoc: '17:30 - 19:00', trang_thai_buoi_hoc: 'BinhThuong', trang_thai_diem_danh: 'chua_diem_danh' },
  { id: 103, lop: 'Lớp A1 - Starter', ngay_hoc: '2026-11-09', ca_hoc: '17:30 - 19:00', trang_thai_buoi_hoc: 'NghiLe', trang_thai_diem_danh: 'chua_diem_danh' },
];

export default function MySchedulePage() {
  const navigate = useNavigate();
  const { message } = AntApp.useApp();

  const columns = [
    { title: 'Ngày', dataIndex: 'ngay_hoc', key: 'ngay', render: (d) => formatDate(d) },
    { title: 'Lớp', dataIndex: 'lop', key: 'lop' },
    { title: 'Ca học', dataIndex: 'ca_hoc', key: 'ca' },
    { title: 'Trạng thái buổi', dataIndex: 'trang_thai_buoi_hoc', key: 'tt', render: (s) => <StatusBadge type="session" status={s} /> },
    {
      title: 'Điểm danh',
      dataIndex: 'trang_thai_diem_danh',
      key: 'dd',
      render: (s) =>
        s === 'da_diem_danh' ? <Tag color="green">✅ Đã điểm danh</Tag> : <Tag color="orange">⏳ Chưa</Tag>,
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) =>
        record.trang_thai_buoi_hoc === 'BinhThuong' && record.trang_thai_diem_danh === 'chua_diem_danh' ? (
          <Button size="small" type="primary" icon={<EditOutlined />} onClick={() => navigate(`/attendance/${record.id}`)}>
            Điểm danh
          </Button>
        ) : null,
    },
  ];

  return (
    <div>
      <Title level={4}><CalendarOutlined /> Lịch dạy của tôi</Title>
      <Table dataSource={mockSchedule} columns={columns} rowKey="id" />
    </div>
  );
}


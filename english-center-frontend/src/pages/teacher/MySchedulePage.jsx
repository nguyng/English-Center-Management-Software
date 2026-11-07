import { Table, Tag, Typography, Button, Space } from 'antd';
import { CalendarOutlined, EditOutlined, ClockCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { formatDate } from '../../utils/formatters';
import StatusBadge from '../../components/StatusBadge';

const { Title, Text } = Typography;

const mockSchedule = [
  { id: 101, lop: 'Lớp A1 - Starter', ngay_hoc: '2026-11-05', gio_bat_dau: '17:30', gio_ket_thuc: '19:00', ca_hoc: '17:30 - 19:00', trang_thai_buoi_hoc: 'BinhThuong', trang_thai_diem_danh: 'chua_diem_danh' },
  { id: 102, lop: 'Lớp A1 - Starter', ngay_hoc: '2026-11-07', gio_bat_dau: '17:30', gio_ket_thuc: '19:00', ca_hoc: '17:30 - 19:00', trang_thai_buoi_hoc: 'BinhThuong', trang_thai_diem_danh: 'chua_diem_danh' },
  { id: 103, lop: 'Lớp A1 - Starter', ngay_hoc: '2026-11-09', gio_bat_dau: '17:30', gio_ket_thuc: '19:00', ca_hoc: '17:30 - 19:00', trang_thai_buoi_hoc: 'NghiLe', trang_thai_diem_danh: 'chua_diem_danh' },
];

export default function MySchedulePage() {
  const navigate = useNavigate();

  const columns = [
    {
      title: 'Ngày giảng dạy',
      dataIndex: 'ngay_hoc',
      key: 'ngay',
      render: (d) => (
        <Space size={6}>
          <CalendarOutlined style={{ color: '#0284c7' }} />
          <Text strong>{formatDate(d)}</Text>
        </Space>
      ),
    },
    {
      title: 'Lớp phụ trách',
      dataIndex: 'lop',
      key: 'lop',
      render: (lop) => (
        <Tag color="geekblue" style={{ fontWeight: 600, borderRadius: 6 }}>
          {lop}
        </Tag>
      ),
    },
    {
      title: 'Khung giờ ca học',
      dataIndex: 'ca_hoc',
      key: 'ca',
      render: (ca) => (
        <Space size={6}>
          <ClockCircleOutlined style={{ color: '#64748b' }} />
          <Text strong>{ca}</Text>
        </Space>
      ),
    },
    {
      title: 'Trạng thái buổi',
      dataIndex: 'trang_thai_buoi_hoc',
      key: 'tt',
      render: (s) => <StatusBadge type="session" status={s} />,
    },
    {
      title: 'Trạng thái điểm danh',
      dataIndex: 'trang_thai_diem_danh',
      key: 'dd',
      render: (s) =>
        s === 'da_diem_danh' ? (
          <Tag color="success" icon={<CheckCircleOutlined />}>
            Đã điểm danh
          </Tag>
        ) : (
          <Tag color="warning" icon={<ClockCircleOutlined />}>
            Chưa điểm danh
          </Tag>
        ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      align: 'right',
      render: (_, record) =>
        record.trang_thai_buoi_hoc === 'BinhThuong' && record.trang_thai_diem_danh === 'chua_diem_danh' ? (
          <Button
            size="small"
            type="primary"
            className="btn-cta-orange"
            icon={<EditOutlined />}
            onClick={() => navigate(`/attendance/${record.id}`)}
          >
            Vào điểm danh
          </Button>
        ) : (
          <Text type="secondary" style={{ fontSize: 12.5 }}>
            Không khả dụng
          </Text>
        ),
    },
  ];

  return (
    <div>
      <div className="edtech-page-header">
        <div>
          <Space align="center" size={10}>
            <Title level={4} style={{ margin: 0, fontWeight: 800 }}>
              Lịch Giảng Dạy Cá Nhân
            </Title>
            <Tag color="blue">{mockSchedule.length} buổi học</Tag>
          </Space>
          <Text type="secondary" style={{ display: 'block', marginTop: 4 }}>
            Danh sách các buổi dạy được phân công trong tuần và trạng thái điểm danh tương ứng.
          </Text>
        </div>
      </div>

      <div className="edtech-table-wrapper">
        <Table
          dataSource={mockSchedule}
          columns={columns}
          rowKey="id"
          pagination={false}
          scroll={{ x: 720 }}
        />
      </div>
    </div>
  );
}

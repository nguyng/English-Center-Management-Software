import { Table, Tag, Typography, Empty, Alert, Card, Button, Space } from 'antd';
import {
  AlertOutlined,
  WarningOutlined,
  EditOutlined,
  SafetyCertificateOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { formatDate } from '../../utils/formatters';

const { Title, Text } = Typography;

const mockAlerts = [
  {
    id: 2,
    lop: 'Lớp B2 - Intermediate',
    giao_vien: 'Trần Thị B',
    gio_bat_dau: '19:00',
    gio_ket_thuc: '20:30',
    ca_hoc: '19:00 - 20:30',
    ngay_hoc: '2026-11-05',
  },
];

export default function AttendanceAlertPage() {
  const navigate = useNavigate();

  const columns = [
    {
      title: 'Ngày học',
      dataIndex: 'ngay_hoc',
      key: 'ngay',
      render: (d) => <Text strong>{formatDate(d)}</Text>,
      width: 140,
    },
    {
      title: 'Lớp học',
      dataIndex: 'lop',
      key: 'lop',
      render: (lop) => (
        <Tag color="geekblue" style={{ fontWeight: 600, borderRadius: 6 }}>
          {lop}
        </Tag>
      ),
    },
    { title: 'Giảng viên phụ trách', dataIndex: 'giao_vien', key: 'gv' },
    {
      title: 'Ca học',
      dataIndex: 'ca_hoc',
      key: 'ca',
      width: 160,
      render: (ca) => (
        <Space size={6}>
          <ClockCircleOutlined style={{ color: '#64748b' }} />
          <Text strong>{ca}</Text>
        </Space>
      ),
    },
    {
      title: 'Trạng thái điểm danh',
      key: 'tt',
      width: 190,
      render: () => (
        <Tag icon={<WarningOutlined />} color="error">
          Chưa điểm danh!
        </Tag>
      ),
    },
    {
      title: 'Hành động can thiệp',
      key: 'action',
      align: 'right',
      render: (_, record) => (
        <Button
          type="primary"
          className="btn-cta-orange"
          size="small"
          icon={<EditOutlined />}
          onClick={() => navigate(`/attendance/${record.id}`)}
        >
          Admin điểm danh hộ
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div className="edtech-page-header">
        <div>
          <Space align="center" size={10}>
            <Title level={4} style={{ margin: 0, fontWeight: 800 }}>
              <AlertOutlined style={{ color: '#ef4444', marginRight: 8 }} />
              Cảnh Báo: Ca Học Chưa Điểm Danh
            </Title>
            <Tag color="error">{mockAlerts.length} ca cần xử lý</Tag>
          </Space>
          <Text type="secondary" style={{ display: 'block', marginTop: 4 }}>
            <SafetyCertificateOutlined style={{ color: '#0284c7', marginRight: 6 }} />
            Cơ chế an toàn lưới ZNS: Nếu giáo viên chưa xác nhận điểm danh, Cron Job cuối ca sẽ KHÔNG tự ý gửi tin báo vắng.
          </Text>
        </div>
      </div>

      {mockAlerts.length > 0 ? (
        <>
          <Alert
            type="error"
            showIcon
            message={`Báo động vận hành: Hiện có ${mockAlerts.length} ca học đã qua giờ nhưng chưa được xác nhận điểm danh!`}
            description="Vui lòng liên hệ nhắc nhở giáo viên phụ trách hoặc Admin có thể chủ động điểm danh hộ để đảm bảo quy trình thông báo Zalo ZNS tới phụ huynh."
            style={{ marginBottom: 20, borderRadius: 12, padding: '14px 18px' }}
          />
          <div className="edtech-table-wrapper">
            <Table
              dataSource={mockAlerts}
              columns={columns}
              rowKey="id"
              pagination={false}
              scroll={{ x: 760 }}
            />
          </div>
        </>
      ) : (
        <Card className="edtech-card">
          <Empty description="Tất cả ca học hôm nay đều đã được điểm danh hoàn tất! ✅" />
        </Card>
      )}
    </div>
  );
}

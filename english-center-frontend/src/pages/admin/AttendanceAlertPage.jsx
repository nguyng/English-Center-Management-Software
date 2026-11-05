import { Table, Tag, Typography, Empty, Alert, Card, Button } from 'antd';
import { AlertOutlined, WarningOutlined, EditOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { formatDate } from '../../utils/formatters';

const { Title, Text } = Typography;

const mockAlerts = [
  { id: 2, lop: 'Lớp B2 - Intermediate', giao_vien: 'Trần Thị B', ca_hoc: '19:00 - 20:30', ngay_hoc: '2026-11-05', gio_ket_thuc: '20:30' },
];

export default function AttendanceAlertPage() {
  const navigate = useNavigate();

  const columns = [
    { title: 'Ngày', dataIndex: 'ngay_hoc', key: 'ngay', render: (d) => formatDate(d), width: 120 },
    { title: 'Lớp học', dataIndex: 'lop', key: 'lop' },
    { title: 'Giáo viên phụ trách', dataIndex: 'giao_vien', key: 'gv' },
    { title: 'Ca học', dataIndex: 'ca_hoc', key: 'ca', width: 150 },
    { 
      title: 'Trạng thái điểm danh', 
      key: 'tt', 
      width: 180,
      render: () => <Tag icon={<WarningOutlined />} color="error">Chưa điểm danh!</Tag> 
    },
    {
      title: 'Hành động can thiệp',
      key: 'action',
      render: (_, record) => (
        <Button 
          type="primary" 
          size="small" 
          icon={<EditOutlined />} 
          onClick={() => navigate(`/attendance/${record.id}`)}
        >
          Admin điểm danh hộ
        </Button>
      )
    }
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>
          <AlertOutlined style={{ color: '#ff4d4f', marginRight: 8 }} />
          Cảnh Báo: Ca Học Chưa Điểm Danh
        </Title>
        <Text type="secondary">
          🛡️ Hệ thống kiểm soát an toàn lưới: Nếu chưa điểm danh, Cron Job cuối ca KHÔNG tự ý gửi tin vắng bừa bãi.
        </Text>
      </div>

      {mockAlerts.length > 0 ? (
        <>
          <Alert
            type="error"
            showIcon
            message={`Báo động: Hiện có ${mockAlerts.length} ca học chưa được xác nhận điểm danh!`}
            description="Vui lòng liên hệ nhắc nhở giáo viên hoặc Admin có thể chủ động điểm danh hộ để đảm bảo quy trình thông báo Zalo phụ huynh."
            style={{ marginBottom: 16, borderRadius: 8 }}
          />
          <Table dataSource={mockAlerts} columns={columns} rowKey="id" pagination={false} bordered />
        </>
      ) : (
        <Card style={{ borderRadius: 8 }}>
          <Empty description="Tất cả ca học hôm nay đều đã được điểm danh hoàn tất! ✅" />
        </Card>
      )}
    </div>
  );
}


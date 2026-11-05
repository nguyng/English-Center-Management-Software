import { Row, Col, Card, Statistic, Typography, Table, Tag, Empty, Button } from 'antd';
import {
  TeamOutlined,
  UserOutlined,
  SolutionOutlined,
  MessageOutlined,
  AlertOutlined,
  ArrowRightOutlined
} from '@ant-design/icons';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const mockStats = {
  totalStudents: 156,
  totalClasses: 12,
  totalTeachers: 8,
  totalMessagesSent: 342,
};

const mockZaloChart = [
  { thang: 'T6', thanh_cong: 280, that_bai: 12, het_tien: 0 },
  { thang: 'T7', thanh_cong: 310, that_bai: 8, het_tien: 0 },
  { thang: 'T8', thanh_cong: 295, that_bai: 15, het_tien: 5 },
  { thang: 'T9', thang_name: 'Tháng 9', thanh_cong: 340, that_bai: 10, het_tien: 0 },
  { thang: 'T10', thang_name: 'Tháng 10', thanh_cong: 360, that_bai: 6, het_tien: 0 },
  { thang: 'T11', thang_name: 'Tháng 11', thanh_cong: 342, that_bai: 9, het_tien: 0 },
];

const mockAlerts = [
  { id: 1, lop: 'Lớp A1 - Starter', giao_vien: 'Nguyễn Văn A', ca: '17:30 - 19:00', trang_thai: 'chua_diem_danh' },
  { id: 2, lop: 'Lớp B2 - Intermediate', giao_vien: 'Trần Thị B', ca: '19:00 - 20:30', trang_thai: 'chua_diem_danh' },
];

export default function DashboardPage() {
  const navigate = useNavigate();

  const alertColumns = [
    { title: 'Lớp', dataIndex: 'lop', key: 'lop' },
    { title: 'Giáo viên', dataIndex: 'giao_vien', key: 'giao_vien' },
    { title: 'Ca học', dataIndex: 'ca', key: 'ca' },
    {
      title: 'Trạng thái',
      key: 'trang_thai',
      render: () => <Tag color="error">⚠️ Chưa điểm danh</Tag>,
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, r) => (
        <Button size="small" type="primary" danger ghost onClick={() => navigate(`/attendance/${r.id}`)}>
          Điểm danh hộ
        </Button>
      )
    }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>📊 Dashboard Vận Hành Trung Tâm</Title>
          <Text type="secondary">Theo dõi tình hình điểm danh, sĩ số và chi phí ZNS thời gian thực</Text>
        </div>
      </div>

      {/* Row 1: Thống kê nhanh */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ background: '#e6f7ff', borderRadius: 12 }}>
            <Statistic title="Tổng Học sinh Đang học" value={mockStats.totalStudents} prefix={<UserOutlined />} valueStyle={{ color: '#0958d9' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ background: '#f6ffed', borderRadius: 12 }}>
            <Statistic title="Tổng Lớp Đang Mở" value={mockStats.totalClasses} prefix={<TeamOutlined />} valueStyle={{ color: '#389e0d' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ background: '#fff7e6', borderRadius: 12 }}>
            <Statistic title="Đội ngũ Giáo viên" value={mockStats.totalTeachers} prefix={<SolutionOutlined />} valueStyle={{ color: '#d46b08' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ background: '#f9f0ff', borderRadius: 12 }}>
            <Statistic title="Tin Zalo Đã Gửi (Tháng)" value={mockStats.totalMessagesSent} prefix={<MessageOutlined />} valueStyle={{ color: '#722ed1' }} />
          </Card>
        </Col>
      </Row>

      {/* Row 2: Biểu đồ Zalo + Cảnh báo */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card 
            title="📈 Thống kê Chi Phí & Tin Nhắn Zalo Theo Tháng" 
            bordered={false} 
            style={{ borderRadius: 12, height: '100%' }}
            extra={<Button type="link" onClick={() => navigate('/zalo-history')}>Xem chi tiết <ArrowRightOutlined /></Button>}
          >
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={mockZaloChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="thang" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="thanh_cong" name="Thành công" fill="#52c41a" radius={[4, 4, 0, 0]} />
                <Bar dataKey="that_bai" name="Thất bại" fill="#ff4d4f" radius={[4, 4, 0, 0]} />
                <Bar dataKey="het_tien" name="Hết tiền" fill="#faad14" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card
            title={
              <span>
                <AlertOutlined style={{ color: '#ff4d4f', marginRight: 8 }} />
                Cảnh Báo: Ca Học Chưa Điểm Danh
              </span>
            }
            bordered={false}
            style={{ borderRadius: 12, height: '100%' }}
            extra={<Tag color="error">Ưu tiên cao</Tag>}
          >
            {mockAlerts.length > 0 ? (
              <Table
                dataSource={mockAlerts}
                columns={alertColumns}
                rowKey="id"
                pagination={false}
                size="small"
              />
            ) : (
              <Empty description="Tất cả ca học hôm nay đã được điểm danh đầy đủ! 🎉" />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}


import { Row, Col, Card, Typography, Table, Tag, Empty, Button, Space, Progress } from 'antd';
import {
  TeamOutlined,
  UserOutlined,
  SolutionOutlined,
  MessageOutlined,
  AlertOutlined,
  ArrowRightOutlined,
  PlusOutlined,
  CalendarOutlined,
  CheckCircleFilled,
  RiseOutlined,
  BookOutlined,
} from '@ant-design/icons';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const { Title, Text } = Typography;

const mockStats = {
  totalStudents: 156,
  totalClasses: 12,
  totalTeachers: 8,
  totalMessagesSent: 342,
};

const mockZaloChart = [
  { thang: 'Tháng 6', thanh_cong: 280, that_bai: 12, het_tien: 0 },
  { thang: 'Tháng 7', thanh_cong: 310, that_bai: 8, het_tien: 0 },
  { thang: 'Tháng 8', thanh_cong: 295, that_bai: 15, het_tien: 5 },
  { thang: 'Tháng 9', thanh_cong: 340, that_bai: 10, het_tien: 0 },
  { thang: 'Tháng 10', thanh_cong: 360, that_bai: 6, het_tien: 0 },
  { thang: 'Tháng 11', thanh_cong: 342, that_bai: 9, het_tien: 0 },
];

const mockAlerts = [
  { id: 1, lop: 'Lớp A1 - Starter', giao_vien: 'Nguyễn Văn A', ca: '17:30 - 19:00', trang_thai: 'chua_diem_danh' },
  { id: 2, lop: 'Lớp B2 - Intermediate', giao_vien: 'Trần Thị B', ca: '19:00 - 20:30', trang_thai: 'chua_diem_danh' },
];

const roadmapPrograms = [
  {
    level: 'CEFR A1 • Starter',
    name: 'Tiếng Anh Giao Tiếp & Nền Tảng',
    teacher: 'Nguyễn Văn A',
    students: 18,
    capacity: 20,
    color: '#0284c7',
  },
  {
    level: 'CEFR B2 • Intermediate',
    name: 'Luyện Thi Học Thuật & Ngữ Pháp Chuyên Sâu',
    teacher: 'Trần Thị B',
    students: 15,
    capacity: 20,
    color: '#1e3a8a',
  },
  {
    level: 'CEFR C1 • Advanced',
    name: 'Tiếng Anh Học Thuật Quốc Tế & IELTS',
    teacher: 'Lê Hoàng C',
    students: 12,
    capacity: 15,
    color: '#f97316',
  },
];

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const alertColumns = [
    {
      title: 'Lớp học',
      dataIndex: 'lop',
      key: 'lop',
      render: (t) => <Text strong style={{ color: '#0f172a' }}>{t}</Text>,
    },
    { title: 'Giảng viên', dataIndex: 'giao_vien', key: 'giao_vien' },
    {
      title: 'Khung giờ',
      dataIndex: 'ca',
      key: 'ca',
      render: (t) => <Tag color="blue">{t}</Tag>,
    },
    {
      title: 'Trạng thái',
      key: 'trang_thai',
      render: () => <Tag color="error">Chưa điểm danh</Tag>,
    },
    {
      title: 'Thao tác',
      key: 'action',
      align: 'right',
      render: (_, r) => (
        <Button
          size="small"
          type="primary"
          danger
          onClick={() => navigate(`/attendance/${r.id}`)}
        >
          Điểm danh hộ
        </Button>
      ),
    },
  ];

  const statCards = [
    {
      title: 'Học viên đang theo học',
      value: mockStats.totalStudents,
      suffix: 'học viên',
      trend: '+12% so với tháng trước',
      icon: <UserOutlined />,
      iconBg: '#eff6ff',
      iconColor: '#1e3a8a',
      onClick: () => navigate('/students'),
    },
    {
      title: 'Lớp học đang hoạt động',
      value: mockStats.totalClasses,
      suffix: 'lớp học',
      trend: '3 cấp độ A1 • B2 • C1',
      icon: <TeamOutlined />,
      iconBg: '#f0f9ff',
      iconColor: '#0284c7',
      onClick: () => navigate('/classes'),
    },
    {
      title: 'Đội ngũ giảng viên',
      value: mockStats.totalTeachers,
      suffix: 'giảng viên',
      trend: '100% đạt chuẩn sư phạm',
      icon: <SolutionOutlined />,
      iconBg: '#fff7ed',
      iconColor: '#f97316',
      onClick: () => navigate('/teachers'),
    },
    {
      title: 'Tin Zalo ZNS đã gửi',
      value: mockStats.totalMessagesSent,
      suffix: 'tin/tháng',
      trend: '97.4% gửi thành công',
      icon: <MessageOutlined />,
      iconBg: '#ecfdf5',
      iconColor: '#10b981',
      onClick: () => navigate('/zalo-history'),
    },
  ];

  return (
    <div>
      {/* Hero Banner */}
      <div className="edtech-hero-banner">
        <Row gutter={[24, 24]} align="middle" justify="space-between" style={{ position: 'relative', zIndex: 1 }}>
          <Col xs={24} lg={15}>
            <Tag
              style={{
                background: 'rgba(56, 189, 248, 0.2)',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                color: '#e0f2fe',
                borderRadius: 999,
                padding: '3px 12px',
                marginBottom: 12,
              }}
            >
              <CheckCircleFilled style={{ color: '#34d399', marginRight: 6 }} />
              Hệ thống điều hành đào tạo & ZNS thời gian thực
            </Tag>
            <Title level={3} style={{ color: '#ffffff', margin: '0 0 8px', fontWeight: 800 }}>
              Xin chào, {user?.ho_ten || 'Ban Giám Đốc'}! 👋
            </Title>
            <Text style={{ color: '#cbd5e1', fontSize: 14.5, display: 'block', maxWidth: 640 }}>
              Theo dõi toàn diện sĩ số lớp học, tiến độ điểm danh hàng ngày, chất lượng bài kiểm tra định kỳ và
              tự động hóa thông báo Zalo ZNS tới phụ huynh.
            </Text>
          </Col>
          <Col xs={24} lg={9} style={{ display: 'flex', justifyContent: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
            <Button
              size="large"
              icon={<CalendarOutlined />}
              onClick={() => navigate('/schedule')}
              style={{
                background: 'rgba(255,255,255,0.12)',
                borderColor: 'rgba(255,255,255,0.28)',
                color: '#ffffff',
                borderRadius: 10,
              }}
            >
              Quản lý lịch dạy
            </Button>
            <Button
              size="large"
              className="btn-cta-orange"
              icon={<PlusOutlined />}
              onClick={() => navigate('/students')}
              style={{ borderRadius: 10 }}
            >
              Tiếp nhận học viên mới
            </Button>
          </Col>
        </Row>
      </div>

      {/* Row 1: KPI Cards */}
      <Row gutter={[20, 20]} style={{ marginBottom: 24 }}>
        {statCards.map((item, idx) => (
          <Col xs={24} sm={12} xl={6} key={idx}>
            <div
              className="edtech-stat-card"
              onClick={item.onClick}
              style={{ cursor: 'pointer' }}
            >
              <div>
                <Text style={{ color: '#64748b', fontSize: 13.5, fontWeight: 500 }}>
                  {item.title}
                </Text>
                <div style={{ margin: '6px 0 8px', display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>
                    {item.value}
                  </span>
                  <span style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>{item.suffix}</span>
                </div>
                <div style={{ fontSize: 12, color: '#0284c7', fontWeight: 600 }}>
                  <RiseOutlined style={{ marginRight: 4 }} />
                  {item.trend}
                </div>
              </div>
              <div
                className="edtech-stat-icon"
                style={{ background: item.iconBg, color: item.iconColor }}
              >
                {item.icon}
              </div>
            </div>
          </Col>
        ))}
      </Row>

      {/* Row 2: Biểu đồ Zalo + Cảnh báo điểm danh */}
      <Row gutter={[20, 20]} style={{ marginBottom: 24 }}>
        <Col xs={24} xl={14}>
          <Card
            className="edtech-card"
            title={
              <Space>
                <MessageOutlined style={{ color: '#0284c7' }} />
                <span>Thống kê Tin nhắn Zalo ZNS Gửi Phụ huynh Theo Tháng</span>
              </Space>
            }
            extra={
              <Button type="link" onClick={() => navigate('/zalo-history')} style={{ fontWeight: 600 }}>
                Nhật ký chi tiết <ArrowRightOutlined />
              </Button>
            }
            style={{ height: '100%' }}
          >
            <ResponsiveContainer width="100%" height={310}>
              <BarChart data={mockZaloChart} barGap={6}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="thang" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12.5 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12.5 }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 10,
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
                  }}
                />
                <Legend wrapperStyle={{ paddingTop: 12 }} />
                <Bar dataKey="thanh_cong" name="Gửi thành công" fill="#1e3a8a" radius={[6, 6, 0, 0]} maxBarSize={34} />
                <Bar dataKey="that_bai" name="Thất bại" fill="#ef4444" radius={[6, 6, 0, 0]} maxBarSize={34} />
                <Bar dataKey="het_tien" name="Hết hạn mức OA" fill="#f59e0b" radius={[6, 6, 0, 0]} maxBarSize={34} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        <Col xs={24} xl={10}>
          <Card
            className="edtech-card"
            title={
              <Space>
                <AlertOutlined style={{ color: '#ef4444' }} />
                <span>Cảnh báo: Ca học chưa điểm danh</span>
              </Space>
            }
            extra={<Tag color="error">Cần xử lý ngay</Tag>}
            style={{ height: '100%' }}
          >
            {mockAlerts.length > 0 ? (
              <>
                <div
                  style={{
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: 10,
                    padding: '10px 14px',
                    marginBottom: 14,
                    fontSize: 13,
                    color: '#991b1b',
                  }}
                >
                  🛡️ Hệ thống an toàn lưới ZNS: Ca học chưa điểm danh sẽ tạm khóa gửi thông báo tự động.
                </div>
                <Table
                  dataSource={mockAlerts}
                  columns={alertColumns}
                  rowKey="id"
                  pagination={false}
                  size="small"
                  scroll={{ x: 460 }}
                />
              </>
            ) : (
              <Empty description="Tất cả ca học hôm nay đã được điểm danh đầy đủ!" />
            )}
          </Card>
        </Col>
      </Row>

      {/* Row 3: Lộ trình đào tạo & Tỷ lệ lấp đầy lớp học */}
      <Card
        className="edtech-card"
        title={
          <Space>
            <BookOutlined style={{ color: '#1e3a8a' }} />
            <span>Lộ trình Đào tạo Chuẩn Quốc tế & Tỷ lệ Sĩ số Hiện tại</span>
          </Space>
        }
        extra={
          <Button type="link" onClick={() => navigate('/classes')} style={{ fontWeight: 600 }}>
            Quản lý tất cả lớp <ArrowRightOutlined />
          </Button>
        }
      >
        <Row gutter={[20, 20]}>
          {roadmapPrograms.map((prog, index) => {
            const percent = Math.round((prog.students / prog.capacity) * 100);
            return (
              <Col xs={24} md={8} key={index}>
                <div
                  style={{
                    padding: 20,
                    borderRadius: 14,
                    border: '1px solid #e2e8f0',
                    background: '#f8fafc',
                    height: '100%',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <Tag
                      style={{
                        background: prog.color,
                        color: '#fff',
                        border: 'none',
                        fontWeight: 600,
                        borderRadius: 6,
                      }}
                    >
                      {prog.level}
                    </Tag>
                    <Text type="secondary" style={{ fontSize: 12.5 }}>
                      GV: <strong>{prog.teacher}</strong>
                    </Text>
                  </div>
                  <div style={{ fontSize: 15.5, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>
                    {prog.name}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                    <span style={{ color: '#475569' }}>Sĩ số học viên</span>
                    <strong style={{ color: '#0f172a' }}>
                      {prog.students}/{prog.capacity} học viên ({percent}%)
                    </strong>
                  </div>
                  <Progress percent={percent} strokeColor={prog.color} showInfo={false} size="small" />
                </div>
              </Col>
            );
          })}
        </Row>
      </Card>
    </div>
  );
}

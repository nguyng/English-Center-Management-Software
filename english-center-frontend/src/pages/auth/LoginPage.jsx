import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Form, Input, Button, Typography, App as AntApp, Space, Tag, Row, Col } from 'antd';
import {
  UserOutlined,
  LockOutlined,
  BookOutlined,
  CheckCircleFilled,
  SafetyCertificateOutlined,
  ThunderboltFilled,
  TeamOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import { ROLES } from '../../utils/constants';

const { Title, Text, Paragraph } = Typography;

const demoAccounts = [
  {
    label: 'Admin Trung tâm',
    email: 'admin@center.com',
    password: 'password123',
    badgeColor: '#1e3a8a',
    desc: 'Quản lý toàn diện',
  },
  {
    label: 'Giảng viên',
    email: 'teacher@center.com',
    password: 'password123',
    badgeColor: '#0284c7',
    desc: 'Điểm danh & Chấm thi',
  },
  {
    label: 'Super Admin',
    email: 'super@saas.com',
    password: 'password123',
    badgeColor: '#f97316',
    desc: 'Quản trị Multi-Tenant',
  },
];

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [activeDemo, setActiveDemo] = useState('admin@center.com');
  const [form] = Form.useForm();
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { message } = AntApp.useApp();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSelectDemo = (acc) => {
    setActiveDemo(acc.email);
    form.setFieldsValue({
      email: acc.email,
      password: acc.password,
    });
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const user = await login(values.email, values.password);
      message.success(`Đăng nhập thành công! Chào mừng ${user.ho_ten || 'bạn'}`);

      // Điều hướng tới trang tương ứng với Role
      if (user.vai_tro === ROLES.SUPER_ADMIN) {
        navigate('/super-admin/centers', { replace: true });
      } else if (user.vai_tro === ROLES.GIAO_VIEN) {
        navigate('/my-classes', { replace: true });
      } else {
        navigate(from === '/login' ? '/dashboard' : from, { replace: true });
      }
    } catch (error) {
      console.error('Lỗi đăng nhập:', error);
      message.error(error?.message || 'Đăng nhập không thành công, vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f0f9ff 0%, #f8fafc 50%, #eff6ff 100%)',
        padding: '24px 16px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 1120,
          background: '#ffffff',
          borderRadius: 24,
          boxShadow: '0 24px 60px -12px rgba(15, 37, 87, 0.14), 0 4px 16px -2px rgba(15, 23, 42, 0.05)',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
        }}
      >
        <Row>
          {/* Left Hero Section: Brand Showcase & EdTech Value Proposition */}
          <Col
            xs={24}
            lg={13}
            style={{
              background: 'linear-gradient(135deg, #0f2557 0%, #1e3a8a 58%, #0284c7 100%)',
              padding: '44px 40px',
              color: '#ffffff',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Decorative Floating Circles */}
            <div
              style={{
                position: 'absolute',
                top: -80,
                right: -60,
                width: 280,
                height: 280,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(56, 189, 248, 0.25) 0%, rgba(56, 189, 248, 0) 70%)',
                pointerEvents: 'none',
              }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: -90,
                left: -50,
                width: 260,
                height: 260,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(249, 115, 22, 0.22) 0%, rgba(249, 115, 22, 0) 70%)',
                pointerEvents: 'none',
              }}
            />

            <div style={{ position: 'relative', zIndex: 1 }}>
              {/* Brand Logo Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: 'linear-gradient(135deg, #38bdf8 0%, #f97316 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 22,
                    color: '#fff',
                    boxShadow: '0 8px 20px rgba(56, 189, 248, 0.35)',
                  }}
                >
                  <BookOutlined />
                </div>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em', color: '#fff' }}>
                    EduPrime <span style={{ color: '#38bdf8' }}>English</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#bae6fd', fontWeight: 500 }}>
                    PREMIUM EDTECH MANAGEMENT PLATFORM
                  </div>
                </div>
              </div>

              <Tag
                style={{
                  background: 'rgba(56, 189, 248, 0.16)',
                  border: '1px solid rgba(56, 189, 248, 0.35)',
                  color: '#e0f2fe',
                  borderRadius: 999,
                  padding: '4px 14px',
                  fontSize: 12.5,
                  marginBottom: 16,
                }}
              >
                <ThunderboltFilled style={{ color: '#f59e0b', marginRight: 6 }} />
                Giải pháp Quản trị Trung tâm Anh ngữ Thế hệ mới
              </Tag>

              <Title
                level={2}
                style={{
                  color: '#ffffff',
                  fontSize: 30,
                  fontWeight: 800,
                  lineHeight: 1.28,
                  marginBottom: 16,
                  letterSpacing: '-0.02em',
                }}
              >
                Nâng tầm chất lượng đào tạo & Kết nối phụ huynh tức thì
              </Title>

              <Paragraph style={{ color: '#cbd5e1', fontSize: 15, lineHeight: 1.65, marginBottom: 28 }}>
                Đồng bộ hóa toàn diện quy trình vận hành trung tâm tiếng Anh: từ quản lý lộ trình lớp học
                (Starter A1 đến Advanced C1), điểm danh 1 chạm, tổ chức thi trực tuyến chống gian lận đến
                báo cáo học tập tự động qua Zalo ZNS.
              </Paragraph>

              {/* Feature Cards */}
              <Space direction="vertical" size={12} style={{ width: '100%', marginBottom: 28 }}>
                {[
                  {
                    title: 'Điểm danh & Báo vắng Zalo ZNS tự động',
                    desc: 'Cơ chế lưới an toàn: Kiểm soát điểm danh chặt chẽ, gửi thông báo đúng khung giờ quy định.',
                  },
                  {
                    title: 'Cổng thi Online bảo mật bằng mã PIN',
                    desc: 'Chống thi hộ, tự động chấm điểm trắc nghiệm và khóa bài khi phát hiện rời màn hình thi.',
                  },
                  {
                    title: 'Theo dõi lộ trình & Bảng điểm minh bạch',
                    desc: 'Phân tích kết quả học tập từ lớp Starter, Intermediate đến Advanced theo thời gian thực.',
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 12,
                      padding: '12px 16px',
                      borderRadius: 12,
                      background: 'rgba(255, 255, 255, 0.07)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    <CheckCircleFilled style={{ color: '#38bdf8', fontSize: 18, marginTop: 3 }} />
                    <div>
                      <div style={{ color: '#ffffff', fontWeight: 600, fontSize: 14 }}>{item.title}</div>
                      <div style={{ color: '#cbd5e1', fontSize: 12.5, marginTop: 2 }}>{item.desc}</div>
                    </div>
                  </div>
                ))}
              </Space>
            </div>

            {/* Bottom Metrics Bar */}
            <div
              style={{
                position: 'relative',
                zIndex: 1,
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 12,
                paddingTop: 20,
                borderTop: '1px solid rgba(255, 255, 255, 0.14)',
              }}
            >
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#38bdf8' }}>156+</div>
                <div style={{ fontSize: 12, color: '#cbd5e1' }}>Học viên đang học</div>
              </div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#fb923c' }}>99.4%</div>
                <div style={{ fontSize: 12, color: '#cbd5e1' }}>Tỷ lệ gửi ZNS thành công</div>
              </div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#34d399' }}>A1 → C1</div>
                <div style={{ fontSize: 12, color: '#cbd5e1' }}>Chuẩn lộ trình quốc tế</div>
              </div>
            </div>
          </Col>

          {/* Right Form Section: Login & 1-Click Role Switcher */}
          <Col
            xs={24}
            lg={11}
            style={{
              padding: '44px 40px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              background: '#ffffff',
            }}
          >
            <div style={{ marginBottom: 24 }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 10px',
                  borderRadius: 6,
                  background: '#eff6ff',
                  color: '#1e3a8a',
                  fontSize: 12,
                  fontWeight: 600,
                  marginBottom: 10,
                }}
              >
                <SafetyCertificateOutlined /> CỔNG ĐĂNG NHẬP NỘI BỘ
              </div>
              <Title level={3} style={{ margin: 0, fontWeight: 800, color: '#0f172a' }}>
                Chào mừng quay trở lại!
              </Title>
              <Text style={{ color: '#64748b', fontSize: 14 }}>
                Đăng nhập để truy cập bảng điều khiển quản lý đào tạo của bạn.
              </Text>
            </div>

            {/* Quick 1-Click Demo Role Switcher */}
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 12,
                padding: '12px 14px',
                marginBottom: 24,
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 8 }}>
                💡 Chọn nhanh tài khoản Demo (1-Click):
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {demoAccounts.map((acc) => {
                  const isSelected = activeDemo === acc.email;
                  return (
                    <div
                      key={acc.email}
                      onClick={() => handleSelectDemo(acc)}
                      style={{
                        padding: '8px 10px',
                        borderRadius: 8,
                        cursor: 'pointer',
                        background: isSelected ? '#eff6ff' : '#ffffff',
                        border: isSelected ? '1.5px solid #2563eb' : '1px solid #e2e8f0',
                        transition: 'all 0.15s',
                        textAlign: 'center',
                      }}
                    >
                      <div
                        style={{
                          fontSize: 12.5,
                          fontWeight: 700,
                          color: isSelected ? '#1e3a8a' : '#334155',
                        }}
                      >
                        {acc.label}
                      </div>
                      <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{acc.desc}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <Form
              form={form}
              name="login"
              onFinish={handleSubmit}
              size="large"
              layout="vertical"
              initialValues={{ email: 'admin@center.com', password: 'password123' }}
              requiredMark={false}
            >
              <Form.Item
                name="email"
                label={<span style={{ fontWeight: 600, color: '#334155' }}>Email tài khoản</span>}
                rules={[
                  { required: true, message: 'Vui lòng nhập email!' },
                  { type: 'email', message: 'Email không hợp lệ!' },
                ]}
              >
                <Input
                  prefix={<UserOutlined style={{ color: '#94a3b8' }} />}
                  placeholder="admin@center.com hoặc teacher@center.com"
                />
              </Form.Item>

              <Form.Item
                name="password"
                label={<span style={{ fontWeight: 600, color: '#334155' }}>Mật khẩu</span>}
                rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
              >
                <Input.Password
                  prefix={<LockOutlined style={{ color: '#94a3b8' }} />}
                  placeholder="Nhập mật khẩu"
                />
              </Form.Item>

              <Form.Item style={{ marginTop: 24, marginBottom: 16 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  block
                  className="btn-cta-orange"
                  icon={<ArrowRightOutlined />}
                  iconPosition="end"
                  style={{ height: 48, fontSize: 15.5, borderRadius: 10 }}
                >
                  Đăng nhập hệ thống
                </Button>
              </Form.Item>
            </Form>

            <div
              style={{
                marginTop: 8,
                paddingTop: 16,
                borderTop: '1px solid #f1f5f9',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 8,
                fontSize: 12.5,
                color: '#64748b',
              }}
            >
              <span>
                <TeamOutlined style={{ marginRight: 6, color: '#0284c7' }} />
                Dành cho Học viên thi Online:
              </span>
              <Button
                type="link"
                size="small"
                onClick={() => navigate('/thi/101')}
                style={{ padding: 0, fontWeight: 600, color: '#0284c7' }}
              >
                Mở Cổng Thi Trắc Nghiệm →
              </Button>
            </div>
          </Col>
        </Row>
      </div>
    </div>
  );
}

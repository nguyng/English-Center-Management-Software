import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, App as AntApp, Space } from 'antd';
import { UserOutlined, LockOutlined, BookOutlined } from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import { ROLES } from '../../utils/constants';

const { Title, Text } = Typography;

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { message } = AntApp.useApp();

  const from = location.state?.from?.pathname || '/dashboard';

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
        justifyContent: 'center',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #1890ff 0%, #722ed1 100%)',
        padding: 24,
      }}
    >
      <Card
        style={{ width: 440, borderRadius: 16, boxShadow: '0 12px 32px rgba(0,0,0,0.2)' }}
        bordered={false}
      >
        <Space direction="vertical" size="large" style={{ width: '100%', textAlign: 'center' }}>
          <div>
            <BookOutlined style={{ fontSize: 52, color: '#1890ff' }} />
            <Title level={3} style={{ marginTop: 12, marginBottom: 4 }}>
              English Center SaaS
            </Title>
            <Text type="secondary">Phần mềm quản lý trung tâm & Báo Zalo tự động</Text>
          </div>

          <Form
            name="login"
            onFinish={handleSubmit}
            size="large"
            layout="vertical"
            initialValues={{ email: 'admin@center.edu.vn', password: 'password123' }}
            style={{ textAlign: 'left' }}
          >
            <Form.Item
              name="email"
              rules={[
                { required: true, message: 'Vui lòng nhập email!' },
                { type: 'email', message: 'Email không hợp lệ!' },
              ]}
            >
              <Input prefix={<UserOutlined />} placeholder="Email (admin@... hoặc teacher@...)" />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="Mật khẩu" />
            </Form.Item>

            <Form.Item style={{ marginBottom: 12 }}>
              <Button type="primary" htmlType="submit" loading={loading} block style={{ height: 44 }}>
                Đăng nhập hệ thống
              </Button>
            </Form.Item>

            <div style={{ background: '#f5f5f5', padding: '10px 14px', borderRadius: 8, fontSize: 13, color: '#666' }}>
              💡 <strong>Gợi ý tài khoản demo:</strong>
              <br />• Admin: <code>admin@center.com</code>
              <br />• Giáo viên: <code>teacher@center.com</code>
              <br />• Super Admin: <code>super@saas.com</code>
            </div>
          </Form>
        </Space>
      </Card>
    </div>
  );
}

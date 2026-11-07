import { useState } from 'react';
import {
  Layout,
  Space,
  Dropdown,
  Avatar,
  Typography,
  Tag,
  Modal,
  Form,
  Input,
  App as AntApp,
  Divider,
  Button,
  Badge,
  Tooltip,
} from 'antd';
import {
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  KeyOutlined,
  MailOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BellOutlined,
  PlusCircleOutlined,
  FormOutlined,
  DownOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { ROLES } from '../../utils/constants';

const { Header: AntHeader } = Layout;
const { Text } = Typography;

const roleLabels = {
  [ROLES.SUPER_ADMIN]: { text: 'Super Admin', color: 'gold' },
  [ROLES.ADMIN]: { text: 'Admin Trung tâm', color: 'geekblue' },
  [ROLES.GIAO_VIEN]: { text: 'Giảng viên', color: 'cyan' },
};

const routeTitles = {
  '/dashboard': 'Tổng quan vận hành',
  '/students': 'Quản lý học viên',
  '/classes': 'Quản lý lớp học',
  '/teachers': 'Đội ngũ giảng viên',
  '/schedule': 'Lịch học & Ca dạy',
  '/attendance-alerts': 'Cảnh báo điểm danh',
  '/zalo-history': 'Nhật ký Zalo ZNS',
  '/super-admin/centers': 'Quản trị đối tác SaaS',
  '/super-admin/logs': 'Nhật ký hệ thống',
  '/my-classes': 'Lớp phụ trách của tôi',
  '/my-schedule': 'Lịch giảng dạy cá nhân',
  '/exam/create': 'Thiết kế đề kiểm tra',
};

export default function Header({ collapsed, onToggleCollapse, isMobile, onOpenMobileMenu }) {
  const { user, logout } = useAuth();
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const location = useLocation();
  const { message } = AntApp.useApp();

  const roleInfo = roleLabels[user?.vai_tro] || { text: user?.vai_tro || 'Người dùng', color: 'default' };

  const currentTitle =
    routeTitles[location.pathname] ||
    (location.pathname.startsWith('/attendance/')
      ? 'Điểm danh & Nhận xét buổi học'
      : location.pathname.startsWith('/exam/results/')
      ? 'Kết quả & Phân tích bài thi'
      : location.pathname.startsWith('/exam/score/')
      ? 'Chấm điểm bài kiểm tra giấy'
      : 'Hệ thống Quản lý Anh ngữ');

  const dropdownItems = {
    items: [
      {
        key: 'profile',
        icon: <SettingOutlined />,
        label: 'Cài đặt tài khoản & Mật khẩu',
      },
      { type: 'divider' },
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: 'Đăng xuất khỏi hệ thống',
        danger: true,
      },
    ],
    onClick: ({ key }) => {
      if (key === 'logout') {
        logout();
        navigate('/login');
      } else if (key === 'profile') {
        form.setFieldsValue({
          ho_ten: user?.ho_ten,
          email: user?.email,
        });
        setProfileModalOpen(true);
      }
    },
  };

  const handleUpdatePassword = async () => {
    try {
      const values = await form.validateFields();
      if (values.new_password && values.new_password !== values.confirm_password) {
        message.error('Xác nhận mật khẩu mới không khớp!');
        return;
      }
      message.success('Cập nhật thông tin và mật khẩu thành công!');
      setProfileModalOpen(false);
      form.resetFields();
    } catch {}
  };

  return (
    <>
      <AntHeader
        style={{
          background: 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(12px)',
          padding: isMobile ? '0 16px' : '0 28px',
          height: 68,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #e2e8f0',
          position: 'sticky',
          top: 0,
          zIndex: 15,
        }}
      >
        {/* Left: Menu Trigger + Current Section Context */}
        <Space size={12} align="center">
          <Button
            type="text"
            icon={
              isMobile ? (
                <MenuUnfoldOutlined style={{ fontSize: 18 }} />
              ) : collapsed ? (
                <MenuUnfoldOutlined style={{ fontSize: 18 }} />
              ) : (
                <MenuFoldOutlined style={{ fontSize: 18 }} />
              )
            }
            onClick={isMobile ? onOpenMobileMenu : onToggleCollapse}
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              color: '#334155',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
            }}
          />
          <div style={{ lineHeight: 1.25 }}>
            <div style={{ fontSize: isMobile ? 15 : 16, fontWeight: 700, color: '#0f172a' }}>
              {currentTitle}
            </div>
            {!isMobile && (
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                EduPrime English Center • Học kỳ Thu Đông 2026
              </div>
            )}
          </div>
        </Space>

        {/* Right: Quick CTA + Alerts + User Profile */}
        <Space size={isMobile ? 8 : 16} align="center">
          {!isMobile && user?.vai_tro === ROLES.ADMIN && (
            <Button
              className="btn-cta-orange"
              icon={<PlusCircleOutlined />}
              onClick={() => navigate('/students')}
              style={{ borderRadius: 10 }}
            >
              Tiếp nhận học viên
            </Button>
          )}

          {!isMobile && user?.vai_tro === ROLES.GIAO_VIEN && (
            <Button
              className="btn-cta-orange"
              icon={<FormOutlined />}
              onClick={() => navigate('/exam/create')}
              style={{ borderRadius: 10 }}
            >
              Tạo đề kiểm tra
            </Button>
          )}

          {(user?.vai_tro === ROLES.ADMIN || user?.vai_tro === ROLES.SUPER_ADMIN) && (
            <Tooltip title="Xem cảnh báo ca học chưa điểm danh">
              <Badge count={2} size="small" offset={[-4, 4]}>
                <Button
                  type="text"
                  icon={<BellOutlined style={{ fontSize: 18, color: '#475569' }} />}
                  onClick={() => navigate('/attendance-alerts')}
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                  }}
                />
              </Badge>
            </Tooltip>
          )}

          <Dropdown menu={dropdownItems} placement="bottomRight" trigger={['click']}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                cursor: 'pointer',
                padding: '5px 12px 5px 6px',
                borderRadius: 999,
                border: '1px solid #e2e8f0',
                background: '#ffffff',
                transition: 'all 0.2s',
              }}
            >
              <Avatar
                size={34}
                icon={<UserOutlined />}
                style={{
                  background: 'linear-gradient(135deg, #1e3a8a 0%, #0284c7 100%)',
                  fontWeight: 600,
                }}
              />
              {!isMobile && (
                <div style={{ lineHeight: 1.2, textAlign: 'left' }}>
                  <Text strong style={{ fontSize: 13.5, color: '#0f172a', display: 'block' }}>
                    {user?.ho_ten || 'Người dùng'}
                  </Text>
                  <Tag
                    color={roleInfo.color}
                    bordered={false}
                    style={{ margin: '2px 0 0', fontSize: 10.5, padding: '0 6px', lineHeight: '16px' }}
                  >
                    {roleInfo.text}
                  </Tag>
                </div>
              )}
              <DownOutlined style={{ fontSize: 11, color: '#94a3b8' }} />
            </div>
          </Dropdown>
        </Space>
      </AntHeader>

      <Modal
        open={profileModalOpen}
        onCancel={() => setProfileModalOpen(false)}
        onOk={handleUpdatePassword}
        title="👤 Thông tin tài khoản & Bảo mật"
        okText="Lưu thay đổi"
        cancelText="Đóng"
        width={480}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="ho_ten" label="Họ và tên hiển thị">
            <Input prefix={<UserOutlined />} placeholder="Họ và tên" />
          </Form.Item>
          <Form.Item name="email" label="Email đăng nhập">
            <Input prefix={<MailOutlined />} disabled />
          </Form.Item>

          <Divider style={{ margin: '16px 0' }}>Đổi mật khẩu mới</Divider>

          <Form.Item name="current_password" label="Mật khẩu hiện tại">
            <Input.Password prefix={<KeyOutlined />} placeholder="Nhập mật khẩu cũ nếu muốn đổi" />
          </Form.Item>
          <Form.Item name="new_password" label="Mật khẩu mới">
            <Input.Password prefix={<KeyOutlined />} placeholder="Mật khẩu mới (tối thiểu 6 ký tự)" />
          </Form.Item>
          <Form.Item name="confirm_password" label="Xác nhận mật khẩu mới">
            <Input.Password prefix={<KeyOutlined />} placeholder="Nhập lại mật khẩu mới" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

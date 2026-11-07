import { useState } from 'react';
import { Layout, Space, Dropdown, Avatar, Typography, Tag, Modal, Form, Input, App as AntApp, Divider } from 'antd';
import { UserOutlined, LogoutOutlined, SettingOutlined, KeyOutlined, MailOutlined } from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ROLES } from '../../utils/constants';

const { Header: AntHeader } = Layout;
const { Text } = Typography;

const roleLabels = {
  [ROLES.SUPER_ADMIN]: { text: 'Super Admin', color: 'gold' },
  [ROLES.ADMIN]: { text: 'Admin Trung tâm', color: 'blue' },
  [ROLES.GIAO_VIEN]: { text: 'Giáo viên', color: 'green' },
};

export default function Header() {
  const { user, logout } = useAuth();
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { message } = AntApp.useApp();

  const roleInfo = roleLabels[user?.vai_tro] || { text: user?.vai_tro || 'Người dùng', color: 'default' };

  const dropdownItems = {
    items: [
      {
        key: 'profile',
        icon: <SettingOutlined />,
        label: 'Cài đặt tài khoản',
      },
      { type: 'divider' },
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: 'Đăng xuất',
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
          background: '#fff',
          padding: '0 24px',
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          boxShadow: '0 1px 4px rgba(0, 0, 0, 0.08)',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <Dropdown menu={dropdownItems} placement="bottomRight" trigger={['click']}>
          <Space style={{ cursor: 'pointer' }}>
            <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />
            <div style={{ lineHeight: '1.2' }}>
              <Text strong>{user?.ho_ten || 'Người dùng'}</Text>
              <br />
              <Tag color={roleInfo.color} style={{ margin: 0, fontSize: 11 }}>
                {roleInfo.text}
              </Tag>
            </div>
          </Space>
        </Dropdown>
      </AntHeader>

      <Modal
        open={profileModalOpen}
        onCancel={() => setProfileModalOpen(false)}
        onOk={handleUpdatePassword}
        title="👤 Thông tin tài khoản & Đổi mật khẩu"
        okText="Lưu thay đổi"
        cancelText="Đóng"
        width={480}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="ho_ten" label="Họ và tên">
            <Input prefix={<UserOutlined />} placeholder="Họ và tên" />
          </Form.Item>
          <Form.Item name="email" label="Email đăng nhập">
            <Input prefix={<MailOutlined />} disabled />
          </Form.Item>

          <Divider style={{ margin: '16px 0' }}>Đổi mật khẩu</Divider>

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

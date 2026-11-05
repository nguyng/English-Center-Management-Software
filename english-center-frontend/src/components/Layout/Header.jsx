import { Layout, Space, Dropdown, Avatar, Typography, Tag } from 'antd';
import { UserOutlined, LogoutOutlined, SettingOutlined } from '@ant-design/icons';
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
  const navigate = useNavigate();

  const roleInfo = roleLabels[user?.vai_tro] || { text: user?.vai_tro, color: 'default' };

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
      }
    },
  };

  return (
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
  );
}

import { useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu } from 'antd';
import {
  DashboardOutlined,
  TeamOutlined,
  UserOutlined,
  CalendarOutlined,
  MessageOutlined,
  FormOutlined,
  AlertOutlined,
  BankOutlined,
  FileTextOutlined,
  SolutionOutlined,
  BookOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import { MENU_CONFIG } from '../../utils/constants';

const { Sider } = Layout;

const iconMap = {
  DashboardOutlined: <DashboardOutlined />,
  TeamOutlined: <TeamOutlined />,
  UserOutlined: <UserOutlined />,
  CalendarOutlined: <CalendarOutlined />,
  MessageOutlined: <MessageOutlined />,
  FormOutlined: <FormOutlined />,
  AlertOutlined: <AlertOutlined />,
  BankOutlined: <BankOutlined />,
  FileTextOutlined: <FileTextOutlined />,
  SolutionOutlined: <SolutionOutlined />,
  BookOutlined: <BookOutlined />,
};

export default function Sidebar({ collapsed, onCollapse }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const menuConfig = MENU_CONFIG[user?.vai_tro] || [];

  const menuItems = menuConfig
    .filter((item) => item.type !== 'divider')
    .map((item) => ({
      key: item.key,
      icon: iconMap[item.icon],
      label: item.label,
    }));

  // Thêm dividers nếu có
  const itemsWithDividers = [];
  menuConfig.forEach((item) => {
    if (item.type === 'divider') {
      itemsWithDividers.push({ type: 'divider' });
    } else {
      itemsWithDividers.push({
        key: item.key,
        icon: iconMap[item.icon],
        label: item.label,
      });
    }
  });

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={onCollapse}
      style={{
        overflow: 'auto',
        height: '100vh',
        position: 'sticky',
        top: 0,
        left: 0,
      }}
    >
      <div
        style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: collapsed ? 16 : 18,
          fontWeight: 'bold',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          padding: '0 16px',
        }}
      >
        {collapsed ? '🎓' : '🎓 English Center'}
      </div>
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[location.pathname]}
        items={itemsWithDividers}
        onClick={({ key }) => navigate(key)}
      />
    </Sider>
  );
}

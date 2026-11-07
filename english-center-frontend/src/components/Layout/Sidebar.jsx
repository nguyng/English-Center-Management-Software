import { useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Drawer, Typography, Tag } from 'antd';
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
  TrophyOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import { MENU_CONFIG, ROLES } from '../../utils/constants';

const { Sider } = Layout;
const { Text } = Typography;

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
  TrophyOutlined: <TrophyOutlined />,
};

const roleWorkspaceName = {
  [ROLES.SUPER_ADMIN]: 'SaaS Cloud Control',
  [ROLES.ADMIN]: 'Quản Trị Trung Tâm',
  [ROLES.GIAO_VIEN]: 'Cổng Giảng Viên',
};

export default function Sidebar({ collapsed, onCollapse, isMobile, mobileOpen, onMobileClose }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const menuConfig = MENU_CONFIG[user?.vai_tro] || [];

  const itemsWithDividers = menuConfig.map((item, idx) => {
    if (item.type === 'divider') {
      return { type: 'divider', key: `divider-${idx}` };
    }
    return {
      key: item.key,
      icon: iconMap[item.icon],
      label: item.label,
    };
  });

  const handleMenuClick = ({ key }) => {
    navigate(key);
    if (isMobile && onMobileClose) {
      onMobileClose();
    }
  };

  const renderBrandHeader = (isCollapsed) => (
    <div
      onClick={() => handleMenuClick({ key: user?.vai_tro === ROLES.GIAO_VIEN ? '/my-classes' : '/dashboard' })}
      style={{
        height: 72,
        display: 'flex',
        alignItems: 'center',
        justifyContent: isCollapsed ? 'center' : 'flex-start',
        gap: 12,
        padding: isCollapsed ? '0 8px' : '0 20px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        cursor: 'pointer',
        userSelect: 'none',
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          background: 'linear-gradient(135deg, #38bdf8 0%, #f97316 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: 20,
          fontWeight: 800,
          boxShadow: '0 4px 12px rgba(56, 189, 248, 0.3)',
          flexShrink: 0,
        }}
      >
        <BookOutlined />
      </div>
      {!isCollapsed && (
        <div style={{ overflow: 'hidden', lineHeight: 1.25 }}>
          <div
            style={{
              color: '#ffffff',
              fontSize: 17,
              fontWeight: 800,
              letterSpacing: '-0.02em',
              whiteSpace: 'nowrap',
            }}
          >
            EduPrime <span style={{ color: '#38bdf8' }}>English</span>
          </div>
          <div
            style={{
              color: '#94a3b8',
              fontSize: 11.5,
              fontWeight: 500,
              whiteSpace: 'nowrap',
              marginTop: 2,
            }}
          >
            {roleWorkspaceName[user?.vai_tro] || 'EdTech Management'}
          </div>
        </div>
      )}
    </div>
  );

  const renderFooterCard = (isCollapsed) => {
    if (isCollapsed) return null;
    return (
      <div
        style={{
          margin: '16px 14px 20px',
          padding: '14px 16px',
          borderRadius: 12,
          background: 'rgba(255, 255, 255, 0.06)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <SafetyCertificateOutlined style={{ color: '#38bdf8', fontSize: 16 }} />
          <Text style={{ color: '#f8fafc', fontSize: 12.5, fontWeight: 600 }}>
            Zalo ZNS Automation
          </Text>
        </div>
        <div style={{ color: '#94a3b8', fontSize: 11.5, lineHeight: 1.45, marginBottom: 8 }}>
          Hệ thống tự động kiểm tra & báo tin phụ huynh lúc 21:00.
        </div>
        <Tag
          color="success"
          style={{
            margin: 0,
            fontSize: 11,
            borderRadius: 6,
            background: 'rgba(16, 185, 129, 0.15)',
            borderColor: 'rgba(16, 185, 129, 0.35)',
            color: '#34d399',
          }}
        >
          ● Đang hoạt động ổn định
        </Tag>
      </div>
    );
  };

  if (isMobile) {
    return (
      <Drawer
        placement="left"
        open={mobileOpen}
        onClose={onMobileClose}
        width={260}
        styles={{
          body: {
            padding: 0,
            background: 'linear-gradient(180deg, #0f2557 0%, #172554 60%, #0f172a 100%)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          },
          header: { display: 'none' },
        }}
        className="edtech-sider"
      >
        <div>
          {renderBrandHeader(false)}
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[location.pathname]}
            items={itemsWithDividers}
            onClick={handleMenuClick}
            style={{ background: 'transparent', borderInlineEnd: 'none', padding: '12px 10px' }}
          />
        </div>
        {renderFooterCard(false)}
      </Drawer>
    );
  }

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={onCollapse}
      width={256}
      collapsedWidth={76}
      className="edtech-sider"
      style={{
        overflow: 'auto',
        height: '100vh',
        position: 'sticky',
        top: 0,
        left: 0,
        zIndex: 20,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 48px)', justifyContent: 'space-between' }}>
        <div>
          {renderBrandHeader(collapsed)}
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[location.pathname]}
            items={itemsWithDividers}
            onClick={handleMenuClick}
            style={{ borderInlineEnd: 'none', marginTop: 8 }}
          />
        </div>
        {renderFooterCard(collapsed)}
      </div>
    </Sider>
  );
}

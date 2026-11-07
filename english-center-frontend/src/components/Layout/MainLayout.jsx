import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Layout, Grid } from 'antd';
import Sidebar from './Sidebar';
import Header from './Header';

const { Content, Footer } = Layout;
const { useBreakpoint } = Grid;
const CURRENT_YEAR = new Date().getFullYear();

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const screens = useBreakpoint();
  const isMobile = !screens.lg;

  return (
    <Layout style={{ minHeight: '100vh', background: 'var(--color-bg-canvas)' }}>
      <Sidebar
        collapsed={collapsed}
        onCollapse={setCollapsed}
        isMobile={isMobile}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />
      <Layout style={{ background: 'var(--color-bg-canvas)', minWidth: 0 }}>
        <Header
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((prev) => !prev)}
          isMobile={isMobile}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
        />
        <Content
          style={{
            padding: isMobile ? '16px' : '24px 28px',
            maxWidth: 1440,
            width: '100%',
            margin: '0 auto',
            minHeight: 'calc(100vh - 132px)',
          }}
        >
          <div className="animate-fade-up">
            <Outlet />
          </div>
        </Content>
        <Footer
          style={{
            textAlign: 'center',
            background: 'transparent',
            color: '#64748b',
            fontSize: 13,
            padding: '16px 24px 24px',
            borderTop: '1px solid #e2e8f0',
          }}
        >
          <strong>EduPrime English Center</strong> — Hệ thống Quản trị Đào tạo & Tự động hóa Zalo ZNS © {CURRENT_YEAR}
        </Footer>
      </Layout>
    </Layout>
  );
}

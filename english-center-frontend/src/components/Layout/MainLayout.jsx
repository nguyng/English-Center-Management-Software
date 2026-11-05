import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Layout } from 'antd';
import Sidebar from './Sidebar';
import Header from './Header';

const { Content } = Layout;

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sidebar collapsed={collapsed} onCollapse={setCollapsed} />
      <Layout>
        <Header />
        <Content
          style={{
            margin: '24px 16px',
            padding: 24,
            background: '#fff',
            borderRadius: 8,
            minHeight: 360,
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}

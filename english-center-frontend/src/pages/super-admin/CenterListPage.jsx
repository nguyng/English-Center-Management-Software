import { useState } from 'react';
import {
  Table,
  Button,
  Space,
  Input,
  Modal,
  Form,
  Typography,
  Tag,
  App as AntApp,
  DatePicker,
  Row,
  Col,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  KeyOutlined,
  CalendarOutlined,
  BankOutlined,
  CheckCircleOutlined,
  ApiOutlined,
} from '@ant-design/icons';
import { formatDate, formatPhone } from '../../utils/formatters';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const initialCenters = [
  {
    id: 1,
    ten_trung_tam: 'Anh Ngữ Cleverlearn Cầu Giấy',
    sdt_admin: '0988776655',
    ngay_het_han_saas: '2027-11-05',
    trang_thai_ban_quyen: 'HoatDong',
    zalo_oa_id: '123456789012345',
  },
  {
    id: 2,
    ten_trung_tam: 'Anh Ngữ Apollo Ba Đình',
    sdt_admin: '0977665544',
    ngay_het_han_saas: '2026-12-31',
    trang_thai_ban_quyen: 'HoatDong',
    zalo_oa_id: '987654321098765',
  },
  {
    id: 3,
    ten_trung_tam: 'Trung Tâm Tiếng Anh SmartKids',
    sdt_admin: '0911223344',
    ngay_het_han_saas: '2026-10-01',
    trang_thai_ban_quyen: 'HetHan',
    zalo_oa_id: '',
  },
];

export default function CenterListPage() {
  const [centers, setCenters] = useState(initialCenters);
  const [searchText, setSearchText] = useState('');
  const [zaloModalOpen, setZaloModalOpen] = useState(false);
  const [newCenterModalOpen, setNewCenterModalOpen] = useState(false);
  const [currentCenter, setCurrentCenter] = useState(null);
  const [form] = Form.useForm();
  const [addForm] = Form.useForm();
  const { message } = AntApp.useApp();

  const filtered = centers.filter(
    (c) =>
      c.ten_trung_tam.toLowerCase().includes(searchText.toLowerCase()) ||
      c.sdt_admin.includes(searchText)
  );

  const handleRenew = (center) => {
    Modal.confirm({
      title: `Gia hạn bản quyền phần mềm SaaS (1 năm)`,
      content: `Gia hạn bản quyền cho ${center.ten_trung_tam} thêm 365 ngày?`,
      okText: 'Xác nhận gia hạn',
      onOk: () => {
        setCenters((prev) =>
          prev.map((c) =>
            c.id === center.id
              ? {
                  ...c,
                  ngay_het_han_saas: dayjs(c.ngay_het_han_saas).add(1, 'year').format('YYYY-MM-DD'),
                  trang_thai_ban_quyen: 'HoatDong',
                }
              : c
          )
        );
        message.success('Đã gia hạn bản quyền 1 năm thành công!');
      },
    });
  };

  const handleConfigZalo = (center) => {
    setCurrentCenter(center);
    form.setFieldsValue({
      zalo_oa_id: center.zalo_oa_id || '',
    });
    setZaloModalOpen(true);
  };

  const handleCreateCenter = async () => {
    try {
      const values = await addForm.validateFields();
      const newCenter = {
        id: Date.now(),
        ten_trung_tam: values.ten_trung_tam,
        sdt_admin: values.sdt_admin,
        ngay_het_han_saas: values.ngay_het_han_saas
          ? values.ngay_het_han_saas.format('YYYY-MM-DD')
          : dayjs().add(1, 'year').format('YYYY-MM-DD'),
        trang_thai_ban_quyen: 'HoatDong',
        zalo_oa_id: values.zalo_oa_id || '',
      };
      setCenters((prev) => [newCenter, ...prev]);
      message.success('Thêm trung tâm đối tác mới thành công!');
      setNewCenterModalOpen(false);
      addForm.resetFields();
    } catch {}
  };

  const columns = [
    {
      title: 'STT',
      key: 'stt',
      render: (_, __, i) => <Text type="secondary">{i + 1}</Text>,
      width: 60,
      align: 'center',
    },
    {
      title: 'Tên Trung Tâm Đối Tác',
      dataIndex: 'ten_trung_tam',
      key: 'name',
      render: (t) => (
        <Space size={10}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: '#eff6ff',
              color: '#1e3a8a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <BankOutlined />
          </div>
          <Text strong style={{ fontSize: 14.5, color: '#0f172a' }}>
            {t}
          </Text>
        </Space>
      ),
    },
    {
      title: 'SĐT Giám Đốc / Admin',
      dataIndex: 'sdt_admin',
      key: 'phone',
      width: 165,
      render: (p) => <Text style={{ fontFamily: 'monospace' }}>{formatPhone(p)}</Text>,
    },
    {
      title: 'Hạn Dùng Bản Quyền',
      dataIndex: 'ngay_het_han_saas',
      key: 'expire',
      width: 160,
      render: (d) => <Text strong>{formatDate(d)}</Text>,
    },
    {
      title: 'Bản Quyền SaaS',
      dataIndex: 'trang_thai_ban_quyen',
      key: 'status',
      width: 150,
      render: (s) =>
        s === 'HoatDong' ? (
          <Tag color="success" icon={<CheckCircleOutlined />}>
            Đang Hoạt Động
          </Tag>
        ) : (
          <Tag color="error">Hết Hạn</Tag>
        ),
    },
    {
      title: 'Kết nối Zalo OA',
      dataIndex: 'zalo_oa_id',
      key: 'zalo',
      width: 150,
      render: (z) =>
        z ? (
          <Tag color="geekblue" icon={<ApiOutlined />}>
            OA Đã Kết Nối
          </Tag>
        ) : (
          <Tag color="default">Mock Demo</Tag>
        ),
    },
    {
      title: 'Thao tác Super Admin',
      key: 'action',
      width: 240,
      align: 'right',
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<CalendarOutlined />} onClick={() => handleRenew(record)}>
            Gia hạn
          </Button>
          <Button size="small" type="primary" ghost icon={<KeyOutlined />} onClick={() => handleConfigZalo(record)}>
            Token Zalo
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="edtech-page-header">
        <div>
          <Space align="center" size={10}>
            <Title level={4} style={{ margin: 0, fontWeight: 800 }}>
              Quản Trị Hệ Thống Multi-Tenant SaaS
            </Title>
            <Tag color="gold">Super Admin</Tag>
          </Space>
          <Text type="secondary" style={{ display: 'block', marginTop: 4 }}>
            Cấp phát bản quyền phần mềm theo năm và cấu hình kết nối Zalo Official Account (OA) cho từng đối tác.
          </Text>
        </div>
        <Button
          type="primary"
          className="btn-cta-orange"
          size="large"
          icon={<PlusOutlined />}
          onClick={() => {
            addForm.resetFields();
            setNewCenterModalOpen(true);
          }}
        >
          Thêm trung tâm đối tác
        </Button>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={8}>
          <div className="edtech-stat-card" style={{ padding: '14px 18px' }}>
            <div>
              <Text type="secondary">Tổng Trung tâm Đối tác</Text>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#1e3a8a' }}>{centers.length}</div>
            </div>
            <div className="edtech-stat-icon" style={{ width: 42, height: 42, fontSize: 18, background: '#eff6ff', color: '#1e3a8a' }}>
              <BankOutlined />
            </div>
          </div>
        </Col>
        <Col xs={24} sm={8}>
          <div className="edtech-stat-card" style={{ padding: '14px 18px' }}>
            <div>
              <Text type="secondary">Bản quyền Đang hoạt động</Text>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#10b981' }}>
                {centers.filter((c) => c.trang_thai_ban_quyen === 'HoatDong').length}
              </div>
            </div>
            <div className="edtech-stat-icon" style={{ width: 42, height: 42, fontSize: 18, background: '#ecfdf5', color: '#10b981' }}>
              <CheckCircleOutlined />
            </div>
          </div>
        </Col>
        <Col xs={24} sm={8}>
          <div className="edtech-stat-card" style={{ padding: '14px 18px' }}>
            <div>
              <Text type="secondary">Đã tích hợp Zalo OA</Text>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#0284c7' }}>
                {centers.filter((c) => c.zalo_oa_id).length}
              </div>
            </div>
            <div className="edtech-stat-icon" style={{ width: 42, height: 42, fontSize: 18, background: '#f0f9ff', color: '#0284c7' }}>
              <ApiOutlined />
            </div>
          </div>
        </Col>
      </Row>

      <div className="edtech-table-wrapper">
        <div className="edtech-filter-bar" style={{ border: 'none', borderBottom: '1px solid #f1f5f9' }}>
          <Input
            placeholder="Tìm kiếm trung tâm theo tên hoặc SĐT..."
            prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 340, maxWidth: '100%' }}
            allowClear
          />
          <Text type="secondary" style={{ fontSize: 13 }}>
            Hiển thị <strong>{filtered.length}</strong> trung tâm
          </Text>
        </div>

        <Table
          dataSource={filtered}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          scroll={{ x: 920 }}
        />
      </div>

      {/* Modal Thêm trung tâm mới */}
      <Modal
        open={newCenterModalOpen}
        onCancel={() => setNewCenterModalOpen(false)}
        onOk={handleCreateCenter}
        title="🏢 Thêm Trung Tâm Đối Tác Mới"
        okText="Tạo trung tâm"
        cancelText="Đóng"
      >
        <Form form={addForm} layout="vertical" initialValues={{ ngay_het_han_saas: dayjs().add(1, 'year') }} style={{ marginTop: 12 }}>
          <Form.Item
            name="ten_trung_tam"
            label="Tên Trung Tâm"
            rules={[{ required: true, message: 'Vui lòng nhập tên trung tâm!' }]}
          >
            <Input placeholder="Ví dụ: Anh Ngữ VUS Cầu Giấy" />
          </Form.Item>
          <Form.Item
            name="sdt_admin"
            label="SĐT Quản lý / Giám đốc"
            rules={[{ required: true, message: 'Vui lòng nhập số điện thoại!' }]}
          >
            <Input placeholder="0987654321" />
          </Form.Item>
          <Form.Item name="ngay_het_han_saas" label="Hạn dùng bản quyền">
            <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="zalo_oa_id" label="Zalo OA ID (Tùy chọn)">
            <Input placeholder="Để trống nếu đang dùng chế độ Mock Demo" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal Cấu hình Zalo OA */}
      <Modal
        open={zaloModalOpen}
        onCancel={() => setZaloModalOpen(false)}
        title={`🔑 Cấu hình Zalo ZNS Token: ${currentCenter?.ten_trung_tam}`}
        okText="Lưu cấu hình"
        cancelText="Đóng"
        onOk={async () => {
          const values = await form.validateFields();
          setCenters((prev) =>
            prev.map((c) => (c.id === currentCenter.id ? { ...c, zalo_oa_id: values.zalo_oa_id } : c))
          );
          message.success('Cập nhật Zalo Access Token thành công!');
          setZaloModalOpen(false);
        }}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 12 }}>
          <Form.Item
            name="zalo_oa_id"
            label="Zalo OA ID"
            rules={[{ required: true, message: 'Vui lòng nhập Zalo OA ID' }]}
          >
            <Input placeholder="Ví dụ: 123456789012345" />
          </Form.Item>
          <Form.Item name="zalo_app_id" label="Zalo App ID">
            <Input placeholder="App ID do Zalo Developer cấp" />
          </Form.Item>
          <Form.Item name="zalo_secret_key" label="Secret Key">
            <Input.Password placeholder="Secret key để refresh token" />
          </Form.Item>
          <Form.Item name="zalo_access_token" label="Access Token">
            <Input.TextArea rows={3} placeholder="Access token còn hiệu lực..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

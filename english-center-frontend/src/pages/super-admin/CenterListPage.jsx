import { useState } from 'react';
import { Table, Button, Space, Input, Modal, Form, Typography, Tag, App as AntApp, DatePicker } from 'antd';
import { PlusOutlined, SearchOutlined, KeyOutlined, CalendarOutlined, BankOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { formatDate } from '../../utils/formatters';
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
        ngay_het_han_saas: values.ngay_het_han_saas ? values.ngay_het_han_saas.format('YYYY-MM-DD') : dayjs().add(1, 'year').format('YYYY-MM-DD'),
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
    { title: 'STT', key: 'stt', render: (_, __, i) => i + 1, width: 50, align: 'center' },
    {
      title: 'Tên Trung Tâm Khách Hàng',
      dataIndex: 'ten_trung_tam',
      key: 'name',
      render: (t) => (
        <Space>
          <BankOutlined style={{ color: '#1890ff' }} />
          <strong>{t}</strong>
        </Space>
      ),
    },
    { title: 'SĐT Giám Đốc/Admin', dataIndex: 'sdt_admin', key: 'phone', width: 160 },
    {
      title: 'Hạn Dùng Bản Quyền',
      dataIndex: 'ngay_het_han_saas',
      key: 'expire',
      width: 160,
      render: (d) => formatDate(d),
    },
    {
      title: 'Bản Quyền SaaS',
      dataIndex: 'trang_thai_ban_quyen',
      key: 'status',
      width: 140,
      render: (s) =>
        s === 'HoatDong' ? <Tag color="green">Đang Hoạt Động</Tag> : <Tag color="red">Hết Hạn</Tag>,
    },
    {
      title: 'Zalo OA',
      dataIndex: 'zalo_oa_id',
      key: 'zalo',
      width: 140,
      render: (z) => (z ? <Tag color="blue">Đã kết nối</Tag> : <Tag color="default">Mock Demo</Tag>),
    },
    {
      title: 'Thao tác Super Admin',
      key: 'action',
      width: 240,
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<CalendarOutlined />} onClick={() => handleRenew(record)}>
            Gia hạn
          </Button>
          <Button size="small" icon={<KeyOutlined />} onClick={() => handleConfigZalo(record)}>
            Token Zalo
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>👑 Quản Trị Hệ Thống Multi-Tenant SaaS</Title>
          <Text type="secondary">Cấp phát bản quyền theo năm và cấu hình kết nối Zalo OA cho từng đối tác</Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            addForm.resetFields();
            setNewCenterModalOpen(true);
          }}
        >
          Thêm trung tâm đối tác
        </Button>
      </div>

      <Input
        placeholder="Tìm kiếm trung tâm theo tên hoặc SĐT..."
        prefix={<SearchOutlined />}
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        style={{ marginBottom: 16, maxWidth: 360 }}
        allowClear
      />

      <Table dataSource={filtered} columns={columns} rowKey="id" pagination={{ pageSize: 10 }} />

      {/* Modal Thêm trung tâm mới */}
      <Modal
        open={newCenterModalOpen}
        onCancel={() => setNewCenterModalOpen(false)}
        onOk={handleCreateCenter}
        title="🏢 Thêm Trung Tâm Đối Tác Mới"
        okText="Tạo trung tâm"
        cancelText="Đóng"
      >
        <Form form={addForm} layout="vertical" initialValues={{ ngay_het_han_saas: dayjs().add(1, 'year') }}>
          <Form.Item name="ten_trung_tam" label="Tên Trung Tâm" rules={[{ required: true, message: 'Vui lòng nhập tên trung tâm!' }]}>
            <Input placeholder="Ví dụ: Anh Ngữ VUS Cầu Giấy" />
          </Form.Item>
          <Form.Item name="sdt_admin" label="SĐT Quản lý / Giám đốc" rules={[{ required: true, message: 'Vui lòng nhập số điện thoại!' }]}>
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
        title={`Cấu hình Zalo ZNS Token: ${currentCenter?.ten_trung_tam}`}
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
        <Form form={form} layout="vertical">
          <Form.Item name="zalo_oa_id" label="Zalo OA ID" rules={[{ required: true, message: 'Vui lòng nhập Zalo OA ID' }]}>
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

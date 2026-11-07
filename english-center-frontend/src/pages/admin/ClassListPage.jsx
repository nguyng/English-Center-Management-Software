import { useState } from 'react';
import {
  Table,
  Button,
  Space,
  Input,
  Modal,
  Form,
  Select,
  Typography,
  App as AntApp,
  Tag,
  Progress,
  Avatar,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  BookOutlined,
  UserOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

const initialClasses = [
  { id: 1, ma_lop: 'A1-2026', ten_lop: 'Lớp A1 - Starter', giao_vien: 'Nguyễn Văn A', so_hoc_sinh: 18 },
  { id: 2, ma_lop: 'B2-2026', ten_lop: 'Lớp B2 - Intermediate', giao_vien: 'Trần Thị B', so_hoc_sinh: 15 },
  { id: 3, ma_lop: 'C1-2026', ten_lop: 'Lớp C1 - Advanced', giao_vien: 'Lê Hoàng C', so_hoc_sinh: 12 },
];

export default function ClassListPage() {
  const [classes, setClasses] = useState(initialClasses);
  const [searchText, setSearchText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [form] = Form.useForm();
  const { message } = AntApp.useApp();

  const filteredClasses = classes.filter(
    (c) =>
      c.ten_lop.toLowerCase().includes(searchText.toLowerCase()) ||
      c.ma_lop.toLowerCase().includes(searchText.toLowerCase()) ||
      c.giao_vien.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns = [
    {
      title: 'Mã lớp',
      dataIndex: 'ma_lop',
      key: 'ma_lop',
      width: 140,
      render: (code) => (
        <Tag color="geekblue" style={{ fontWeight: 700, borderRadius: 6, fontSize: 13 }}>
          {code}
        </Tag>
      ),
    },
    {
      title: 'Tên lớp đào tạo',
      dataIndex: 'ten_lop',
      key: 'ten_lop',
      render: (name) => (
        <Space size={10}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              background: '#eff6ff',
              color: '#1e3a8a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <BookOutlined />
          </div>
          <Text strong style={{ fontSize: 14.5, color: '#0f172a' }}>
            {name}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Giảng viên phụ trách',
      dataIndex: 'giao_vien',
      key: 'giao_vien',
      render: (teacher) => (
        <Space>
          <Avatar size="small" icon={<UserOutlined />} style={{ backgroundColor: '#0284c7' }} />
          <Text>{teacher}</Text>
        </Space>
      ),
    },
    {
      title: 'Sĩ số học viên',
      dataIndex: 'so_hoc_sinh',
      key: 'so_hoc_sinh',
      width: 220,
      render: (count) => {
        const pct = Math.min(100, Math.round((count / 20) * 100));
        return (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 2 }}>
              <Text strong>{count} học viên</Text>
              <Text type="secondary">Tối đa 20</Text>
            </div>
            <Progress percent={pct} size="small" showInfo={false} strokeColor="#0284c7" />
          </div>
        );
      },
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 180,
      align: 'right',
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingClass(record);
              form.setFieldsValue(record);
              setModalOpen(true);
            }}
          >
            Sửa
          </Button>
          <Button
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => {
              Modal.confirm({
                title: 'Xóa lớp học?',
                content: `Bạn chắc chắn muốn xóa lớp ${record.ten_lop}?`,
                okText: 'Xóa',
                cancelText: 'Hủy',
                okButtonProps: { danger: true },
                onOk: () => {
                  setClasses((prev) => prev.filter((c) => c.id !== record.id));
                  message.success('Đã xóa lớp!');
                },
              });
            }}
          >
            Xóa
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
              Quản Lý Lớp Học & Chương Trình Đào Tạo
            </Title>
            <Tag color="cyan">{classes.length} lớp đang mở</Tag>
          </Space>
          <Text type="secondary" style={{ display: 'block', marginTop: 4 }}>
            Tổ chức lớp học theo chuẩn khung tham chiếu châu Âu (CEFR A1 • B2 • C1) và phân công giảng viên chủ nhiệm.
          </Text>
        </div>
        <Button
          type="primary"
          className="btn-cta-orange"
          size="large"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingClass(null);
            form.resetFields();
            setModalOpen(true);
          }}
        >
          Tạo lớp mới
        </Button>
      </div>

      <div className="edtech-table-wrapper">
        <div className="edtech-filter-bar" style={{ border: 'none', borderBottom: '1px solid #f1f5f9' }}>
          <Input
            placeholder="Tìm kiếm lớp theo mã lớp, tên lớp hoặc giảng viên..."
            prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 340, maxWidth: '100%' }}
            allowClear
          />
          <Text type="secondary" style={{ fontSize: 13 }}>
            Tổng cộng: <strong>{filteredClasses.length}</strong> lớp học
          </Text>
        </div>

        <Table
          dataSource={filteredClasses}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 8 }}
          scroll={{ x: 760 }}
        />
      </div>

      <Modal
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={async () => {
          const values = await form.validateFields();
          if (editingClass) {
            setClasses((prev) => prev.map((c) => (c.id === editingClass.id ? { ...c, ...values } : c)));
            message.success('Cập nhật thông tin lớp thành công!');
          } else {
            setClasses((prev) => [...prev, { id: Date.now(), ...values, so_hoc_sinh: 0 }]);
            message.success('Tạo lớp mới thành công!');
          }
          setModalOpen(false);
        }}
        title={editingClass ? '✏️ Cập nhật thông tin lớp học' : '🏫 Tạo lớp học mới'}
        okText="Lưu lại"
        cancelText="Đóng"
      >
        <Form form={form} layout="vertical" style={{ marginTop: 12 }}>
          <Form.Item name="ma_lop" label="Mã lớp" rules={[{ required: true, message: 'Nhập mã lớp!' }]}>
            <Input placeholder="Ví dụ: A1-2026" />
          </Form.Item>
          <Form.Item name="ten_lop" label="Tên lớp học" rules={[{ required: true, message: 'Nhập tên lớp!' }]}>
            <Input placeholder="Ví dụ: Lớp A1 - Starter" />
          </Form.Item>
          <Form.Item
            name="giao_vien"
            label="Giáo viên phụ trách"
            rules={[{ required: true, message: 'Chọn giáo viên!' }]}
          >
            <Select placeholder="Chọn giáo viên">
              <Select.Option value="Nguyễn Văn A">Nguyễn Văn A</Select.Option>
              <Select.Option value="Trần Thị B">Trần Thị B</Select.Option>
              <Select.Option value="Lê Hoàng C">Lê Hoàng C</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

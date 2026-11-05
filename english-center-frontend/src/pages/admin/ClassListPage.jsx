import { useState } from 'react';
import { Table, Button, Space, Input, Modal, Form, Select, Typography, App as AntApp } from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';

const { Title } = Typography;

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

  const filteredClasses = classes.filter((c) =>
    c.ten_lop.toLowerCase().includes(searchText.toLowerCase()) ||
    c.ma_lop.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns = [
    { title: 'Mã lớp', dataIndex: 'ma_lop', key: 'ma_lop', width: 140 },
    { title: 'Tên lớp học', dataIndex: 'ten_lop', key: 'ten_lop' },
    { title: 'Giáo viên phụ trách', dataIndex: 'giao_vien', key: 'giao_vien' },
    { title: 'Sĩ số', dataIndex: 'so_hoc_sinh', key: 'so_hoc_sinh', width: 100, align: 'center' },
    {
      title: 'Hành động',
      key: 'action',
      width: 180,
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => {
            setEditingClass(record);
            form.setFieldsValue(record);
            setModalOpen(true);
          }}>
            Sửa
          </Button>
          <Button size="small" danger icon={<DeleteOutlined />} onClick={() => {
            Modal.confirm({
              title: 'Xóa lớp học?',
              content: `Bạn chắc chắn muốn xóa lớp ${record.ten_lop}?`,
              okText: 'Xóa',
              cancelText: 'Hủy',
              okButtonProps: { danger: true },
              onOk: () => {
                setClasses(prev => prev.filter(c => c.id !== record.id));
                message.success('Đã xóa lớp!');
              }
            });
          }}>
            Xóa
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>🏫 Quản Lý Lớp Học</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingClass(null); form.resetFields(); setModalOpen(true); }}>
          Tạo lớp mới
        </Button>
      </div>

      <Input
        placeholder="Tìm kiếm lớp theo mã hoặc tên..."
        prefix={<SearchOutlined />}
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        style={{ marginBottom: 16, maxWidth: 360 }}
        allowClear
      />

      <Table dataSource={filteredClasses} columns={columns} rowKey="id" pagination={{ pageSize: 8 }} />

      <Modal
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={async () => {
          const values = await form.validateFields();
          if (editingClass) {
            setClasses(prev => prev.map(c => c.id === editingClass.id ? { ...c, ...values } : c));
            message.success('Cập nhật thông tin lớp thành công!');
          } else {
            setClasses(prev => [...prev, { id: Date.now(), ...values, so_hoc_sinh: 0 }]);
            message.success('Tạo lớp mới thành công!');
          }
          setModalOpen(false);
        }}
        title={editingClass ? 'Cập nhật thông tin lớp' : 'Tạo lớp học mới'}
        okText="Lưu lại"
        cancelText="Đóng"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="ma_lop" label="Mã lớp" rules={[{ required: true, message: 'Nhập mã lớp!' }]}>
            <Input placeholder="Ví dụ: A1-2026" />
          </Form.Item>
          <Form.Item name="ten_lop" label="Tên lớp học" rules={[{ required: true, message: 'Nhập tên lớp!' }]}>
            <Input placeholder="Ví dụ: Lớp A1 - Starter" />
          </Form.Item>
          <Form.Item name="giao_vien" label="Giáo viên phụ trách" rules={[{ required: true, message: 'Chọn giáo viên!' }]}>
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


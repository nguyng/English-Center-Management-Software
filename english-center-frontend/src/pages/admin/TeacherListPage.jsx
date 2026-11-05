import { useState } from 'react';
import { Table, Button, Space, Input, Modal, Form, Typography, Tag, App as AntApp } from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined, UserOutlined } from '@ant-design/icons';

const { Title } = Typography;

const initialTeachers = [
  { id: 1, ho_ten: 'Nguyễn Văn A', email: 'teacher.a@english.edu.vn', sdt: '0909112233', trang_thai: 'HoatDong', lop_phu_trach: ['Lớp A1 - Starter'] },
  { id: 2, ho_ten: 'Trần Thị B', email: 'teacher.b@english.edu.vn', sdt: '0909223344', trang_thai: 'HoatDong', lop_phu_trach: ['Lớp B2 - Intermediate'] },
  { id: 3, ho_ten: 'Lê Hoàng C', email: 'teacher.c@english.edu.vn', sdt: '0909334455', trang_thai: 'Khoa', lop_phu_trach: ['Lớp C1 - Advanced'] },
];

export default function TeacherListPage() {
  const [teachers, setTeachers] = useState(initialTeachers);
  const [searchText, setSearchText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [form] = Form.useForm();
  const { message } = AntApp.useApp();

  const columns = [
    { title: 'STT', key: 'stt', render: (_, __, i) => i + 1, width: 60, align: 'center' },
    { title: 'Họ tên Giáo viên', dataIndex: 'ho_ten', key: 'name', render: (n) => <Space><UserOutlined /><strong>{n}</strong></Space> },
    { title: 'Email đăng nhập', dataIndex: 'email', key: 'email' },
    { title: 'Số điện thoại', dataIndex: 'sdt', key: 'sdt' },
    { title: 'Lớp phụ trách', dataIndex: 'lop_phu_trach', key: 'lop', render: (lops) => lops?.map((l) => <Tag color="blue" key={l}>{l}</Tag>) },
    { title: 'Trạng thái', dataIndex: 'trang_thai', key: 'tt', render: (s) => s === 'HoatDong' ? <Tag color="green">Hoạt động</Tag> : <Tag color="red">Đã khóa</Tag> },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => (
        <Button size="small" icon={<EditOutlined />} onClick={() => {
          setEditingTeacher(record);
          form.setFieldsValue(record);
          setModalOpen(true);
        }}>
          Sửa
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>👨‍🏫 Quản Lý Đội Ngũ Giáo Viên</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingTeacher(null); form.resetFields(); setModalOpen(true); }}>
          Tạo tài khoản Giáo viên
        </Button>
      </div>

      <Input
        placeholder="Tìm kiếm theo tên, email giáo viên..."
        prefix={<SearchOutlined />}
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        style={{ marginBottom: 16, maxWidth: 360 }}
        allowClear
      />

      <Table dataSource={teachers} columns={columns} rowKey="id" pagination={{ pageSize: 8 }} />

      <Modal
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={async () => {
          const values = await form.validateFields();
          if (editingTeacher) {
            setTeachers(prev => prev.map(t => t.id === editingTeacher.id ? { ...t, ...values } : t));
            message.success('Cập nhật tài khoản giáo viên thành công!');
          } else {
            setTeachers(prev => [...prev, { id: Date.now(), ...values, trang_thai: 'HoatDong', lop_phu_trach: [] }]);
            message.success('Tạo tài khoản giáo viên thành công!');
          }
          setModalOpen(false);
        }}
        title={editingTeacher ? 'Cập nhật tài khoản' : 'Tạo mới tài khoản Giáo viên'}
        okText="Lưu lại"
        cancelText="Đóng"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="ho_ten" label="Họ tên Giáo viên" rules={[{ required: true, message: 'Nhập họ tên!' }]}>
            <Input placeholder="Ví dụ: Nguyễn Văn A" />
          </Form.Item>
          <Form.Item name="email" label="Email đăng nhập" rules={[{ required: true, message: 'Nhập email!' }, { type: 'email', message: 'Email không hợp lệ!' }]}>
            <Input placeholder="teacher@english.edu.vn" />
          </Form.Item>
          <Form.Item name="sdt" label="Số điện thoại" rules={[{ required: true, message: 'Nhập SĐT!' }]}>
            <Input placeholder="0901234567" />
          </Form.Item>
          <Form.Item name="password" label="Mật khẩu khởi tạo">
            <Input.Password placeholder={editingTeacher ? 'Để trống nếu giữ nguyên' : 'Nhập mật khẩu ban đầu'} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}


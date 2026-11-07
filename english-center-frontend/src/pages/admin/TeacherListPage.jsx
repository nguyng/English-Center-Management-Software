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
  Select,
  Avatar,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  UserOutlined,
  LockOutlined,
  UnlockOutlined,
  MailOutlined,
  PhoneOutlined,
} from '@ant-design/icons';
import { formatPhone } from '../../utils/formatters';

const { Title, Text } = Typography;

const initialTeachers = [
  {
    id: 1,
    ho_ten: 'Nguyễn Văn A',
    email: 'teacher.a@english.edu.vn',
    sdt: '0909112233',
    trang_thai: 'HoatDong',
    lop_phu_trach: ['Lớp A1 - Starter'],
  },
  {
    id: 2,
    ho_ten: 'Trần Thị B',
    email: 'teacher.b@english.edu.vn',
    sdt: '0909223344',
    trang_thai: 'HoatDong',
    lop_phu_trach: ['Lớp B2 - Intermediate'],
  },
  {
    id: 3,
    ho_ten: 'Lê Hoàng C',
    email: 'teacher.c@english.edu.vn',
    sdt: '0909334455',
    trang_thai: 'Khoa',
    lop_phu_trach: ['Lớp C1 - Advanced'],
  },
];

export default function TeacherListPage() {
  const [teachers, setTeachers] = useState(initialTeachers);
  const [searchText, setSearchText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [form] = Form.useForm();
  const { message } = AntApp.useApp();

  const filteredTeachers = teachers.filter(
    (t) =>
      t.ho_ten.toLowerCase().includes(searchText.toLowerCase()) ||
      t.email.toLowerCase().includes(searchText.toLowerCase()) ||
      t.sdt.includes(searchText)
  );

  const toggleStatus = (teacher) => {
    const nextStatus = teacher.trang_thai === 'HoatDong' ? 'Khoa' : 'HoatDong';
    setTeachers((prev) =>
      prev.map((t) => (t.id === teacher.id ? { ...t, trang_thai: nextStatus } : t))
    );
    message.success(`Đã ${nextStatus === 'Khoa' ? 'khóa' : 'kích hoạt'} tài khoản ${teacher.ho_ten}!`);
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
      title: 'Giảng viên',
      dataIndex: 'ho_ten',
      key: 'name',
      render: (n) => (
        <Space size={10}>
          <Avatar
            size={36}
            icon={<UserOutlined />}
            style={{ background: 'linear-gradient(135deg, #0284c7 0%, #1e3a8a 100%)' }}
          />
          <Text strong style={{ fontSize: 14, color: '#0f172a' }}>
            {n}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Email đăng nhập',
      dataIndex: 'email',
      key: 'email',
      render: (email) => (
        <Space size={6}>
          <MailOutlined style={{ color: '#64748b' }} />
          <Text>{email}</Text>
        </Space>
      ),
    },
    {
      title: 'Số điện thoại',
      dataIndex: 'sdt',
      key: 'sdt',
      render: (sdt) => (
        <Space size={6}>
          <PhoneOutlined style={{ color: '#0284c7' }} />
          <Text style={{ fontFamily: 'monospace' }}>{formatPhone(sdt)}</Text>
        </Space>
      ),
    },
    {
      title: 'Lớp phụ trách',
      dataIndex: 'lop_phu_trach',
      key: 'lop',
      render: (lops) =>
        lops?.map((l) => (
          <Tag color="geekblue" key={l} style={{ borderRadius: 6 }}>
            {l}
          </Tag>
        )),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'trang_thai',
      key: 'tt',
      width: 140,
      render: (s) =>
        s === 'HoatDong' ? (
          <Tag color="success">Đang giảng dạy</Tag>
        ) : (
          <Tag color="error">Tạm khóa</Tag>
        ),
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
              setEditingTeacher(record);
              form.setFieldsValue(record);
              setModalOpen(true);
            }}
          >
            Sửa
          </Button>
          <Button
            size="small"
            danger={record.trang_thai === 'HoatDong'}
            icon={record.trang_thai === 'HoatDong' ? <LockOutlined /> : <UnlockOutlined />}
            onClick={() => toggleStatus(record)}
          >
            {record.trang_thai === 'HoatDong' ? 'Khóa' : 'Mở'}
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
              Quản Lý Đội Ngũ Giảng Viên
            </Title>
            <Tag color="blue">{teachers.length} giảng viên</Tag>
          </Space>
          <Text type="secondary" style={{ display: 'block', marginTop: 4 }}>
            Quản lý tài khoản giảng viên, phân công lớp chủ nhiệm và quyền điểm danh / tạo đề kiểm tra.
          </Text>
        </div>
        <Button
          type="primary"
          className="btn-cta-orange"
          size="large"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingTeacher(null);
            form.resetFields();
            setModalOpen(true);
          }}
        >
          Tạo tài khoản Giáo viên
        </Button>
      </div>

      <div className="edtech-table-wrapper">
        <div className="edtech-filter-bar" style={{ border: 'none', borderBottom: '1px solid #f1f5f9' }}>
          <Input
            placeholder="Tìm kiếm theo tên, email, SĐT giáo viên..."
            prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 340, maxWidth: '100%' }}
            allowClear
          />
          <Text type="secondary" style={{ fontSize: 13 }}>
            Đang hoạt động:{' '}
            <strong>{teachers.filter((t) => t.trang_thai === 'HoatDong').length}</strong>/{teachers.length}
          </Text>
        </div>

        <Table
          dataSource={filteredTeachers}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 8 }}
          scroll={{ x: 820 }}
        />
      </div>

      <Modal
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={async () => {
          const values = await form.validateFields();
          if (editingTeacher) {
            setTeachers((prev) =>
              prev.map((t) => (t.id === editingTeacher.id ? { ...t, ...values } : t))
            );
            message.success('Cập nhật tài khoản giáo viên thành công!');
          } else {
            setTeachers((prev) => [
              ...prev,
              {
                id: Date.now(),
                ...values,
                trang_thai: 'HoatDong',
                lop_phu_trach: values.lop_phu_trach || [],
              },
            ]);
            message.success('Tạo tài khoản giáo viên thành công!');
          }
          setModalOpen(false);
        }}
        title={editingTeacher ? '✏️ Cập nhật tài khoản giảng viên' : '👨‍🏫 Tạo mới tài khoản Giảng viên'}
        okText="Lưu lại"
        cancelText="Đóng"
      >
        <Form form={form} layout="vertical" style={{ marginTop: 12 }}>
          <Form.Item
            name="ho_ten"
            label="Họ tên Giáo viên"
            rules={[{ required: true, message: 'Nhập họ tên!' }]}
          >
            <Input placeholder="Ví dụ: Nguyễn Văn A" />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email đăng nhập"
            rules={[
              { required: true, message: 'Nhập email!' },
              { type: 'email', message: 'Email không hợp lệ!' },
            ]}
          >
            <Input placeholder="teacher@english.edu.vn" />
          </Form.Item>
          <Form.Item name="sdt" label="Số điện thoại" rules={[{ required: true, message: 'Nhập SĐT!' }]}>
            <Input placeholder="0901234567" />
          </Form.Item>
          <Form.Item name="lop_phu_trach" label="Phân công lớp phụ trách">
            <Select mode="multiple" placeholder="Chọn các lớp phụ trách">
              <Select.Option value="Lớp A1 - Starter">Lớp A1 - Starter</Select.Option>
              <Select.Option value="Lớp B2 - Intermediate">Lớp B2 - Intermediate</Select.Option>
              <Select.Option value="Lớp C1 - Advanced">Lớp C1 - Advanced</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="password" label="Mật khẩu khởi tạo">
            <Input.Password
              placeholder={editingTeacher ? 'Để trống nếu giữ nguyên' : 'Nhập mật khẩu ban đầu'}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

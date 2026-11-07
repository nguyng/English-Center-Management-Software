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
  Avatar,
  Row,
  Col,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  UserSwitchOutlined,
  DeleteOutlined,
  PhoneOutlined,
  UserOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  PauseCircleOutlined,
} from '@ant-design/icons';
import PhoneInput from '../../components/PhoneInput';
import StatusBadge from '../../components/StatusBadge';
import { formatDate, formatPhone } from '../../utils/formatters';
import { isValidPhone } from '../../utils/validators';

const { Title, Text } = Typography;

const initialStudents = [
  { id: 1, ho_ten: 'Nguyễn Văn An', sdt_phu_huynh: '0901234567', lop: 'Lớp A1 - Starter', ngay_nhap_hoc: '2026-09-01', trang_thai: 'DangHoc' },
  { id: 2, ho_ten: 'Trần Thị Bảo', sdt_phu_huynh: '0912345678', lop: 'Lớp A1 - Starter', ngay_nhap_hoc: '2026-09-01', trang_thai: 'DangHoc' },
  { id: 3, ho_ten: 'Lê Hoàng Cường', sdt_phu_huynh: '0923456789', lop: 'Lớp B2 - Intermediate', ngay_nhap_hoc: '2026-08-15', trang_thai: 'BaoLuu' },
  { id: 4, ho_ten: 'Phạm Minh Đức', sdt_phu_huynh: '0934567890', lop: 'Lớp A1 - Starter', ngay_nhap_hoc: '2026-07-01', trang_thai: 'DaNghi' },
  { id: 5, ho_ten: 'Hoàng Thu Hà', sdt_phu_huynh: '0945678901', lop: 'Lớp A1 - Starter', ngay_nhap_hoc: '2026-09-10', trang_thai: 'DangHoc' },
];

export default function StudentListPage() {
  const [students, setStudents] = useState(initialStudents);
  const [searchText, setSearchText] = useState('');
  const [classFilter, setClassFilter] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [phoneVal, setPhoneVal] = useState('');
  const [form] = Form.useForm();
  const { message } = AntApp.useApp();

  const filteredStudents = students.filter((s) => {
    const matchSearch =
      s.ho_ten.toLowerCase().includes(searchText.toLowerCase()) ||
      s.sdt_phu_huynh.includes(searchText) ||
      s.lop.toLowerCase().includes(searchText.toLowerCase());
    const matchClass = !classFilter || s.lop === classFilter;
    return matchSearch && matchClass;
  });

  const activeCount = students.filter((s) => s.trang_thai === 'DangHoc').length;
  const reservedCount = students.filter((s) => s.trang_thai === 'BaoLuu').length;

  const columns = [
    {
      title: 'STT',
      key: 'stt',
      render: (_, __, idx) => <Text type="secondary">{idx + 1}</Text>,
      width: 64,
      align: 'center',
    },
    {
      title: 'Họ và tên học viên',
      dataIndex: 'ho_ten',
      key: 'ho_ten',
      sorter: (a, b) => a.ho_ten.localeCompare(b.ho_ten),
      render: (name) => {
        const initials = name
          .split(' ')
          .slice(-2)
          .map((w) => w[0])
          .join('')
          .toUpperCase();
        return (
          <Space size={10}>
            <Avatar
              size={34}
              style={{
                background: 'linear-gradient(135deg, #1e3a8a 0%, #0284c7 100%)',
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              {initials}
            </Avatar>
            <Text strong style={{ color: '#0f172a', fontSize: 14 }}>{name}</Text>
          </Space>
        );
      },
    },
    {
      title: 'SĐT Phụ huynh (ZNS)',
      dataIndex: 'sdt_phu_huynh',
      key: 'sdt',
      render: (phone) => (
        <Space size={6}>
          <PhoneOutlined style={{ color: '#0284c7' }} />
          <Text style={{ fontFamily: 'monospace', fontSize: 13.5, fontWeight: 500 }}>
            {formatPhone(phone)}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Lớp theo học',
      dataIndex: 'lop',
      key: 'lop',
      render: (lop) => (
        <Tag color="geekblue" style={{ borderRadius: 6, fontWeight: 500 }}>
          {lop}
        </Tag>
      ),
    },
    {
      title: 'Ngày nhập học',
      dataIndex: 'ngay_nhap_hoc',
      key: 'ngay',
      render: (d) => <Text type="secondary">{formatDate(d)}</Text>,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'trang_thai',
      key: 'trang_thai',
      render: (status) => <StatusBadge type="student" status={status} />,
      filters: [
        { text: 'Đang theo học', value: 'DangHoc' },
        { text: 'Bảo lưu', value: 'BaoLuu' },
        { text: 'Đã nghỉ học', value: 'DaNghi' },
      ],
      onFilter: (value, record) => record.trang_thai === value,
    },
    {
      title: 'Thao tác',
      key: 'action',
      align: 'right',
      render: (_, record) => (
        <Space size={6}>
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            Sửa
          </Button>
          <Button size="small" icon={<UserSwitchOutlined />} onClick={() => handleChangeStatus(record)}>
            Đổi TT
          </Button>
          <Button
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => {
              Modal.confirm({
                title: 'Xóa hồ sơ học sinh?',
                content: `Bạn có chắc chắn muốn xóa hồ sơ của ${record.ho_ten}?`,
                okText: 'Xóa hồ sơ',
                cancelText: 'Hủy',
                okButtonProps: { danger: true },
                onOk: () => {
                  setStudents((prev) => prev.filter((s) => s.id !== record.id));
                  message.success(`Đã xóa học sinh ${record.ho_ten}!`);
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

  const handleEdit = (student) => {
    setEditingStudent(student);
    setPhoneVal(student.sdt_phu_huynh);
    form.setFieldsValue(student);
    setModalOpen(true);
  };

  const handleAdd = () => {
    setEditingStudent(null);
    setPhoneVal('');
    form.resetFields();
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      if (!isValidPhone(phoneVal)) {
        message.error('Số điện thoại không hợp lệ! Bắt buộc 10 chữ số đầu 03, 05, 07, 08, 09.');
        return;
      }

      if (editingStudent) {
        setStudents((prev) =>
          prev.map((s) => (s.id === editingStudent.id ? { ...s, ...values, sdt_phu_huynh: phoneVal } : s))
        );
        message.success('Cập nhật học sinh thành công!');
      } else {
        const newStudent = {
          id: Date.now(),
          ...values,
          sdt_phu_huynh: phoneVal,
          trang_thai: 'DangHoc',
          ngay_nhap_hoc: new Date().toISOString().split('T')[0],
        };
        setStudents((prev) => [newStudent, ...prev]);
        message.success('Thêm học sinh mới thành công!');
      }
      setModalOpen(false);
    } catch {
      // Form validation failed
    }
  };

  const handleChangeStatus = (student) => {
    let selectedStatus = student.trang_thai;
    Modal.confirm({
      title: `Cập nhật trạng thái: ${student.ho_ten}`,
      content: (
        <div style={{ marginTop: 12 }}>
          <p style={{ marginBottom: 6 }}>Chọn trạng thái học tập mới:</p>
          <Select
            defaultValue={student.trang_thai}
            style={{ width: '100%' }}
            onChange={(val) => {
              selectedStatus = val;
            }}
            options={[
              { value: 'DangHoc', label: '✅ Đang học (Hiển thị trong bảng điểm danh)' },
              { value: 'BaoLuu', label: '⏸️ Bảo lưu (Tạm ẩn khỏi danh sách điểm danh)' },
              { value: 'DaNghi', label: '❌ Đã nghỉ (Ngừng gửi tin nhắn Zalo ZNS)' },
            ]}
          />
        </div>
      ),
      onOk: () => {
        setStudents((prev) =>
          prev.map((s) => (s.id === student.id ? { ...s, trang_thai: selectedStatus } : s))
        );
        message.success(`Đã đổi trạng thái sang ${selectedStatus}!`);
      },
    });
  };

  return (
    <div>
      {/* Page Header */}
      <div className="edtech-page-header">
        <div>
          <Space align="center" size={10}>
            <Title level={4} style={{ margin: 0, fontWeight: 800 }}>
              Quản Lý Hồ Sơ Học Viên
            </Title>
            <Tag color="blue">{students.length} hồ sơ</Tag>
          </Space>
          <Text type="secondary" style={{ display: 'block', marginTop: 4 }}>
            Chỉ những học viên ở trạng thái <strong>"Đang theo học"</strong> mới xuất hiện trong danh sách điểm danh hàng ngày.
          </Text>
        </div>
        <Button type="primary" className="btn-cta-orange" icon={<PlusOutlined />} onClick={handleAdd} size="large">
          Tiếp nhận học sinh mới
        </Button>
      </div>

      {/* Quick KPI Summary Row */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={8}>
          <div className="edtech-stat-card" style={{ padding: '14px 18px' }}>
            <div>
              <Text type="secondary" style={{ fontSize: 13 }}>Tổng hồ sơ học viên</Text>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#1e3a8a' }}>{students.length}</div>
            </div>
            <div className="edtech-stat-icon" style={{ width: 42, height: 42, fontSize: 18, background: '#eff6ff', color: '#1e3a8a' }}>
              <TeamOutlined />
            </div>
          </div>
        </Col>
        <Col xs={24} sm={8}>
          <div className="edtech-stat-card" style={{ padding: '14px 18px' }}>
            <div>
              <Text type="secondary" style={{ fontSize: 13 }}>Đang theo học (Nhận ZNS)</Text>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#10b981' }}>{activeCount}</div>
            </div>
            <div className="edtech-stat-icon" style={{ width: 42, height: 42, fontSize: 18, background: '#ecfdf5', color: '#10b981' }}>
              <CheckCircleOutlined />
            </div>
          </div>
        </Col>
        <Col xs={24} sm={8}>
          <div className="edtech-stat-card" style={{ padding: '14px 18px' }}>
            <div>
              <Text type="secondary" style={{ fontSize: 13 }}>Đang bảo lưu</Text>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#f59e0b' }}>{reservedCount}</div>
            </div>
            <div className="edtech-stat-icon" style={{ width: 42, height: 42, fontSize: 18, background: '#fffbeb', color: '#f59e0b' }}>
              <PauseCircleOutlined />
            </div>
          </div>
        </Col>
      </Row>

      {/* Filter Bar + Table */}
      <div className="edtech-table-wrapper">
        <div className="edtech-filter-bar" style={{ border: 'none', borderBottom: '1px solid #f1f5f9' }}>
          <Space wrap size={12}>
            <Input
              placeholder="Tìm kiếm theo tên học viên, SĐT phụ huynh, lớp..."
              prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 320, maxWidth: '100%' }}
              allowClear
            />
            <Select
              placeholder="Tất cả lớp học"
              allowClear
              value={classFilter}
              onChange={setClassFilter}
              style={{ width: 200 }}
              options={[
                { value: 'Lớp A1 - Starter', label: 'Lớp A1 - Starter' },
                { value: 'Lớp B2 - Intermediate', label: 'Lớp B2 - Intermediate' },
                { value: 'Lớp C1 - Advanced', label: 'Lớp C1 - Advanced' },
              ]}
            />
          </Space>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Hiển thị <strong>{filteredStudents.length}</strong> học viên
          </Text>
        </div>

        <Table
          dataSource={filteredStudents}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 8, showTotal: (t) => `Tổng cộng: ${t} học sinh` }}
          scroll={{ x: 860 }}
        />
      </div>

      <Modal
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSave}
        title={editingStudent ? '✏️ Sửa thông tin học viên' : '🎓 Tiếp nhận học viên mới'}
        okText="Lưu dữ liệu"
        cancelText="Đóng"
      >
        <Form form={form} layout="vertical" style={{ marginTop: 12 }}>
          <Form.Item
            name="ho_ten"
            label="Họ tên học sinh"
            rules={[{ required: true, message: 'Vui lòng nhập họ tên!' }]}
          >
            <Input prefix={<UserOutlined style={{ color: '#94a3b8' }} />} placeholder="Ví dụ: Nguyễn Văn An" />
          </Form.Item>

          <Form.Item label="Số điện thoại Phụ huynh (Nhận ZNS tự động)" required>
            <PhoneInput value={phoneVal} onChange={setPhoneVal} />
          </Form.Item>

          <Form.Item
            name="lop"
            label="Xếp vào lớp học"
            rules={[{ required: true, message: 'Vui lòng chọn lớp!' }]}
          >
            <Select placeholder="Chọn lớp theo học">
              <Select.Option value="Lớp A1 - Starter">Lớp A1 - Starter</Select.Option>
              <Select.Option value="Lớp B2 - Intermediate">Lớp B2 - Intermediate</Select.Option>
              <Select.Option value="Lớp C1 - Advanced">Lớp C1 - Advanced</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

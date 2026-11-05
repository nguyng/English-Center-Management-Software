import { useState } from 'react';
import { Table, Button, Space, Input, Modal, Form, Select, Typography, App as AntApp, Tag } from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined, UserSwitchOutlined } from '@ant-design/icons';
import PhoneInput from '../../components/PhoneInput';
import StatusBadge from '../../components/StatusBadge';
import { formatDate, formatPhone } from '../../utils/formatters';
import { isValidPhone } from '../../utils/validators';

const { Title } = Typography;

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
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [phoneVal, setPhoneVal] = useState('');
  const [form] = Form.useForm();
  const { message } = AntApp.useApp();

  const filteredStudents = students.filter((s) =>
    s.ho_ten.toLowerCase().includes(searchText.toLowerCase()) ||
    s.sdt_phu_huynh.includes(searchText) ||
    s.lop.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns = [
    { title: 'STT', key: 'stt', render: (_, __, idx) => idx + 1, width: 60, align: 'center' },
    { title: 'Họ và tên', dataIndex: 'ho_ten', key: 'ho_ten', sorter: (a, b) => a.ho_ten.localeCompare(b.ho_ten) },
    { title: 'SĐT Phụ huynh', dataIndex: 'sdt_phu_huynh', key: 'sdt', render: (phone) => formatPhone(phone) },
    { title: 'Lớp học', dataIndex: 'lop', key: 'lop' },
    { title: 'Ngày nhập học', dataIndex: 'ngay_nhap_hoc', key: 'ngay', render: (d) => formatDate(d) },
    {
      title: 'Trạng thái',
      dataIndex: 'trang_thai',
      key: 'trang_thai',
      render: (status) => <StatusBadge type="student" status={status} />,
      filters: [
        { text: 'Đang học', value: 'DangHoc' },
        { text: 'Bảo lưu', value: 'BaoLuu' },
        { text: 'Đã nghỉ', value: 'DaNghi' },
      ],
      onFilter: (value, record) => record.trang_thai === value,
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            Sửa
          </Button>
          <Button size="small" icon={<UserSwitchOutlined />} onClick={() => handleChangeStatus(record)}>
            Đổi TT
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
          <p style={{ marginBottom: 6 }}>Chọn trạng thái mới:</p>
          <Select
            defaultValue={student.trang_thai}
            style={{ width: '100%' }}
            onChange={(val) => { selectedStatus = val; }}
            options={[
              { value: 'DangHoc', label: '✅ Đang học (Hiển thị điểm danh)' },
              { value: 'BaoLuu', label: '⏸️ Bảo lưu (Tạm ẩn điểm danh)' },
              { value: 'DaNghi', label: '❌ Đã nghỉ (Không gửi tin Zalo)' },
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
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>👨‍🎓 Quản Lý Học Sinh</Title>
          <Tag color="blue" style={{ marginTop: 4 }}>Chỉ học sinh "Đang học" mới xuất hiện ở danh sách điểm danh</Tag>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          Tiếp nhận học sinh mới
        </Button>
      </div>

      <Input
        placeholder="Tìm kiếm theo tên, SĐT phụ huynh, lớp..."
        prefix={<SearchOutlined />}
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        style={{ marginBottom: 16, maxWidth: 360 }}
        allowClear
      />

      <Table
        dataSource={filteredStudents}
        columns={columns}
        rowKey="id"
        pagination={{ pageSize: 8, showTotal: (t) => `Tổng cộng: ${t} học sinh` }}
      />

      <Modal
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSave}
        title={editingStudent ? 'Sửa thông tin học sinh' : 'Tiếp nhận học sinh mới'}
        okText="Lưu dữ liệu"
        cancelText="Đóng"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="ho_ten" label="Họ tên học sinh" rules={[{ required: true, message: 'Vui lòng nhập họ tên!' }]}>
            <Input placeholder="Ví dụ: Nguyễn Văn An" />
          </Form.Item>
          
          <Form.Item label="Số điện thoại Phụ huynh (Nhận ZNS)" required>
            <PhoneInput value={phoneVal} onChange={setPhoneVal} />
          </Form.Item>

          <Form.Item name="lop" label="Xếp vào lớp" rules={[{ required: true, message: 'Vui lòng chọn lớp!' }]}>
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


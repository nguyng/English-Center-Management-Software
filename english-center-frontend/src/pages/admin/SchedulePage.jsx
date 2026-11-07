import { useState } from 'react';
import { Table, Button, Tag, Typography, Modal, App as AntApp, Select, Space, Form, DatePicker, TimePicker, Card } from 'antd';
import { StopOutlined, CheckCircleOutlined, UserSwitchOutlined, PlusOutlined, DeleteOutlined, CalendarOutlined } from '@ant-design/icons';
import StatusBadge from '../../components/StatusBadge';
import { formatDate } from '../../utils/formatters';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const initialSessions = [
  { id: 1, lop: 'Lớp A1 - Starter', ngay_hoc: '2026-11-05', gio_bat_dau: '17:30', gio_ket_thuc: '19:00', ca_hoc: '17:30 - 19:00', giao_vien: 'Nguyễn Văn A', trang_thai_buoi_hoc: 'BinhThuong', trang_thai_diem_danh: 'da_diem_danh' },
  { id: 2, lop: 'Lớp B2 - Intermediate', ngay_hoc: '2026-11-05', gio_bat_dau: '19:00', gio_ket_thuc: '20:30', ca_hoc: '19:00 - 20:30', giao_vien: 'Trần Thị B', trang_thai_buoi_hoc: 'BinhThuong', trang_thai_diem_danh: 'chua_diem_danh' },
  { id: 3, lop: 'Lớp A1 - Starter', ngay_hoc: '2026-11-06', gio_bat_dau: '17:30', gio_ket_thuc: '19:00', ca_hoc: '17:30 - 19:00', giao_vien: 'Nguyễn Văn A', trang_thai_buoi_hoc: 'NghiLe', trang_thai_diem_danh: 'chua_diem_danh' },
  { id: 4, lop: 'Lớp C1 - Advanced', ngay_hoc: '2026-11-06', gio_bat_dau: '19:00', gio_ket_thuc: '20:30', ca_hoc: '19:00 - 20:30', giao_vien: 'Lê Hoàng C', trang_thai_buoi_hoc: 'BinhThuong', trang_thai_diem_danh: 'chua_diem_danh' },
];

export default function SchedulePage() {
  const [sessions, setSessions] = useState(initialSessions);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [form] = Form.useForm();
  const { message, modal } = AntApp.useApp();

  const handleCancel = (session) => {
    let cancelType = 'DaHuy';
    modal.confirm({
      title: `🚫 Hủy ca học / Báo nghỉ lễ`,
      content: (
        <div style={{ marginTop: 12 }}>
          <p>Lớp: <strong>{session.lop}</strong></p>
          <p>Ca học: <strong>{session.ca_hoc}</strong> | Ngày: <strong>{formatDate(session.ngay_hoc)}</strong></p>
          <p style={{ marginTop: 12, marginBottom: 4 }}>Chọn hình thức:</p>
          <Select
            defaultValue="DaHuy"
            style={{ width: '100%' }}
            onChange={(val) => { cancelType = val; }}
            options={[
              { value: 'DaHuy', label: '🚫 Hủy đột xuất (Bão, cúp điện, không học)' },
              { value: 'NghiLe', label: '🎊 Báo nghỉ lễ (Tết, Quốc khánh...)' },
            ]}
          />
          <Text type="secondary" style={{ display: 'block', marginTop: 8, fontSize: 12 }}>
            ⚠️ Cron Job cuối ca sẽ tự động BỎ QUA buổi này, không bắn bất kỳ tin nhắn Zalo nào.
          </Text>
        </div>
      ),
      okText: 'Xác nhận hủy lịch',
      cancelText: 'Quay lại',
      okButtonProps: { danger: true },
      onOk: () => {
        setSessions((prev) =>
          prev.map((s) => (s.id === session.id ? { ...s, trang_thai_buoi_hoc: cancelType } : s))
        );
        message.success('Đã cập nhật trạng thái buổi học thành công!');
      },
    });
  };

  const handleSubstitute = (session) => {
    let newTeacher = 'Lê Hoàng C';
    modal.confirm({
      title: `👨‍🏫 Phân công Giáo viên dạy thay`,
      content: (
        <div style={{ marginTop: 12 }}>
          <p>Lớp: <strong>{session.lop}</strong> | Ca: <strong>{session.ca_hoc}</strong></p>
          <p>Giáo viên hiện tại: <strong>{session.giao_vien}</strong> (Báo bận)</p>
          <p style={{ marginTop: 12, marginBottom: 4 }}>Chọn giáo viên dạy thay:</p>
          <Select
            defaultValue="Lê Hoàng C"
            style={{ width: '100%' }}
            onChange={(v) => { newTeacher = v; }}
            options={[
              { value: 'Nguyễn Văn A', label: 'Nguyễn Văn A' },
              { value: 'Trần Thị B', label: 'Trần Thị B' },
              { value: 'Lê Hoàng C', label: 'Lê Hoàng C' },
            ]}
          />
        </div>
      ),
      okText: 'Xác nhận chỉ định',
      onOk: () => {
        setSessions((prev) =>
          prev.map((s) => (s.id === session.id ? { ...s, giao_vien: `${newTeacher} (Dạy thay)` } : s))
        );
        message.success(`Đã phân công ${newTeacher} dạy thay buổi này!`);
      },
    });
  };

  const handleDelete = (session) => {
    modal.confirm({
      title: 'Xóa ca học này?',
      content: `Bạn chắc chắn muốn xóa lịch học ngày ${formatDate(session.ngay_hoc)} của ${session.lop}?`,
      okText: 'Xóa',
      cancelText: 'Hủy',
      okButtonProps: { danger: true },
      onOk: () => {
        setSessions((prev) => prev.filter((s) => s.id !== session.id));
        message.success('Đã xóa ca học khỏi lịch!');
      },
    });
  };

  const handleCreateSession = async () => {
    try {
      const values = await form.validateFields();
      const startTime = values.gio_bat_dau ? values.gio_bat_dau.format('HH:mm') : '17:30';
      const endTime = values.gio_ket_thuc ? values.gio_ket_thuc.format('HH:mm') : '19:00';
      const sessionDate = values.ngay_hoc ? values.ngay_hoc.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD');

      const newSession = {
        id: Date.now(),
        lop: values.lop,
        ngay_hoc: sessionDate,
        gio_bat_dau: startTime,
        gio_ket_thuc: endTime,
        ca_hoc: `${startTime} - ${endTime}`,
        giao_vien: values.giao_vien,
        trang_thai_buoi_hoc: 'BinhThuong',
        trang_thai_diem_danh: 'chua_diem_danh',
      };

      setSessions((prev) => [newSession, ...prev]);
      message.success(`Đã tạo lịch ca học mới cho ${values.lop} thành công!`);
      setCreateModalOpen(false);
      form.resetFields();
    } catch {}
  };

  const columns = [
    { title: 'Ngày học', dataIndex: 'ngay_hoc', key: 'ngay', render: (d) => formatDate(d), width: 120, sorter: (a, b) => new Date(a.ngay_hoc) - new Date(b.ngay_hoc), defaultSortOrder: 'descend' },
    { title: 'Lớp học', dataIndex: 'lop', key: 'lop', width: 180 },
    { title: 'Khung giờ', key: 'ca', width: 140, render: (_, r) => <strong>{r.ca_hoc || `${r.gio_bat_dau} - ${r.gio_ket_thuc}`}</strong> },
    { title: 'Giáo viên phụ trách', dataIndex: 'giao_vien', key: 'gv', width: 180 },
    { title: 'Trạng thái buổi', dataIndex: 'trang_thai_buoi_hoc', key: 'tt', width: 140, render: (s) => <StatusBadge type="session" status={s} /> },
    {
      title: 'Điểm danh',
      dataIndex: 'trang_thai_diem_danh',
      key: 'dd',
      width: 150,
      render: (s) =>
        s === 'da_diem_danh' ? <Tag color="green"><CheckCircleOutlined /> Đã điểm danh</Tag> : <Tag color="orange">⏳ Chưa điểm danh</Tag>,
    },
    {
      title: 'Thao tác Admin',
      key: 'action',
      width: 260,
      render: (_, record) => (
        <Space>
          {record.trang_thai_buoi_hoc === 'BinhThuong' ? (
            <>
              <Button size="small" icon={<UserSwitchOutlined />} onClick={() => handleSubstitute(record)}>
                Dạy thay
              </Button>
              <Button danger size="small" icon={<StopOutlined />} onClick={() => handleCancel(record)}>
                Hủy / Nghỉ
              </Button>
            </>
          ) : (
            <Text type="secondary">Đã khóa lịch</Text>
          )}
          <Button size="small" type="text" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)} />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>📅 Quản Lý Lịch Học & Ca Dạy</Title>
          <Text type="secondary">Lên lịch ca học mới, phân công dạy thay, báo nghỉ lễ và hủy lịch đột xuất</Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            form.resetFields();
            setCreateModalOpen(true);
          }}
        >
          Lên lịch ca học mới
        </Button>
      </div>

      <Table dataSource={sessions} columns={columns} rowKey="id" pagination={{ pageSize: 10 }} />

      {/* Modal Tạo Lịch Ca Học Mới */}
      <Modal
        open={createModalOpen}
        onCancel={() => setCreateModalOpen(false)}
        onOk={handleCreateSession}
        title="📅 Thêm Ca Học Mới Vào Lịch Dạy"
        okText="Tạo ca học"
        cancelText="Đóng"
        width={520}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            lop: 'Lớp A1 - Starter',
            ngay_hoc: dayjs(),
            gio_bat_dau: dayjs('17:30', 'HH:mm'),
            gio_ket_thuc: dayjs('19:00', 'HH:mm'),
            giao_vien: 'Nguyễn Văn A',
          }}
          style={{ marginTop: 16 }}
        >
          <Form.Item name="lop" label="Lớp học" rules={[{ required: true, message: 'Vui lòng chọn lớp!' }]}>
            <Select
              options={[
                { value: 'Lớp A1 - Starter', label: 'Lớp A1 - Starter' },
                { value: 'Lớp B2 - Intermediate', label: 'Lớp B2 - Intermediate' },
                { value: 'Lớp C1 - Advanced', label: 'Lớp C1 - Advanced' },
              ]}
              onChange={(val) => {
                // Tự động gán giáo viên mặc định theo lớp
                if (val.includes('A1')) form.setFieldValue('giao_vien', 'Nguyễn Văn A');
                else if (val.includes('B2')) form.setFieldValue('giao_vien', 'Trần Thị B');
                else if (val.includes('C1')) form.setFieldValue('giao_vien', 'Lê Hoàng C');
              }}
            />
          </Form.Item>

          <Form.Item name="ngay_hoc" label="Ngày học" rules={[{ required: true, message: 'Vui lòng chọn ngày học!' }]}>
            <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
          </Form.Item>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item name="gio_bat_dau" label="Giờ bắt đầu" rules={[{ required: true, message: 'Chọn giờ bắt đầu!' }]}>
              <TimePicker format="HH:mm" minuteStep={5} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="gio_ket_thuc" label="Giờ kết thúc" rules={[{ required: true, message: 'Chọn giờ kết thúc!' }]}>
              <TimePicker format="HH:mm" minuteStep={5} style={{ width: '100%' }} />
            </Form.Item>
          </div>

          <Form.Item name="giao_vien" label="Giáo viên phụ trách ca" rules={[{ required: true, message: 'Vui lòng chọn giáo viên!' }]}>
            <Select
              options={[
                { value: 'Nguyễn Văn A', label: 'Nguyễn Văn A' },
                { value: 'Trần Thị B', label: 'Trần Thị B' },
                { value: 'Lê Hoàng C', label: 'Lê Hoàng C' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

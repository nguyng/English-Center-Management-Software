import { useState } from 'react';
import { Table, Button, Tag, Typography, Modal, App as AntApp, Select, Space } from 'antd';
import { StopOutlined, CheckCircleOutlined, UserSwitchOutlined } from '@ant-design/icons';
import StatusBadge from '../../components/StatusBadge';
import { formatDate } from '../../utils/formatters';

const { Title, Text } = Typography;

const initialSessions = [
  { id: 1, lop: 'Lớp A1 - Starter', ngay_hoc: '2026-11-05', ca_hoc: '17:30 - 19:00', giao_vien: 'Nguyễn Văn A', trang_thai_buoi_hoc: 'BinhThuong', trang_thai_diem_danh: 'da_diem_danh' },
  { id: 2, lop: 'Lớp B2 - Intermediate', ngay_hoc: '2026-11-05', ca_hoc: '19:00 - 20:30', giao_vien: 'Trần Thị B', trang_thai_buoi_hoc: 'BinhThuong', trang_thai_diem_danh: 'chua_diem_danh' },
  { id: 3, lop: 'Lớp A1 - Starter', ngay_hoc: '2026-11-06', ca_hoc: '17:30 - 19:00', giao_vien: 'Nguyễn Văn A', trang_thai_buoi_hoc: 'NghiLe', trang_thai_diem_danh: 'chua_diem_danh' },
  { id: 4, lop: 'Lớp C1 - Advanced', ngay_hoc: '2026-11-06', ca_hoc: '19:00 - 20:30', giao_vien: 'Lê Hoàng C', trang_thai_buoi_hoc: 'BinhThuong', trang_thai_diem_danh: 'chua_diem_danh' },
];

export default function SchedulePage() {
  const [sessions, setSessions] = useState(initialSessions);
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
        setSessions(prev =>
          prev.map(s => s.id === session.id ? { ...s, trang_thai_buoi_hoc: cancelType } : s)
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
        setSessions(prev =>
          prev.map(s => s.id === session.id ? { ...s, giao_vien: `${newTeacher} (Dạy thay)` } : s)
        );
        message.success(`Đã phân công ${newTeacher} dạy thay buổi này!`);
      }
    });
  };

  const columns = [
    { title: 'Ngày học', dataIndex: 'ngay_hoc', key: 'ngay', render: (d) => formatDate(d), width: 120 },
    { title: 'Lớp học', dataIndex: 'lop', key: 'lop' },
    { title: 'Ca học', dataIndex: 'ca_hoc', key: 'ca', width: 140 },
    { title: 'Giáo viên phụ trách', dataIndex: 'giao_vien', key: 'gv' },
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
      title: 'Hành động Admin',
      key: 'action',
      width: 220,
      render: (_, record) => (
        record.trang_thai_buoi_hoc === 'BinhThuong' ? (
          <Space>
            <Button size="small" icon={<UserSwitchOutlined />} onClick={() => handleSubstitute(record)}>
              Dạy thay
            </Button>
            <Button danger size="small" icon={<StopOutlined />} onClick={() => handleCancel(record)}>
              Hủy buổi
            </Button>
          </Space>
        ) : <Text type="secondary">Đã khóa lịch</Text>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>📅 Quản Lý Lịch Học & Ca Dạy</Title>
        <Text type="secondary">Điều phối dạy thay, báo nghỉ lễ và hủy lịch đột xuất</Text>
      </div>
      <Table dataSource={sessions} columns={columns} rowKey="id" pagination={{ pageSize: 10 }} />
    </div>
  );
}


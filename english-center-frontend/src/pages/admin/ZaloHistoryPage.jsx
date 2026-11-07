import { useState } from 'react';
import { Table, Tag, DatePicker, Select, Space, Typography, Card, Row, Col, Statistic, Input, Button, Modal } from 'antd';
import { MessageOutlined, CheckCircleOutlined, CloseCircleOutlined, WarningOutlined, SearchOutlined, EyeOutlined } from '@ant-design/icons';
import { formatDateTime, formatPhone, getZaloStatusLabel, getZaloStatusColor } from '../../utils/formatters';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const mockZaloLogs = [
  { id: 1, thoi_gian: '2026-11-05T17:35:00', hoc_sinh: 'Nguyễn Văn An', lop: 'Lớp A1 - Starter', loai_tin: 'bao_vang', sdt_nhan: '0901234567', noi_dung: 'Kính gửi phụ huynh bé Nguyễn Văn An, Trung tâm Tiếng Anh xin thông báo: Hôm nay ngày 05/11, bé vắng mặt trong buổi học ca 17h30. Quý phụ huynh vui lòng liên hệ trung tâm nếu cần hỗ trợ sắp xếp lịch học bù. Trân trọng!', trang_thai: 'ThanhCong' },
  { id: 2, thoi_gian: '2026-11-05T17:35:01', hoc_sinh: 'Trần Thị Bảo', lop: 'Lớp A1 - Starter', loai_tin: 'bao_diem', sdt_nhan: '0912345678', noi_dung: 'Kính gửi phụ huynh bé Trần Thị Bảo, Trung tâm xin gửi kết quả bài kiểm tra: Chuyên cần: Có mặt đúng giờ. Bài kiểm tra: Từ vựng Unit 3. Điểm số: 8.5 / 10 - Xếp loại: Giỏi. Trân trọng!', trang_thai: 'ThanhCong' },
  { id: 3, thoi_gian: '2026-11-05T19:01:00', hoc_sinh: 'Lê Hoàng Cường', lop: 'Lớp B2 - Intermediate', loai_tin: 'bao_vang', sdt_nhan: '0923456789', noi_dung: 'Kính gửi phụ huynh bé Lê Hoàng Cường, hôm nay bé vắng mặt trong buổi học ca 19h00...', trang_thai: 'ThatBai' },
  { id: 4, thoi_gian: '2026-11-04T17:35:00', hoc_sinh: 'Phạm Minh Đức', lop: 'Lớp A1 - Starter', loai_tin: 'bao_diem', sdt_nhan: '0934567890', noi_dung: 'Điểm bài kiểm tra: 7.3/10 - Xếp loại: Khá...', trang_thai: 'Demo' },
];

export default function ZaloHistoryPage() {
  const [dateRange, setDateRange] = useState(null);
  const [filterType, setFilterType] = useState(null);
  const [filterStatus, setFilterStatus] = useState(null);
  const [searchText, setSearchText] = useState('');

  let filtered = [...mockZaloLogs];
  if (filterType) filtered = filtered.filter((l) => l.loai_tin === filterType);
  if (filterStatus) filtered = filtered.filter((l) => l.trang_thai === filterStatus);
  if (searchText) {
    filtered = filtered.filter((l) =>
      l.hoc_sinh.toLowerCase().includes(searchText.toLowerCase()) ||
      l.sdt_nhan.includes(searchText) ||
      l.noi_dung.toLowerCase().includes(searchText.toLowerCase())
    );
  }
  if (dateRange && dateRange[0] && dateRange[1]) {
    filtered = filtered.filter((l) => {
      const d = dayjs(l.thoi_gian);
      return d.isAfter(dateRange[0].startOf('day')) && d.isBefore(dateRange[1].endOf('day'));
    });
  }

  const handleViewDetail = (record) => {
    Modal.info({
      title: '📱 Chi tiết nội dung tin nhắn Zalo',
      content: (
        <div style={{ marginTop: 16 }}>
          <p><strong>Học sinh:</strong> {record.hoc_sinh} ({record.lop})</p>
          <p><strong>SĐT nhận ZNS:</strong> {formatPhone(record.sdt_nhan)}</p>
          <p><strong>Thời gian gửi:</strong> {formatDateTime(record.thoi_gian)}</p>
          <p>
            <strong>Trạng thái: </strong>
            <Tag color={getZaloStatusColor(record.trang_thai)}>{getZaloStatusLabel(record.trang_thai)}</Tag>
          </p>
          <p style={{ marginTop: 12, marginBottom: 4 }}><strong>Nội dung đầy đủ:</strong></p>
          <div style={{ background: '#f5f5f5', padding: 14, borderRadius: 8, whiteSpace: 'pre-wrap', fontSize: 13, border: '1px solid #e8e8e8', lineHeight: 1.6 }}>
            {record.noi_dung}
          </div>
        </div>
      ),
      width: 520,
      okText: 'Đóng',
    });
  };

  const columns = [
    { title: 'Thời gian gửi', dataIndex: 'thoi_gian', key: 'time', render: (t) => formatDateTime(t), width: 150, sorter: (a, b) => new Date(a.thoi_gian) - new Date(b.thoi_gian), defaultSortOrder: 'descend' },
    { title: 'Học sinh', dataIndex: 'hoc_sinh', key: 'hs', width: 150, render: (h) => <strong>{h}</strong> },
    { title: 'Lớp', dataIndex: 'lop', key: 'lop', width: 150 },
    { title: 'Loại thông báo', dataIndex: 'loai_tin', key: 'loai', width: 120, render: (t) => t === 'bao_vang' ? <Tag color="red">Báo vắng</Tag> : <Tag color="blue">Báo điểm</Tag> },
    { title: 'SĐT Phụ huynh', dataIndex: 'sdt_nhan', key: 'sdt', render: (p) => formatPhone(p), width: 130 },
    { title: 'Trạng thái', dataIndex: 'trang_thai', key: 'tt', width: 120, render: (s) => <Tag color={getZaloStatusColor(s)}>{getZaloStatusLabel(s)}</Tag> },
    { title: 'Nội dung tin nhắn', dataIndex: 'noi_dung', key: 'nd', ellipsis: true },
    {
      title: 'Thao tác',
      key: 'action',
      width: 90,
      render: (_, record) => (
        <Button size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
          Xem
        </Button>
      ),
    },
  ];

  const stats = {
    total: mockZaloLogs.length,
    success: mockZaloLogs.filter((l) => l.trang_thai === 'ThanhCong').length,
    failed: mockZaloLogs.filter((l) => l.trang_thai === 'ThatBai').length,
    demo: mockZaloLogs.filter((l) => l.trang_thai === 'Demo').length,
  };

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>📨 Nhật Ký Gửi Tin Nhắn Zalo (ZNS)</Title>
        <Text type="secondary">Theo dõi toàn bộ lịch sử gửi tin báo vắng và báo điểm kèm trạng thái chi tiết</Text>
      </div>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={6}>
          <Card bordered={false} size="small" style={{ borderRadius: 8, background: '#e6f7ff' }}>
            <Statistic title="Tổng tin ghi nhận" value={stats.total} prefix={<MessageOutlined />} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card bordered={false} size="small" style={{ borderRadius: 8, background: '#f6ffed' }}>
            <Statistic title="Gửi thành công" value={stats.success} prefix={<CheckCircleOutlined />} valueStyle={{ color: '#3f8600' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card bordered={false} size="small" style={{ borderRadius: 8, background: '#fff1f0' }}>
            <Statistic title="Thất bại" value={stats.failed} prefix={<CloseCircleOutlined />} valueStyle={{ color: '#cf1322' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card bordered={false} size="small" style={{ borderRadius: 8, background: '#fafafa' }}>
            <Statistic title="Tin Demo Mock" value={stats.demo} prefix={<WarningOutlined />} />
          </Card>
        </Col>
      </Row>

      <Space wrap style={{ marginBottom: 16 }}>
        <Input
          placeholder="Tìm theo học sinh, SĐT, nội dung..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 260 }}
          allowClear
        />
        <RangePicker onChange={setDateRange} placeholder={['Từ ngày', 'Đến ngày']} />
        <Select placeholder="Tất cả loại tin" allowClear onChange={setFilterType} style={{ width: 150 }} options={[{ value: 'bao_vang', label: 'Báo vắng' }, { value: 'bao_diem', label: 'Báo điểm' }]} />
        <Select placeholder="Tất cả trạng thái" allowClear onChange={setFilterStatus} style={{ width: 150 }} options={[{ value: 'ThanhCong', label: 'Thành công' }, { value: 'ThatBai', label: 'Thất bại' }, { value: 'Demo', label: 'Demo' }]} />
      </Space>

      <Table dataSource={filtered} columns={columns} rowKey="id" pagination={{ pageSize: 10, showTotal: (t) => `Tổng số: ${t} bản ghi` }} scroll={{ x: 1000 }} />
    </div>
  );
}

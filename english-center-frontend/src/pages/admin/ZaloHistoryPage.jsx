import { useState } from 'react';
import {
  Table,
  Tag,
  DatePicker,
  Select,
  Space,
  Typography,
  Row,
  Col,
  Input,
  Button,
  Modal,
} from 'antd';
import {
  MessageOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
  SearchOutlined,
  EyeOutlined,
  PhoneOutlined,
} from '@ant-design/icons';
import {
  formatDateTime,
  formatPhone,
  getZaloStatusLabel,
  getZaloStatusColor,
} from '../../utils/formatters';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const mockZaloLogs = [
  {
    id: 1,
    thoi_gian: '2026-11-05T17:35:00',
    hoc_sinh: 'Nguyễn Văn An',
    lop: 'Lớp A1 - Starter',
    loai_tin: 'bao_vang',
    sdt_nhan: '0901234567',
    noi_dung:
      'Kính gửi phụ huynh bé Nguyễn Văn An, Trung tâm Tiếng Anh xin thông báo: Hôm nay ngày 05/11, bé vắng mặt trong buổi học ca 17h30. Quý phụ huynh vui lòng liên hệ trung tâm nếu cần hỗ trợ sắp xếp lịch học bù. Trân trọng!',
    trang_thai: 'ThanhCong',
  },
  {
    id: 2,
    thoi_gian: '2026-11-05T17:35:01',
    hoc_sinh: 'Trần Thị Bảo',
    lop: 'Lớp A1 - Starter',
    loai_tin: 'bao_diem',
    sdt_nhan: '0912345678',
    noi_dung:
      'Kính gửi phụ huynh bé Trần Thị Bảo, Trung tâm xin gửi kết quả bài kiểm tra: Chuyên cần: Có mặt đúng giờ. Bài kiểm tra: Từ vựng Unit 3. Điểm số: 8.5 / 10 - Xếp loại: Giỏi. Trân trọng!',
    trang_thai: 'ThanhCong',
  },
  {
    id: 3,
    thoi_gian: '2026-11-05T19:01:00',
    hoc_sinh: 'Lê Hoàng Cường',
    lop: 'Lớp B2 - Intermediate',
    loai_tin: 'bao_vang',
    sdt_nhan: '0923456789',
    noi_dung: 'Kính gửi phụ huynh bé Lê Hoàng Cường, hôm nay bé vắng mặt trong buổi học ca 19h00...',
    trang_thai: 'ThatBai',
  },
  {
    id: 4,
    thoi_gian: '2026-11-04T17:35:00',
    hoc_sinh: 'Phạm Minh Đức',
    lop: 'Lớp A1 - Starter',
    loai_tin: 'bao_diem',
    sdt_nhan: '0934567890',
    noi_dung: 'Điểm bài kiểm tra: 7.3/10 - Xếp loại: Khá...',
    trang_thai: 'Demo',
  },
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
    filtered = filtered.filter(
      (l) =>
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
      title: '📱 Chi tiết nội dung tin nhắn Zalo ZNS',
      content: (
        <div style={{ marginTop: 16 }}>
          <p style={{ marginBottom: 6 }}>
            <strong>Học sinh:</strong> {record.hoc_sinh} ({record.lop})
          </p>
          <p style={{ marginBottom: 6 }}>
            <strong>SĐT nhận ZNS:</strong> {formatPhone(record.sdt_nhan)}
          </p>
          <p style={{ marginBottom: 6 }}>
            <strong>Thời gian gửi:</strong> {formatDateTime(record.thoi_gian)}
          </p>
          <p style={{ marginBottom: 12 }}>
            <strong>Trạng thái: </strong>
            <Tag color={getZaloStatusColor(record.trang_thai)}>
              {getZaloStatusLabel(record.trang_thai)}
            </Tag>
          </p>
          <p style={{ marginBottom: 6 }}>
            <strong>Nội dung tin nhắn mẫu ZNS:</strong>
          </p>
          <div
            style={{
              background: '#f8fafc',
              padding: 16,
              borderRadius: 10,
              whiteSpace: 'pre-wrap',
              fontSize: 13.5,
              border: '1px solid #e2e8f0',
              lineHeight: 1.65,
              color: '#0f172a',
            }}
          >
            {record.noi_dung}
          </div>
        </div>
      ),
      width: 540,
      okText: 'Đóng',
    });
  };

  const columns = [
    {
      title: 'Thời gian gửi',
      dataIndex: 'thoi_gian',
      key: 'time',
      render: (t) => <Text type="secondary">{formatDateTime(t)}</Text>,
      width: 155,
      sorter: (a, b) => new Date(a.thoi_gian) - new Date(b.thoi_gian),
      defaultSortOrder: 'descend',
    },
    {
      title: 'Học viên',
      dataIndex: 'hoc_sinh',
      key: 'hs',
      width: 160,
      render: (h) => <Text strong style={{ color: '#0f172a' }}>{h}</Text>,
    },
    {
      title: 'Lớp học',
      dataIndex: 'lop',
      key: 'lop',
      width: 165,
      render: (lop) => <Tag color="geekblue">{lop}</Tag>,
    },
    {
      title: 'Loại thông báo',
      dataIndex: 'loai_tin',
      key: 'loai',
      width: 130,
      render: (t) =>
        t === 'bao_vang' ? (
          <Tag color="volcano">Báo vắng</Tag>
        ) : (
          <Tag color="cyan">Báo điểm</Tag>
        ),
    },
    {
      title: 'SĐT Phụ huynh',
      dataIndex: 'sdt_nhan',
      key: 'sdt',
      width: 140,
      render: (p) => (
        <Space size={4}>
          <PhoneOutlined style={{ color: '#0284c7' }} />
          <span style={{ fontFamily: 'monospace' }}>{formatPhone(p)}</span>
        </Space>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'trang_thai',
      key: 'tt',
      width: 130,
      render: (s) => <Tag color={getZaloStatusColor(s)}>{getZaloStatusLabel(s)}</Tag>,
    },
    {
      title: 'Nội dung tin nhắn',
      dataIndex: 'noi_dung',
      key: 'nd',
      ellipsis: true,
    },
    {
      title: 'Chi tiết',
      key: 'action',
      width: 100,
      align: 'center',
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
      <div className="edtech-page-header">
        <div>
          <Space align="center" size={10}>
            <Title level={4} style={{ margin: 0, fontWeight: 800 }}>
              Nhật Ký Gửi Tin Nhắn Zalo (ZNS)
            </Title>
            <Tag color="blue">{stats.total} bản ghi</Tag>
          </Space>
          <Text type="secondary" style={{ display: 'block', marginTop: 4 }}>
            Theo dõi toàn bộ lịch sử gửi tin báo vắng và báo điểm tự động kèm trạng thái phản hồi từ Zalo OA.
          </Text>
        </div>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={12} md={6}>
          <div className="edtech-stat-card" style={{ padding: '14px 18px' }}>
            <div>
              <Text type="secondary" style={{ fontSize: 12.5 }}>Tổng tin ghi nhận</Text>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#1e3a8a' }}>{stats.total}</div>
            </div>
            <div className="edtech-stat-icon" style={{ width: 42, height: 42, fontSize: 18, background: '#eff6ff', color: '#1e3a8a' }}>
              <MessageOutlined />
            </div>
          </div>
        </Col>
        <Col xs={12} md={6}>
          <div className="edtech-stat-card" style={{ padding: '14px 18px' }}>
            <div>
              <Text type="secondary" style={{ fontSize: 12.5 }}>Gửi thành công</Text>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#10b981' }}>{stats.success}</div>
            </div>
            <div className="edtech-stat-icon" style={{ width: 42, height: 42, fontSize: 18, background: '#ecfdf5', color: '#10b981' }}>
              <CheckCircleOutlined />
            </div>
          </div>
        </Col>
        <Col xs={12} md={6}>
          <div className="edtech-stat-card" style={{ padding: '14px 18px' }}>
            <div>
              <Text type="secondary" style={{ fontSize: 12.5 }}>Gửi thất bại</Text>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#ef4444' }}>{stats.failed}</div>
            </div>
            <div className="edtech-stat-icon" style={{ width: 42, height: 42, fontSize: 18, background: '#fef2f2', color: '#ef4444' }}>
              <CloseCircleOutlined />
            </div>
          </div>
        </Col>
        <Col xs={12} md={6}>
          <div className="edtech-stat-card" style={{ padding: '14px 18px' }}>
            <div>
              <Text type="secondary" style={{ fontSize: 12.5 }}>Tin Demo / Sandbox</Text>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#f59e0b' }}>{stats.demo}</div>
            </div>
            <div className="edtech-stat-icon" style={{ width: 42, height: 42, fontSize: 18, background: '#fffbeb', color: '#f59e0b' }}>
              <WarningOutlined />
            </div>
          </div>
        </Col>
      </Row>

      <div className="edtech-table-wrapper">
        <div className="edtech-filter-bar" style={{ border: 'none', borderBottom: '1px solid #f1f5f9' }}>
          <Space wrap size={10}>
            <Input
              placeholder="Tìm theo học sinh, SĐT, nội dung..."
              prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 260, maxWidth: '100%' }}
              allowClear
            />
            <RangePicker onChange={setDateRange} placeholder={['Từ ngày', 'Đến ngày']} />
            <Select
              placeholder="Tất cả loại tin"
              allowClear
              onChange={setFilterType}
              style={{ width: 150 }}
              options={[
                { value: 'bao_vang', label: 'Báo vắng' },
                { value: 'bao_diem', label: 'Báo điểm' },
              ]}
            />
            <Select
              placeholder="Tất cả trạng thái"
              allowClear
              onChange={setFilterStatus}
              style={{ width: 150 }}
              options={[
                { value: 'ThanhCong', label: 'Thành công' },
                { value: 'ThatBai', label: 'Thất bại' },
                { value: 'Demo', label: 'Demo' },
              ]}
            />
          </Space>
        </div>

        <Table
          dataSource={filtered}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 10, showTotal: (t) => `Tổng số: ${t} bản ghi` }}
          scroll={{ x: 1020 }}
        />
      </div>
    </div>
  );
}

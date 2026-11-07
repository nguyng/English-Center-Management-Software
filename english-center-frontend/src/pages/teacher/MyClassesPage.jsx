import { useNavigate } from 'react-router-dom';
import { Card, Row, Col, Typography, Tag, Button, Space, Empty, Progress } from 'antd';
import {
  TeamOutlined,
  CalendarOutlined,
  EditOutlined,
  TrophyOutlined,
  BookOutlined,
  ClockCircleOutlined,
  CheckCircleFilled,
  PlusOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

const mockMyClasses = [
  {
    id: 1,
    ma_lop: 'A1-2026',
    ten_lop: 'Lớp A1 - Starter',
    cap_do: 'CEFR A1 • Foundation',
    so_hoc_sinh: 18,
    si_so_toi_da: 20,
    lich_hoc: 'Thứ 2, 4, 6 — Ca 17:30 - 19:00',
    phong_hoc: 'Phòng 201 - Tầng 2',
    buoi_hoc_hom_nay: { id: 101, ca: '17:30 - 19:00', trang_thai: 'chua_diem_danh' },
  },
  {
    id: 2,
    ma_lop: 'B2-2026',
    ten_lop: 'Lớp B2 - Intermediate',
    cap_do: 'CEFR B2 • Academic',
    so_hoc_sinh: 15,
    si_so_toi_da: 20,
    lich_hoc: 'Thứ 3, 5, 7 — Ca 19:00 - 20:30',
    phong_hoc: 'Phòng 302 - Tầng 3',
    buoi_hoc_hom_nay: null,
  },
];

export default function MyClassesPage() {
  const navigate = useNavigate();

  return (
    <div>
      {/* Hero Banner */}
      <div className="edtech-hero-banner">
        <Row gutter={[24, 24]} align="middle" justify="space-between" style={{ position: 'relative', zIndex: 1 }}>
          <Col xs={24} md={15}>
            <Tag
              style={{
                background: 'rgba(56, 189, 248, 0.2)',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                color: '#e0f2fe',
                borderRadius: 999,
                padding: '3px 12px',
                marginBottom: 10,
              }}
            >
              <CheckCircleFilled style={{ color: '#34d399', marginRight: 6 }} />
              Không gian làm việc Giảng viên
            </Tag>
            <Title level={3} style={{ color: '#ffffff', margin: '0 0 6px', fontWeight: 800 }}>
              Lớp Học Phụ Trách Của Tôi
            </Title>
            <Text style={{ color: '#cbd5e1', fontSize: 14.5 }}>
              Thực hiện điểm danh 1 chạm, ghi nhận xét học viên, khởi tạo đề thi trắc nghiệm và gửi thông báo Zalo ZNS tới phụ huynh.
            </Text>
          </Col>
          <Col xs={24} md={9} style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, flexWrap: 'wrap' }}>
            <Button
              size="large"
              icon={<CalendarOutlined />}
              onClick={() => navigate('/my-schedule')}
              style={{
                background: 'rgba(255,255,255,0.12)',
                borderColor: 'rgba(255,255,255,0.28)',
                color: '#ffffff',
                borderRadius: 10,
              }}
            >
              Lịch dạy tuần này
            </Button>
            <Button
              size="large"
              className="btn-cta-orange"
              icon={<PlusOutlined />}
              onClick={() => navigate('/exam/create')}
              style={{ borderRadius: 10 }}
            >
              Tạo bài kiểm tra mới
            </Button>
          </Col>
        </Row>
      </div>

      {mockMyClasses.length === 0 ? (
        <Card className="edtech-card">
          <Empty description="Bạn chưa được phân công lớp nào" />
        </Card>
      ) : (
        <Row gutter={[24, 24]}>
          {mockMyClasses.map((cls) => {
            const hasSessionToday = Boolean(cls.buoi_hoc_hom_nay);
            const occupancy = Math.round((cls.so_hoc_sinh / (cls.si_so_toi_da || 20)) * 100);

            return (
              <Col xs={24} lg={12} key={cls.id}>
                <Card
                  className="edtech-card edtech-card-hover"
                  styles={{ body: { padding: 0 } }}
                  style={{ overflow: 'hidden' }}
                >
                  {/* Top Accent Strip */}
                  <div
                    style={{
                      height: 6,
                      background: hasSessionToday
                        ? 'linear-gradient(90deg, #f97316 0%, #fb923c 100%)'
                        : 'linear-gradient(90deg, #1e3a8a 0%, #0284c7 100%)',
                    }}
                  />

                  <div style={{ padding: 24 }}>
                    {/* Class Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
                      <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                        <div
                          style={{
                            width: 48,
                            height: 48,
                            borderRadius: 12,
                            background: hasSessionToday ? '#fff7ed' : '#eff6ff',
                            color: hasSessionToday ? '#f97316' : '#1e3a8a',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 22,
                            flexShrink: 0,
                          }}
                        >
                          <BookOutlined />
                        </div>
                        <div>
                          <Space size={8} wrap>
                            <Tag color="geekblue" style={{ margin: 0, fontWeight: 700 }}>
                              {cls.ma_lop}
                            </Tag>
                            <Tag color="cyan" style={{ margin: 0 }}>
                              {cls.cap_do}
                            </Tag>
                          </Space>
                          <Title level={4} style={{ margin: '6px 0 0', fontWeight: 800, color: '#0f172a' }}>
                            {cls.ten_lop}
                          </Title>
                        </div>
                      </div>

                      {cls.buoi_hoc_hom_nay ? (
                        <Tag
                          color={cls.buoi_hoc_hom_nay.trang_thai === 'da_diem_danh' ? 'success' : 'warning'}
                          style={{ padding: '4px 10px', fontSize: 12.5, borderRadius: 999 }}
                        >
                          {cls.buoi_hoc_hom_nay.trang_thai === 'da_diem_danh'
                            ? '✅ Đã điểm danh'
                            : `⏳ Ca hôm nay: ${cls.buoi_hoc_hom_nay.ca}`}
                        </Tag>
                      ) : (
                        <Tag color="default" style={{ padding: '4px 10px', borderRadius: 999 }}>
                          Không có lịch hôm nay
                        </Tag>
                      )}
                    </div>

                    {/* Class Metadata Box */}
                    <div
                      style={{
                        background: '#f8fafc',
                        borderRadius: 12,
                        padding: '14px 16px',
                        border: '1px solid #f1f5f9',
                        marginBottom: 20,
                      }}
                    >
                      <Row gutter={[12, 12]}>
                        <Col xs={24} sm={13}>
                          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 2 }}>Lịch học cố định</div>
                          <div style={{ fontSize: 13.5, fontWeight: 600, color: '#0f172a' }}>
                            <CalendarOutlined style={{ color: '#0284c7', marginRight: 6 }} />
                            {cls.lich_hoc}
                          </div>
                        </Col>
                        <Col xs={24} sm={11}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748b', marginBottom: 4 }}>
                            <span>
                              <TeamOutlined style={{ marginRight: 4 }} /> Sĩ số lớp
                            </span>
                            <strong style={{ color: '#0f172a' }}>{cls.so_hoc_sinh} học viên</strong>
                          </div>
                          <Progress percent={occupancy} size="small" showInfo={false} strokeColor="#0284c7" />
                        </Col>
                      </Row>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                      {cls.buoi_hoc_hom_nay ? (
                        <Button
                          type="primary"
                          className="btn-cta-orange"
                          size="large"
                          icon={<EditOutlined />}
                          onClick={() => navigate(`/attendance/${cls.buoi_hoc_hom_nay.id}`)}
                          style={{ flex: 1, minWidth: 200 }}
                        >
                          Điểm danh ca hôm nay
                        </Button>
                      ) : (
                        <Button
                          size="large"
                          disabled
                          icon={<ClockCircleOutlined />}
                          style={{ flex: 1, minWidth: 200 }}
                        >
                          Hôm nay không có ca
                        </Button>
                      )}

                      <Button
                        size="large"
                        icon={<TrophyOutlined />}
                        onClick={() => navigate('/exam/results/101')}
                        style={{ fontWeight: 600, color: '#1e3a8a', borderColor: '#bfdbfe', background: '#eff6ff' }}
                      >
                        Xem bảng điểm bài thi
                      </Button>
                    </div>
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}
    </div>
  );
}

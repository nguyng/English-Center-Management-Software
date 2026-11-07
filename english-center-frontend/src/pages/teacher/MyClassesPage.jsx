import { useNavigate } from 'react-router-dom';
import { Card, Row, Col, Typography, Tag, Button, Space, Empty } from 'antd';
import { TeamOutlined, CalendarOutlined, EditOutlined, TrophyOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const mockMyClasses = [
  {
    id: 1,
    ma_lop: 'A1-2026',
    ten_lop: 'Lớp A1 - Starter',
    so_hoc_sinh: 18,
    lich_hoc: 'Thứ 2, 4, 6 — Ca 17:30',
    buoi_hoc_hom_nay: { id: 101, ca: '17:30 - 19:00', trang_thai: 'chua_diem_danh' },
  },
  {
    id: 2,
    ma_lop: 'B2-2026',
    ten_lop: 'Lớp B2 - Intermediate',
    so_hoc_sinh: 15,
    lich_hoc: 'Thứ 3, 5, 7 — Ca 19:00',
    buoi_hoc_hom_nay: null,
  },
];

export default function MyClassesPage() {
  const navigate = useNavigate();

  return (
    <div>
      <Title level={4}>📚 Lớp học của tôi</Title>

      {mockMyClasses.length === 0 ? (
        <Empty description="Bạn chưa được phân công lớp nào" />
      ) : (
        <Row gutter={[16, 16]}>
          {mockMyClasses.map((cls) => (
            <Col xs={24} sm={12} lg={12} key={cls.id}>
              <Card
                hoverable
                style={{ borderRadius: 12 }}
                actions={[
                  cls.buoi_hoc_hom_nay ? (
                    <Button
                      type="primary"
                      icon={<EditOutlined />}
                      onClick={() => navigate(`/attendance/${cls.buoi_hoc_hom_nay.id}`)}
                    >
                      Điểm danh ca hôm nay
                    </Button>
                  ) : (
                    <Text type="secondary">Hôm nay không có ca</Text>
                  ),
                  <Button
                    icon={<TrophyOutlined />}
                    onClick={() => navigate('/exam/results/101')}
                  >
                    Xem bảng điểm bài thi
                  </Button>,
                ]}
              >
                <Card.Meta
                  title={
                    <Space>
                      <TeamOutlined style={{ color: '#1890ff' }} />
                      {cls.ten_lop}
                    </Space>
                  }
                  description={
                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                      <Text type="secondary">Mã lớp: {cls.ma_lop}</Text>
                      <Text>
                        <TeamOutlined /> Sĩ số: <Text strong>{cls.so_hoc_sinh}</Text> học sinh
                      </Text>
                      <Text>
                        <CalendarOutlined /> {cls.lich_hoc}
                      </Text>
                      {cls.buoi_hoc_hom_nay && (
                        <Tag
                          color={cls.buoi_hoc_hom_nay.trang_thai === 'da_diem_danh' ? 'green' : 'orange'}
                        >
                          {cls.buoi_hoc_hom_nay.trang_thai === 'da_diem_danh'
                            ? '✅ Đã điểm danh hôm nay'
                            : `⏳ Ca ${cls.buoi_hoc_hom_nay.ca} — Chưa điểm danh`}
                        </Tag>
                      )}
                    </Space>
                  }
                />
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
}

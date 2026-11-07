import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Table,
  Card,
  Typography,
  Space,
  Tag,
  Button,
  Row,
  Col,
  Modal,
  App as AntApp,
  Divider,
  Avatar,
} from 'antd';
import {
  TrophyOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  UserOutlined,
  EyeOutlined,
  SendOutlined,
  ArrowLeftOutlined,
  CloseCircleOutlined,
  StarOutlined,
} from '@ant-design/icons';
import { formatScore, getGradeLabel, formatDateTime } from '../../utils/formatters';

const { Title, Text, Paragraph } = Typography;

const defaultClassStudents = [
  { id: 1, ho_ten: 'Nguyễn Văn An', defaultScore: 10.0, defaultCorrect: 4, submitted: true, time: '2026-11-07 08:15', answers: { 1: 'B', 2: 'A', 3: 'C', 4: 'B' } },
  { id: 2, ho_ten: 'Trần Thị Bảo', defaultScore: 7.5, defaultCorrect: 3, submitted: true, time: '2026-11-07 08:22', answers: { 1: 'B', 2: 'B', 3: 'C', 4: 'B' } },
  { id: 4, ho_ten: 'Phạm Minh Đức', defaultScore: 5.0, defaultCorrect: 2, submitted: true, time: '2026-11-07 08:30', answers: { 1: 'A', 2: 'A', 3: 'A', 4: 'B' } },
  { id: 5, ho_ten: 'Hoàng Thu Hà', defaultScore: null, defaultCorrect: 0, submitted: false, time: null, answers: {} },
];

const mockExamQuestions = [
  { id: 1, noi_dung: 'Choose the correct word: "She _______ to school every morning."', dap_an_a: 'go', dap_an_b: 'goes', dap_an_c: 'going', dap_an_d: 'went', dap_an_dung: 'B' },
  { id: 2, noi_dung: 'What is the opposite of "generous"?', dap_an_a: 'selfish', dap_an_b: 'kind', dap_an_c: 'helpful', dap_an_d: 'friendly', dap_an_dung: 'A' },
  { id: 3, noi_dung: 'Complete the sentence: "I have been learning English _______ 3 years."', dap_an_a: 'since', dap_an_b: 'in', dap_an_c: 'for', dap_an_d: 'at', dap_an_dung: 'C' },
  { id: 4, noi_dung: 'Which word has the underlined part pronounced differently?', dap_an_a: 'cats', dap_an_b: 'dogs', dap_an_c: 'books', dap_an_d: 'hats', dap_an_dung: 'B' },
];

export default function ExamResultsPage() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { message, modal } = AntApp.useApp();

  const [examConfig] = useState(() => {
    try {
      const saved = localStorage.getItem(`exam_config_${examId}`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      id: examId || 101,
      ten_bai_kiem_tra: 'Bài kiểm tra Từ Vựng & Ngữ Pháp Unit 3',
      lop: 'Lớp A1 - Starter',
      gio_mo_de: '08:00',
      gio_dong_de: '22:00',
      ma_vao_thi: '1234',
      questions: mockExamQuestions,
    };
  });

  const [studentResults, setStudentResults] = useState([]);
  const [detailModal, setDetailModal] = useState({ open: false, student: null });

  // Đọc danh sách nộp bài từ localStorage hoặc mock data
  useEffect(() => {
    const list = defaultClassStudents.map((s) => {
      try {
        const stored = localStorage.getItem(`exam_${examId}_student_${s.id}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.submitted) {
            return {
              ...s,
              submitted: true,
              score: parsed.score,
              correctCount: parsed.correctCount,
              time: parsed.submittedAt,
              answers: parsed.answers || {},
              reason: parsed.reason,
            };
          }
        }
      } catch {}

      return {
        ...s,
        score: s.defaultScore,
        correctCount: s.defaultCorrect,
      };
    });

    setStudentResults(list);
  }, [examId]);

  const submittedList = studentResults.filter((s) => s.submitted);

  const avgScore =
    submittedList.length > 0
      ? (submittedList.reduce((acc, cur) => acc + (cur.score || 0), 0) / submittedList.length).toFixed(1)
      : '—';

  const maxScore =
    submittedList.length > 0
      ? Math.max(...submittedList.map((s) => s.score || 0)).toFixed(1)
      : '—';

  const handleSendScoresZalo = () => {
    modal.confirm({
      title: 'Xác nhận gửi thông báo điểm thi Zalo ZNS',
      content: `Gửi tin nhắn ZNS báo điểm cho ${submittedList.length} phụ huynh học sinh đã hoàn thành bài thi?`,
      okText: 'Gửi ngay',
      cancelText: 'Hủy',
      onOk: () => {
        message.success(`Đã phát lệnh gửi báo điểm Zalo cho ${submittedList.length} phụ huynh!`);
      },
    });
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
      title: 'Họ và tên học viên',
      dataIndex: 'ho_ten',
      key: 'name',
      render: (name) => (
        <Space size={10}>
          <Avatar
            size={34}
            icon={<UserOutlined />}
            style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #0284c7 100%)' }}
          />
          <Text strong style={{ color: '#0f172a', fontSize: 14 }}>
            {name}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Trạng thái bài thi',
      key: 'status',
      width: 150,
      render: (_, r) =>
        r.submitted ? (
          <Tag color="success" icon={<CheckCircleOutlined />}>
            Đã nộp bài
          </Tag>
        ) : (
          <Tag color="warning" icon={<ClockCircleOutlined />}>
            Chưa làm bài
          </Tag>
        ),
    },
    {
      title: 'Thời gian nộp',
      dataIndex: 'time',
      key: 'time',
      width: 165,
      render: (t) => (t ? <Text type="secondary">{formatDateTime(t)}</Text> : <Text type="secondary">—</Text>),
    },
    {
      title: 'Số câu đúng',
      key: 'correct',
      width: 130,
      align: 'center',
      render: (_, r) =>
        r.submitted ? (
          <Tag color="blue" style={{ fontWeight: 600 }}>
            {r.correctCount || 0}/{examConfig.questions?.length || 4} câu
          </Tag>
        ) : (
          '—'
        ),
    },
    {
      title: 'Điểm số',
      key: 'score',
      width: 120,
      align: 'center',
      render: (_, r) =>
        r.submitted && r.score !== null ? (
          <Text
            strong
            style={{
              fontSize: 16,
              color: r.score >= 8 ? '#10b981' : r.score >= 5 ? '#0284c7' : '#ef4444',
            }}
          >
            {formatScore(r.score)} / 10
          </Text>
        ) : (
          <Text type="secondary">—</Text>
        ),
    },
    {
      title: 'Xếp loại',
      key: 'grade',
      width: 120,
      align: 'center',
      render: (_, r) => {
        if (!r.submitted || r.score === null) return <Text type="secondary">—</Text>;
        const label = getGradeLabel(r.score);
        const color = r.score >= 8 ? 'success' : r.score >= 6.5 ? 'processing' : r.score >= 5 ? 'warning' : 'error';
        return <Tag color={color}>{label}</Tag>;
      },
    },
    {
      title: 'Chi tiết',
      key: 'action',
      width: 150,
      align: 'center',
      render: (_, r) =>
        r.submitted ? (
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => setDetailModal({ open: true, student: r })}
          >
            Xem bài làm
          </Button>
        ) : (
          <Text type="secondary" style={{ fontSize: 12.5 }}>
            Chờ học sinh
          </Text>
        ),
    },
  ];

  return (
    <div>
      {/* Page Header */}
      <div className="edtech-page-header">
        <div>
          <Space size={10} style={{ marginBottom: 6 }}>
            <Button size="small" icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
              Quay lại
            </Button>
            <Tag color="geekblue" style={{ margin: 0, fontWeight: 600 }}>
              {examConfig.lop}
            </Tag>
            <Tag color="cyan" style={{ margin: 0 }}>
              Khung giờ: {examConfig.gio_mo_de} - {examConfig.gio_dong_de}
            </Tag>
            <Tag color="magenta" style={{ margin: 0 }}>
              Mã PIN: {examConfig.ma_vao_thi || '1234'}
            </Tag>
          </Space>
          <Title level={4} style={{ margin: 0, fontWeight: 800 }}>
            Bảng Điểm & Phân Tích: {examConfig.ten_bai_kiem_tra}
          </Title>
        </div>
        <Button
          type="primary"
          className="btn-cta-orange"
          size="large"
          icon={<SendOutlined />}
          onClick={handleSendScoresZalo}
          disabled={submittedList.length === 0}
        >
          Gửi báo điểm Zalo ({submittedList.length} học sinh)
        </Button>
      </div>

      {/* Thẻ thống kê KPI */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} md={6}>
          <div className="edtech-stat-card" style={{ padding: '16px 20px' }}>
            <div>
              <Text type="secondary">Sĩ số lớp</Text>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#1e3a8a' }}>
                {studentResults.length}
              </div>
            </div>
            <div className="edtech-stat-icon" style={{ width: 44, height: 44, fontSize: 20, background: '#eff6ff', color: '#1e3a8a' }}>
              <UserOutlined />
            </div>
          </div>
        </Col>
        <Col xs={12} md={6}>
          <div className="edtech-stat-card" style={{ padding: '16px 20px' }}>
            <div>
              <Text type="secondary">Đã nộp bài</Text>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#10b981' }}>
                {submittedList.length}
              </div>
            </div>
            <div className="edtech-stat-icon" style={{ width: 44, height: 44, fontSize: 20, background: '#ecfdf5', color: '#10b981' }}>
              <CheckCircleOutlined />
            </div>
          </div>
        </Col>
        <Col xs={12} md={6}>
          <div className="edtech-stat-card" style={{ padding: '16px 20px' }}>
            <div>
              <Text type="secondary">Điểm trung bình</Text>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#0284c7' }}>
                {avgScore}
              </div>
            </div>
            <div className="edtech-stat-icon" style={{ width: 44, height: 44, fontSize: 20, background: '#f0f9ff', color: '#0284c7' }}>
              <StarOutlined />
            </div>
          </div>
        </Col>
        <Col xs={12} md={6}>
          <div className="edtech-stat-card" style={{ padding: '16px 20px' }}>
            <div>
              <Text type="secondary">Điểm cao nhất</Text>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#f97316' }}>
                {maxScore}
              </div>
            </div>
            <div className="edtech-stat-icon" style={{ width: 44, height: 44, fontSize: 20, background: '#fff7ed', color: '#f97316' }}>
              <TrophyOutlined />
            </div>
          </div>
        </Col>
      </Row>

      {/* Bảng điểm chi tiết */}
      <div className="edtech-table-wrapper">
        <Table
          dataSource={studentResults}
          columns={columns}
          rowKey="id"
          pagination={false}
          scroll={{ x: 860 }}
        />
      </div>

      {/* Modal Chi tiết bài làm của học sinh */}
      <Modal
        open={detailModal.open}
        onCancel={() => setDetailModal({ open: false, student: null })}
        footer={[
          <Button
            key="close"
            type="primary"
            onClick={() => setDetailModal({ open: false, student: null })}
          >
            Đóng
          </Button>,
        ]}
        title={
          <Space>
            <UserOutlined style={{ color: '#0284c7' }} />
            <span>
              Chi tiết bài thi của: <strong>{detailModal.student?.ho_ten}</strong>
            </span>
            <Tag color="success">Điểm: {detailModal.student?.score}/10đ</Tag>
          </Space>
        }
        width={680}
      >
        <div style={{ marginTop: 12 }}>
          <Paragraph>
            Thời gian nộp bài:{' '}
            <strong>
              {detailModal.student?.time ? formatDateTime(detailModal.student.time) : '—'}
            </strong>
            <br />
            Số câu đúng:{' '}
            <strong>
              {detailModal.student?.correctCount || 0}/{examConfig.questions?.length || 4} câu
            </strong>
          </Paragraph>

          <Divider style={{ margin: '12px 0' }} />

          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            {(examConfig.questions || mockExamQuestions).map((q, idx) => {
              const studentChoice = detailModal.student?.answers?.[q.id];
              const isCorrect = studentChoice === q.dap_an_dung;

              return (
                <Card
                  key={q.id}
                  size="small"
                  style={{
                    borderRadius: 10,
                    borderLeft: `4px solid ${isCorrect ? '#10b981' : '#ef4444'}`,
                    background: isCorrect ? '#ecfdf5' : '#fef2f2',
                  }}
                >
                  <Text strong style={{ color: '#0f172a' }}>
                    Câu {idx + 1}: {q.noi_dung}
                  </Text>
                  <div style={{ marginTop: 8 }}>
                    <p style={{ margin: '2px 0' }}>
                      • Học sinh chọn: <strong>{studentChoice || 'Chưa chọn'}</strong>{' '}
                      {isCorrect ? (
                        <Tag color="success">
                          <CheckCircleOutlined /> Chính xác
                        </Tag>
                      ) : (
                        <Tag color="error">
                          <CloseCircleOutlined /> Sai (Đáp án đúng: {q.dap_an_dung})
                        </Tag>
                      )}
                    </p>
                    <div style={{ fontSize: 13, color: '#475569', marginTop: 4 }}>
                      <span>A. {q.dap_an_a} | </span>
                      <span>B. {q.dap_an_b} | </span>
                      <span>C. {q.dap_an_c} | </span>
                      <span>D. {q.dap_an_d}</span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </Space>
        </div>
      </Modal>
    </div>
  );
}

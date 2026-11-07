import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Table, Card, Typography, Space, Tag, Button, Row, Col, Statistic, Modal, Alert, App as AntApp, Divider } from 'antd';
import { TrophyOutlined, CheckCircleOutlined, ClockCircleOutlined, UserOutlined, EyeOutlined, SendOutlined, ArrowLeftOutlined, CloseCircleOutlined } from '@ant-design/icons';
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

  const [examConfig, setExamConfig] = useState(() => {
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
  const unsubmittedList = studentResults.filter((s) => !s.submitted);

  const avgScore = submittedList.length > 0
    ? (submittedList.reduce((acc, cur) => acc + (cur.score || 0), 0) / submittedList.length).toFixed(1)
    : '—';

  const maxScore = submittedList.length > 0
    ? Math.max(...submittedList.map((s) => s.score || 0)).toFixed(1)
    : '—';

  const handleSendScoresZalo = () => {
    modal.confirm({
      title: 'Xác nhận gửi thông báo điểm thi Zalo',
      content: `Gửi tin nhắn ZNS báo điểm cho ${submittedList.length} phụ huynh học sinh đã hoàn thành bài thi?`,
      okText: 'Gửi ngay',
      cancelText: 'Hủy',
      onOk: () => {
        message.success(`Đã phát lệnh gửi báo điểm Zalo cho ${submittedList.length} phụ huynh!`);
      },
    });
  };

  const columns = [
    { title: 'STT', key: 'stt', render: (_, __, i) => i + 1, width: 60, align: 'center' },
    {
      title: 'Họ và tên học sinh',
      dataIndex: 'ho_ten',
      key: 'name',
      render: (name) => <Space><UserOutlined /><strong>{name}</strong></Space>,
    },
    {
      title: 'Trạng thái bài thi',
      key: 'status',
      width: 140,
      render: (_, r) =>
        r.submitted ? (
          <Tag color="green"><CheckCircleOutlined /> Đã nộp bài</Tag>
        ) : (
          <Tag color="orange"><ClockCircleOutlined /> Chưa làm bài</Tag>
        ),
    },
    {
      title: 'Thời gian nộp',
      dataIndex: 'time',
      key: 'time',
      width: 160,
      render: (t) => (t ? formatDateTime(t) : <Text type="secondary">—</Text>),
    },
    {
      title: 'Số câu đúng',
      key: 'correct',
      width: 120,
      align: 'center',
      render: (_, r) => (r.submitted ? `${r.correctCount || 0}/${examConfig.questions?.length || 4} câu` : '—'),
    },
    {
      title: 'Điểm số',
      key: 'score',
      width: 110,
      align: 'center',
      render: (_, r) =>
        r.submitted && r.score !== null ? (
          <Text strong style={{ fontSize: 16, color: r.score >= 8 ? '#389e0d' : r.score >= 5 ? '#0958d9' : '#cf1322' }}>
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
        const color = r.score >= 8 ? 'green' : r.score >= 6.5 ? 'blue' : r.score >= 5 ? 'orange' : 'red';
        return <Tag color={color}>{label}</Tag>;
      },
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 150,
      align: 'center',
      render: (_, r) =>
        r.submitted ? (
          <Button size="small" icon={<EyeOutlined />} onClick={() => setDetailModal({ open: true, student: r })}>
            Xem bài làm
          </Button>
        ) : (
          <Text type="secondary">Chờ học sinh</Text>
        ),
    },
  ];

  return (
    <div>
      {/* Header Điều hướng & Thông tin */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>Quay lại</Button>
            <Title level={4} style={{ margin: 0 }}>📊 Bảng Điểm & Chi Tiết Bài Làm Học Sinh</Title>
          </Space>
          <div style={{ marginTop: 6 }}>
            <Tag color="blue">{examConfig.lop}</Tag>
            <Tag color="purple">Bài thi: {examConfig.ten_bai_kiem_tra}</Tag>
            <Tag color="cyan">Khung giờ: {examConfig.gio_mo_de} - {examConfig.gio_dong_de}</Tag>
            <Tag color="magenta">Mã PIN: {examConfig.ma_vao_thi || '1234'}</Tag>
          </div>
        </div>
        <Button type="primary" icon={<SendOutlined />} onClick={handleSendScoresZalo} disabled={submittedList.length === 0}>
          Gửi báo điểm Zalo ({submittedList.length} học sinh)
        </Button>
      </div>

      {/* Thẻ thống kê */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={12} sm={6}>
          <Card size="small" bordered={false} style={{ background: '#e6f7ff', borderRadius: 8 }}>
            <Statistic title="Sĩ số lớp" value={studentResults.length} prefix={<UserOutlined />} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" bordered={false} style={{ background: '#f6ffed', borderRadius: 8 }}>
            <Statistic title="Đã nộp bài" value={submittedList.length} prefix={<CheckCircleOutlined />} valueStyle={{ color: '#389e0d' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" bordered={false} style={{ background: '#fff7e6', borderRadius: 8 }}>
            <Statistic title="Điểm trung bình" value={avgScore} prefix={<TrophyOutlined />} valueStyle={{ color: '#d46b08' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" bordered={false} style={{ background: '#f9f0ff', borderRadius: 8 }}>
            <Statistic title="Điểm cao nhất" value={maxScore} prefix={<TrophyOutlined />} valueStyle={{ color: '#722ed1' }} />
          </Card>
        </Col>
      </Row>

      {/* Bảng điểm chi tiết */}
      <Table dataSource={studentResults} columns={columns} rowKey="id" pagination={false} bordered />

      {/* Modal Chi tiết bài làm của học sinh */}
      <Modal
        open={detailModal.open}
        onCancel={() => setDetailModal({ open: false, student: null })}
        footer={[
          <Button key="close" type="primary" onClick={() => setDetailModal({ open: false, student: null })}>
            Đóng
          </Button>,
        ]}
        title={
          <Space>
            <UserOutlined />
            <span>Chi tiết bài thi của: <strong>{detailModal.student?.ho_ten}</strong></span>
            <Tag color="green">Điểm: {detailModal.student?.score}/10đ</Tag>
          </Space>
        }
        width={680}
      >
        <div style={{ marginTop: 12 }}>
          <Paragraph>
            Thời gian nộp bài: <strong>{detailModal.student?.time ? formatDateTime(detailModal.student.time) : '—'}</strong>
            <br />
            Số câu đúng: <strong>{detailModal.student?.correctCount || 0}/{examConfig.questions?.length || 4} câu</strong>
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
                    borderRadius: 8,
                    borderLeft: `4px solid ${isCorrect ? '#52c41a' : '#ff4d4f'}`,
                    background: isCorrect ? '#f6ffed' : '#fff1f0',
                  }}
                >
                  <Text strong>
                    Câu {idx + 1}: {q.noi_dung}
                  </Text>
                  <div style={{ marginTop: 8 }}>
                    <p style={{ margin: '2px 0' }}>
                      • Học sinh chọn: <strong>{studentChoice || 'Chưa chọn'}</strong>{' '}
                      {isCorrect ? (
                        <Tag color="green"><CheckCircleOutlined /> Chính xác</Tag>
                      ) : (
                        <Tag color="red"><CloseCircleOutlined /> Sai (Đáp án đúng: {q.dap_an_dung})</Tag>
                      )}
                    </p>
                    <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>
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

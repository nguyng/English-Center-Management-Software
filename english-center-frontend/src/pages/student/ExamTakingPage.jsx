import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Radio, Button, Typography, Space, Alert, Progress, Modal, Tag, Result } from 'antd';
import { ClockCircleOutlined, SafetyCertificateOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { roundScore } from '../../utils/validators';

const { Title, Text, Paragraph } = Typography;

// Mock data bài thi online
const mockExamData = {
  id: 101,
  ten_bai_kiem_tra: 'Bài kiểm tra Từ Vựng & Ngữ Pháp Unit 3',
  thoi_gian_phut: 15,
  questions: [
    {
      id: 1,
      noi_dung: 'Choose the correct word: "She _______ to school every morning."',
      dap_an_a: 'go',
      dap_an_b: 'goes',
      dap_an_c: 'going',
      dap_an_d: 'went',
      dap_an_dung: 'B',
    },
    {
      id: 2,
      noi_dung: 'What is the opposite of "generous"?',
      dap_an_a: 'selfish',
      dap_an_b: 'kind',
      dap_an_c: 'helpful',
      dap_an_d: 'friendly',
      dap_an_dung: 'A',
    },
    {
      id: 3,
      noi_dung: 'Complete the sentence: "I have been learning English _______ 3 years."',
      dap_an_a: 'since',
      dap_an_b: 'in',
      dap_an_c: 'for',
      dap_an_d: 'at',
      dap_an_dung: 'C',
    },
    {
      id: 4,
      noi_dung: 'Which word has the underlined part pronounced differently?',
      dap_an_a: 'cats',
      dap_an_b: 'dogs',
      dap_an_c: 'books',
      dap_an_d: 'hats',
      dap_an_dung: 'B',
    },
  ],
};

const mockStudentsInClass = [
  { id: 1, ho_ten: 'Nguyễn Văn An' },
  { id: 2, ho_ten: 'Trần Thị Bảo' },
  { id: 4, ho_ten: 'Phạm Minh Đức' },
  { id: 5, ho_ten: 'Hoàng Thu Hà' },
];

export default function ExamTakingPage() {
  const { examId } = useParams();

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(mockExamData.thoi_gian_phut * 60);
  const [submitted, setSubmitted] = useState(false);
  const [finalScore, setFinalScore] = useState(null);
  const [tabWarnings, setTabWarnings] = useState(0);

  // Khôi phục bài làm từ localStorage khi chọn học sinh
  useEffect(() => {
    if (selectedStudent) {
      const storageKey = `exam_${examId}_student_${selectedStudent.id}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.submitted) {
            setSubmitted(true);
            setFinalScore(parsed.score);
          } else if (parsed.answers) {
            setAnswers(parsed.answers);
          }
        } catch {
          // ignore error
        }
      }
    }
  }, [selectedStudent, examId]);

  // Tự động lưu tiến độ vào localStorage
  useEffect(() => {
    if (selectedStudent && !submitted) {
      const storageKey = `exam_${examId}_student_${selectedStudent.id}`;
      localStorage.setItem(storageKey, JSON.stringify({ answers, submitted: false }));
    }
  }, [answers, selectedStudent, examId, submitted]);

  // Đồng hồ đếm ngược
  useEffect(() => {
    if (!selectedStudent || submitted) return;
    if (timeLeft <= 0) {
      handleSubmit('Hết giờ làm bài!');
      return;
    }
    const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, selectedStudent, submitted]);

  // Cơ chế chống gian lận: bắt sự kiện rời tab (visibilitychange)
  useEffect(() => {
    if (!selectedStudent || submitted) return;

    const handleVisibility = () => {
      if (document.hidden) {
        setTabWarnings((prev) => {
          const count = prev + 1;
          if (count === 1) {
            Modal.warning({
              title: '⚠️ CẢNH BÁO RỜI TAB THI',
              content: 'Hệ thống phát hiện bạn vừa rời khỏi màn hình làm bài! Nếu vi phạm thêm 1 lần nữa, bài thi sẽ bị TỰ ĐỘNG THU HỒI VÀ NỘP NGAY LẬP TỨC.',
              okText: 'Tôi đã hiểu và quay lại làm bài',
            });
          } else if (count >= 2) {
            handleSubmit('Vi phạm quy chế thi: Rời tab 2 lần');
          }
          return count;
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [selectedStudent, submitted]);

  const handleSelectAnswer = (questionId, option) => {
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  const handleSubmit = (reason) => {
    if (submitted) return;

    // Chấm điểm tự động trắc nghiệm
    let correctCount = 0;
    mockExamData.questions.forEach((q) => {
      if (answers[q.id] === q.dap_an_dung) {
        correctCount += 1;
      }
    });

    const rawScore = (correctCount / mockExamData.questions.length) * 10;
    const score = roundScore(rawScore);

    setFinalScore(score);
    setSubmitted(true);

    if (selectedStudent) {
      const storageKey = `exam_${examId}_student_${selectedStudent.id}`;
      localStorage.setItem(
        storageKey,
        JSON.stringify({ answers, submitted: true, score, correctCount, reason })
      );
    }

    if (reason) {
      Modal.info({
        title: 'Nộp bài tự động',
        content: `${reason}. Điểm của bạn đã được ghi nhận: ${score}/10`,
      });
    }
  };

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Màn hình chọn danh tính trước khi thi
  if (!selectedStudent) {
    return (
      <div style={{ maxWidth: 540, margin: '60px auto', padding: 24 }}>
        <Card style={{ borderRadius: 16, boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <SafetyCertificateOutlined style={{ fontSize: 44, color: '#1890ff' }} />
            <Title level={3} style={{ marginTop: 12, marginBottom: 4 }}>
              Cổng Thi Trắc Nghiệm Online
            </Title>
            <Text type="secondary">{mockExamData.ten_bai_kiem_tra}</Text>
          </div>

          <Paragraph>
            Vui lòng chọn đúng tên học sinh để bắt đầu tính giờ làm bài ({mockExamData.thoi_gian_phut} phút):
          </Paragraph>

          <Space direction="vertical" style={{ width: '100%' }}>
            {mockStudentsInClass.map((s) => (
              <Button
                key={s.id}
                size="large"
                block
                style={{ textAlign: 'left', height: 48 }}
                onClick={() => setSelectedStudent(s)}
              >
                👤 {s.ho_ten}
              </Button>
            ))}
          </Space>
        </Card>
      </div>
    );
  }

  // Màn hình kết quả sau khi nộp
  if (submitted) {
    return (
      <div style={{ maxWidth: 600, margin: '60px auto', padding: 24 }}>
        <Card style={{ borderRadius: 16, textAlign: 'center' }}>
          <Result
            status="success"
            title={`Chúc mừng ${selectedStudent.ho_ten} đã hoàn thành bài thi!`}
            subTitle={`Kết quả của bạn: ${finalScore} / 10 điểm`}
            extra={[
              <Alert
                key="notice"
                type="info"
                showIcon
                message="Kết quả đã được ghi nhận vào hệ thống và sẽ gửi thông báo điểm tới phụ huynh qua Zalo vào cuối ca học."
                style={{ textAlign: 'left', marginTop: 16 }}
              />,
            ]}
          />
        </Card>
      </div>
    );
  }

  // Màn hình làm bài
  const answeredCount = Object.keys(answers).length;
  const progressPercent = Math.round((answeredCount / mockExamData.questions.length) * 100);

  return (
    <div style={{ maxWidth: 760, margin: '20px auto', padding: '0 16px' }}>
      {/* Thanh Header nổi cố định */}
      <Card
        size="small"
        style={{
          position: 'sticky',
          top: 10,
          zIndex: 100,
          borderRadius: 12,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          marginBottom: 20,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Text strong style={{ fontSize: 16 }}>👤 {selectedStudent.ho_ten}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 13 }}>Đã làm: {answeredCount}/{mockExamData.questions.length} câu</Text>
          </div>
          <div style={{ textAlign: 'right' }}>
            <Tag
              icon={<ClockCircleOutlined />}
              color={timeLeft < 180 ? 'error' : 'processing'}
              style={{ fontSize: 16, padding: '4px 12px' }}
            >
              {formatTimer(timeLeft)}
            </Tag>
          </div>
        </div>
        <Progress percent={progressPercent} size="small" showInfo={false} style={{ marginTop: 8 }} />
      </Card>

      {/* Danh sách câu hỏi */}
      <Space direction="vertical" size="large" style={{ width: '100%', marginBottom: 32 }}>
        {mockExamData.questions.map((q, idx) => (
          <Card key={q.id} style={{ borderRadius: 12, border: answers[q.id] ? '1px solid #91caff' : undefined }}>
            <Title level={5}>
              Câu {idx + 1}: {q.noi_dung}
            </Title>
            <Radio.Group
              value={answers[q.id]}
              onChange={(e) => handleSelectAnswer(q.id, e.target.value)}
              style={{ width: '100%', marginTop: 8 }}
            >
              <Space direction="vertical" style={{ orientation: 'vertical', width: '100%' }}>
                <Radio value="A" style={{ width: '100%', padding: '8px 12px', background: '#fafafa', borderRadius: 8 }}>
                  <strong>A.</strong> {q.dap_an_a}
                </Radio>
                <Radio value="B" style={{ width: '100%', padding: '8px 12px', background: '#fafafa', borderRadius: 8 }}>
                  <strong>B.</strong> {q.dap_an_b}
                </Radio>
                <Radio value="C" style={{ width: '100%', padding: '8px 12px', background: '#fafafa', borderRadius: 8 }}>
                  <strong>C.</strong> {q.dap_an_c}
                </Radio>
                <Radio value="D" style={{ width: '100%', padding: '8px 12px', background: '#fafafa', borderRadius: 8 }}>
                  <strong>D.</strong> {q.dap_an_d}
                </Radio>
              </Space>
            </Radio.Group>
          </Card>
        ))}
      </Space>

      <div style={{ textAlign: 'center', marginBottom: 60 }}>
        <Button
          type="primary"
          size="large"
          style={{ minWidth: 260, height: 48, fontSize: 16, borderRadius: 8 }}
          onClick={() => {
            Modal.confirm({
              title: 'Xác nhận nộp bài thi?',
              content: `Bạn đã trả lời ${answeredCount}/${mockExamData.questions.length} câu hỏi. Bạn có chắc chắn muốn nộp bài?`,
              okText: 'Nộp bài ngay',
              cancelText: 'Làm tiếp',
              onOk: () => handleSubmit('Học sinh chủ động bấm nộp bài'),
            });
          }}
        >
          Hoàn thành & Nộp bài thi
        </Button>
      </div>
    </div>
  );
}


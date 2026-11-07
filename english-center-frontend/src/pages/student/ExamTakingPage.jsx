import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Card, Radio, Button, Typography, Space, Alert, Progress, Modal, Tag, Result, Input } from 'antd';
import { ClockCircleOutlined, SafetyCertificateOutlined, LockOutlined, EyeOutlined, CheckCircleOutlined, WarningOutlined } from '@ant-design/icons';
import { roundScore } from '../../utils/validators';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;

const defaultMockExam = {
  id: 101,
  ten_bai_kiem_tra: 'Bài kiểm tra Từ Vựng & Ngữ Pháp Unit 3',
  lop: 'Lớp A1 - Starter',
  ngay_thi: dayjs().format('YYYY-MM-DD'),
  gio_mo_de: '07:00',
  gio_dong_de: '23:00',
  ma_vao_thi: '1234',
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
  const [searchParams] = useSearchParams();
  const isPreview = searchParams.get('preview') === 'true';

  // Lấy cấu hình đề thi từ localStorage nếu GV vừa tạo, hoặc dùng default
  const [examData, setExamData] = useState(() => {
    try {
      const savedConfig = localStorage.getItem(`exam_config_${examId}`);
      if (savedConfig) return JSON.parse(savedConfig);
    } catch {}
    return { ...defaultMockExam, id: examId };
  });

  const [selectedStudent, setSelectedStudent] = useState(
    isPreview ? { id: 9999, ho_ten: 'Giáo viên xem trước' } : null
  );
  const [passcodeModal, setPasscodeModal] = useState({ open: false, student: null, inputCode: '', error: '' });
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [finalScore, setFinalScore] = useState(null);
  const [tabWarnings, setTabWarnings] = useState(0);

  // Tính toán thời gian cố định
  const calculateRemainingSeconds = () => {
    const examDate = examData.ngay_thi || dayjs().format('YYYY-MM-DD');
    const closeTimeStr = examData.gio_dong_de || '23:00';
    const closeDateTime = dayjs(`${examDate} ${closeTimeStr}`, 'YYYY-MM-DD HH:mm');
    const diff = closeDateTime.diff(dayjs(), 'second');
    return Math.max(0, diff);
  };

  const [timeLeft, setTimeLeft] = useState(calculateRemainingSeconds());

  // Kiểm tra cổng thi mở hay đóng
  const isTooEarly = () => {
    if (isPreview) return false;
    const examDate = examData.ngay_thi || dayjs().format('YYYY-MM-DD');
    const openTimeStr = examData.gio_mo_de || '07:00';
    const openDateTime = dayjs(`${examDate} ${openTimeStr}`, 'YYYY-MM-DD HH:mm');
    return dayjs().isBefore(openDateTime);
  };

  const isTooLate = () => {
    if (isPreview) return false;
    const examDate = examData.ngay_thi || dayjs().format('YYYY-MM-DD');
    const closeTimeStr = examData.gio_dong_de || '23:00';
    const closeDateTime = dayjs(`${examDate} ${closeTimeStr}`, 'YYYY-MM-DD HH:mm');
    return dayjs().isAfter(closeDateTime);
  };

  // Khôi phục bài làm từ localStorage khi chọn học sinh (chỉ áp dụng thi thật)
  useEffect(() => {
    if (selectedStudent && !isPreview) {
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
        } catch {}
      }
    }
  }, [selectedStudent, examId, isPreview]);

  // Tự động lưu tiến độ vào localStorage (chỉ áp dụng thi thật)
  useEffect(() => {
    if (selectedStudent && !submitted && !isPreview) {
      const storageKey = `exam_${examId}_student_${selectedStudent.id}`;
      localStorage.setItem(storageKey, JSON.stringify({ answers, submitted: false }));
    }
  }, [answers, selectedStudent, examId, submitted, isPreview]);

  // Đồng hồ đếm ngược theo giờ đóng cổng
  useEffect(() => {
    if (!selectedStudent || submitted) return;

    if (timeLeft <= 0) {
      handleSubmit('Đã đến giờ đóng cổng thi!');
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(calculateRemainingSeconds());
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, selectedStudent, submitted]);

  // Chống gian lận: bắt sự kiện rời tab (chỉ áp dụng thi thật)
  useEffect(() => {
    if (!selectedStudent || submitted || isPreview) return;

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
  }, [selectedStudent, submitted, isPreview]);

  const handleSelectAnswer = (questionId, option) => {
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  const handleSubmit = (reason) => {
    if (submitted) return;

    // Chấm điểm tự động trắc nghiệm
    let correctCount = 0;
    examData.questions.forEach((q) => {
      if (answers[q.id] === q.dap_an_dung) {
        correctCount += 1;
      }
    });

    const rawScore = (correctCount / examData.questions.length) * 10;
    const score = roundScore(rawScore);

    setFinalScore(score);
    setSubmitted(true);

    // Chỉ lưu kết quả của học sinh thật, KHÔNG LƯU KẾT QUẢ GIÁO VIÊN XEM THỬ
    if (selectedStudent && !isPreview) {
      const storageKey = `exam_${examId}_student_${selectedStudent.id}`;
      const record = {
        answers,
        submitted: true,
        score,
        correctCount,
        totalQuestions: examData.questions.length,
        submittedAt: new Date().toISOString(),
        studentName: selectedStudent.ho_ten,
        reason: reason || 'Nộp bài bình thường',
      };
      localStorage.setItem(storageKey, JSON.stringify(record));

      // Thêm vào danh sách nộp bài của bài thi để giáo viên xem kết quả
      try {
        const classSubmissionsKey = `exam_submissions_${examId}`;
        const existing = JSON.parse(localStorage.getItem(classSubmissionsKey) || '[]');
        const updated = existing.filter((item) => item.studentId !== selectedStudent.id);
        updated.push({ studentId: selectedStudent.id, ...record });
        localStorage.setItem(classSubmissionsKey, JSON.stringify(updated));
      } catch {}
    }

    if (reason) {
      Modal.info({
        title: 'Cổng thi nộp bài tự động',
        content: `${reason}. Điểm của bạn: ${score}/10`,
      });
    }
  };

  const formatTimer = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getStudentSubmission = (studentId) => {
    try {
      const saved = localStorage.getItem(`exam_${examId}_student_${studentId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.submitted) return parsed;
      }
    } catch {}
    return null;
  };

  // Xác thực mã PIN vào thi (Chống thi hộ)
  const handleVerifyPasscode = () => {
    const requiredCode = examData.ma_vao_thi || '1234';
    if (passcodeModal.inputCode.trim() !== requiredCode.trim()) {
      setPasscodeModal((prev) => ({ ...prev, error: 'Mã vào thi không chính xác! Vui lòng hỏi lại giáo viên.' }));
      return;
    }

    setSelectedStudent(passcodeModal.student);
    setPasscodeModal({ open: false, student: null, inputCode: '', error: '' });
  };

  // 1. Màn hình Cổng thi chưa mở
  if (isTooEarly()) {
    return (
      <div style={{ maxWidth: 540, margin: '80px auto', padding: 24 }}>
        <Card style={{ borderRadius: 16, textAlign: 'center' }}>
          <ClockCircleOutlined style={{ fontSize: 52, color: '#faad14' }} />
          <Title level={3} style={{ marginTop: 16 }}>Cổng thi chưa mở</Title>
          <Paragraph>
            Bài thi <strong>"{examData.ten_bai_kiem_tra}"</strong> sẽ mở vào lúc:
          </Paragraph>
          <Tag color="orange" style={{ fontSize: 18, padding: '6px 16px' }}>
            {examData.gio_mo_de} ngày {examData.ngay_thi}
          </Tag>
          <Paragraph style={{ marginTop: 16, color: '#888' }}>
            Vui lòng quay lại đúng giờ để được mở đề thi.
          </Paragraph>
        </Card>
      </div>
    );
  }

  // 2. Màn hình Cổng thi đã kết thúc
  if (isTooLate() && !submitted) {
    return (
      <div style={{ maxWidth: 540, margin: '80px auto', padding: 24 }}>
        <Card style={{ borderRadius: 16, textAlign: 'center' }}>
          <WarningOutlined style={{ fontSize: 52, color: '#ff4d4f' }} />
          <Title level={3} style={{ marginTop: 16 }}>Cổng thi đã đóng</Title>
          <Paragraph>
            Thời gian làm bài thi <strong>"{examData.ten_bai_kiem_tra}"</strong> đã kết thúc lúc <strong>{examData.gio_dong_de}</strong>.
          </Paragraph>
          <Alert
            type="error"
            message="Không thể nộp bài hoặc làm bài thi sau thời gian quy định."
            style={{ textAlign: 'left', marginTop: 16 }}
          />
        </Card>
      </div>
    );
  }

  // 3. Màn hình chọn danh tính trước khi thi (có nhập mã bảo mật)
  if (!selectedStudent) {
    return (
      <div style={{ maxWidth: 560, margin: '60px auto', padding: 24 }}>
        <Card style={{ borderRadius: 16, boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <SafetyCertificateOutlined style={{ fontSize: 48, color: '#1890ff' }} />
            <Title level={3} style={{ marginTop: 12, marginBottom: 4 }}>
              Cổng Thi Trắc Nghiệm Online
            </Title>
            <Text type="secondary">{examData.ten_bai_kiem_tra} — {examData.lop}</Text>
          </div>

          <Alert
            type="info"
            showIcon
            message="Quy định giờ thi cố định & Mã bảo mật"
            description={
              <div>
                • Khung giờ mở đề: <strong>{examData.gio_mo_de} đến {examData.gio_dong_de}</strong>
                <br />
                • Cần nhập <strong>Mã vào thi do giáo viên cấp</strong> để tránh trường hợp thi hộ.
              </div>
            }
            style={{ marginBottom: 20 }}
          />

          <Paragraph>
            Vui lòng chọn đúng tên học sinh của bạn trong danh sách:
          </Paragraph>

          <Space direction="vertical" style={{ width: '100%' }}>
            {mockStudentsInClass.map((s) => {
              const sub = getStudentSubmission(s.id);
              return (
                <Button
                  key={s.id}
                  size="large"
                  block
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    height: 52,
                    borderRadius: 8,
                    borderColor: sub ? '#b7eb8f' : undefined,
                    background: sub ? '#f6ffed' : undefined,
                  }}
                  onClick={() => {
                    if (sub) {
                      // Đã làm rồi -> vào xem lại kết quả
                      setSelectedStudent(s);
                    } else {
                      // Chưa làm -> yêu cầu nhập mã bảo mật
                      setPasscodeModal({ open: true, student: s, inputCode: '', error: '' });
                    }
                  }}
                >
                  <span>👤 <strong>{s.ho_ten}</strong></span>
                  {sub ? (
                    <Tag color="green">Đã nộp: {sub.score}/10đ (Bấm để xem lại)</Tag>
                  ) : (
                    <Tag color="blue"><LockOutlined /> Cần mã để làm bài</Tag>
                  )}
                </Button>
              );
            })}
          </Space>
        </Card>

        {/* Modal Nhập Mã Vào Thi (Chống thi hộ) */}
        <Modal
          open={passcodeModal.open}
          onCancel={() => setPasscodeModal({ open: false, student: null, inputCode: '', error: '' })}
          onOk={handleVerifyPasscode}
          title={`🔒 Xác thực tham gia bài thi: ${passcodeModal.student?.ho_ten}`}
          okText="Xác nhận & Bắt đầu làm bài"
          cancelText="Quay lại"
          centered
        >
          <div style={{ padding: '12px 0' }}>
            <Paragraph>
              Vui lòng nhập <strong>Mã vào thi (PIN)</strong> do giáo viên cung cấp tại lớp:
            </Paragraph>
            <Input
              prefix={<LockOutlined />}
              placeholder="Nhập mã vào thi (Ví dụ: 1234)"
              size="large"
              value={passcodeModal.inputCode}
              onChange={(e) => setPasscodeModal((prev) => ({ ...prev, inputCode: e.target.value, error: '' }))}
              onPressEnter={handleVerifyPasscode}
              autoFocus
            />
            {passcodeModal.error && (
              <Text type="danger" style={{ display: 'block', marginTop: 8 }}>
                ⚠️ {passcodeModal.error}
              </Text>
            )}
            <div style={{ marginTop: 12, fontSize: 12, color: '#888' }}>
              💡 Mã này chỉ được cấp trong giờ học để đảm bảo bạn là người trực tiếp làm bài thi.
            </div>
          </div>
        </Modal>
      </div>
    );
  }

  // 4. Màn hình kết quả sau khi nộp
  if (submitted) {
    return (
      <div style={{ maxWidth: 640, margin: '60px auto', padding: 24 }}>
        {isPreview && (
          <Alert
            type="warning"
            showIcon
            message="👁️ ĐÂY LÀ CHẾ ĐỘ XEM TRƯỚC CỦA GIÁO VIÊN"
            description="Bài nộp thử này chỉ để kiểm tra đề thi, hoàn toàn KHÔNG lưu vào kết quả của bất kỳ học sinh nào trong lớp."
            style={{ marginBottom: 16 }}
          />
        )}
        <Card style={{ borderRadius: 16, textAlign: 'center' }}>
          <Result
            status="success"
            title={isPreview ? 'Hoàn thành làm thử bài thi!' : `Chúc mừng ${selectedStudent.ho_ten} đã hoàn thành bài thi!`}
            subTitle={`Kết quả: ${finalScore} / 10 điểm`}
            extra={[
              <Alert
                key="notice"
                type="info"
                showIcon
                message={
                  isPreview
                    ? 'Bạn đang ở chế độ xem thử. Kết quả của học sinh thật sẽ được ghi vào trang "Bảng Điểm Bài Thi".'
                    : 'Kết quả đã được ghi nhận vào hệ thống. Cuối ca học, phụ huynh sẽ nhận được thông báo điểm số qua Zalo.'
                }
                style={{ textAlign: 'left', marginTop: 16, marginBottom: 20 }}
              />,
              <Space key="actions" wrap style={{ justifyContent: 'center' }}>
                {isPreview ? (
                  <Button type="primary" onClick={() => window.close()}>
                    Đóng cửa sổ xem thử
                  </Button>
                ) : (
                  <Button onClick={() => setSelectedStudent(null)}>
                    Quay lại danh sách lớp
                  </Button>
                )}
              </Space>,
            ]}
          />
        </Card>
      </div>
    );
  }

  // 5. Màn hình làm bài thi
  const answeredCount = Object.keys(answers).length;
  const progressPercent = Math.round((answeredCount / examData.questions.length) * 100);

  return (
    <div style={{ maxWidth: 760, margin: '20px auto', padding: '0 16px' }}>
      {/* Banner nếu là Giáo viên xem thử */}
      {isPreview && (
        <Alert
          type="warning"
          showIcon
          banner
          message="👁️ BẠN ĐANG Ở CHẾ ĐỘ XEM THỬ ĐỀ THI (GIÁO VIÊN) — Mọi câu trả lời của bạn không ảnh hưởng tới dữ liệu của học sinh."
          style={{ marginBottom: 16, borderRadius: 8 }}
        />
      )}

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
            <Text type="secondary" style={{ fontSize: 13 }}>
              Đã làm: {answeredCount}/{examData.questions.length} câu | Đóng cổng: <strong>{examData.gio_dong_de}</strong>
            </Text>
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
        {examData.questions.map((q, idx) => (
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
              content: `Bạn đã trả lời ${answeredCount}/${examData.questions.length} câu hỏi. Bạn có chắc chắn muốn nộp bài?`,
              okText: 'Nộp bài ngay',
              cancelText: 'Làm tiếp',
              onOk: () => handleSubmit('Học sinh chủ động bấm nộp bài'),
            });
          }}
        >
          {isPreview ? 'Nộp bài xem thử (Không lưu)' : 'Hoàn thành & Nộp bài thi'}
        </Button>
      </div>
    </div>
  );
}

import { useState } from 'react';
import {
  Form,
  Input,
  Button,
  Card,
  Space,
  Typography,
  Radio,
  DatePicker,
  TimePicker,
  Select,
  App as AntApp,
  Tag,
  Modal,
  Alert,
  Row,
  Col,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  SaveOutlined,
  CopyOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  LockOutlined,
  FormOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { EXAM_TYPE } from '../../utils/constants';

const { Title, Text, Paragraph } = Typography;

export default function ExamCreatePage() {
  const [form] = Form.useForm();
  const [examType, setExamType] = useState(EXAM_TYPE.HE_THONG);
  const [questions, setQuestions] = useState([
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
  ]);
  const [currentQuestion, setCurrentQuestion] = useState({
    noi_dung: '',
    dap_an_a: '',
    dap_an_b: '',
    dap_an_c: '',
    dap_an_d: '',
    dap_an_dung: 'A',
  });
  const [createdExamModal, setCreatedExamModal] = useState({
    open: false,
    examId: null,
    examName: '',
    passCode: '',
    openTime: '',
    closeTime: '',
  });

  const { message } = AntApp.useApp();
  const navigate = useNavigate();

  const addQuestion = () => {
    if (!currentQuestion.noi_dung.trim()) {
      message.warning('Vui lòng nhập nội dung câu hỏi!');
      return;
    }
    if (!currentQuestion.dap_an_a || !currentQuestion.dap_an_b) {
      message.warning('Cần ít nhất 2 đáp án (A và B)!');
      return;
    }
    setQuestions((prev) => [...prev, { ...currentQuestion, id: Date.now() }]);
    setCurrentQuestion({
      noi_dung: '',
      dap_an_a: '',
      dap_an_b: '',
      dap_an_c: '',
      dap_an_d: '',
      dap_an_dung: 'A',
    });
    message.success(`Đã thêm câu ${questions.length + 1}`);
  };

  const removeQuestion = (id) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (examType === EXAM_TYPE.HE_THONG && questions.length === 0) {
        message.error('Thi online cần ít nhất 1 câu hỏi trắc nghiệm!');
        return;
      }

      const openStr = values.gio_mo_de ? values.gio_mo_de.format('HH:mm') : '09:30';
      const closeStr = values.gio_dong_de ? values.gio_dong_de.format('HH:mm') : '10:00';
      const examDateStr = values.ngay_kiem_tra
        ? values.ngay_kiem_tra.format('YYYY-MM-DD')
        : dayjs().format('YYYY-MM-DD');
      const passCode = values.ma_vao_thi || '1234';
      const newExamId = Math.floor(100 + Math.random() * 900);

      // Lưu cấu hình bài thi vào localStorage
      const examConfig = {
        id: newExamId,
        ten_bai_kiem_tra: values.ten_bai_kiem_tra,
        lop: values.lop,
        hinh_thuc: examType,
        ngay_thi: examDateStr,
        gio_mo_de: openStr,
        gio_dong_de: closeStr,
        ma_vao_thi: passCode,
        questions: questions,
        created_at: new Date().toISOString(),
      };
      localStorage.setItem(`exam_config_${newExamId}`, JSON.stringify(examConfig));

      if (examType === EXAM_TYPE.HE_THONG) {
        setCreatedExamModal({
          open: true,
          examId: newExamId,
          examName: values.ten_bai_kiem_tra,
          passCode: passCode,
          openTime: openStr,
          closeTime: closeStr,
        });
      } else {
        message.success('Đã tạo bài kiểm tra thi giấy thành công!');
        navigate('/my-classes');
      }
    } catch {}
  };

  const examLink = `${window.location.origin}/thi/${createdExamModal.examId}`;
  const previewLink = `${window.location.origin}/thi/${createdExamModal.examId}?preview=true`;

  const handleCopyLink = () => {
    const textToCopy = `Link làm bài kiểm tra: ${examLink}\nMã bảo mật vào thi: ${createdExamModal.passCode}\nThời gian mở đề: ${createdExamModal.openTime} - Đóng đề: ${createdExamModal.closeTime}`;
    navigator.clipboard.writeText(textToCopy);
    message.success('📋 Đã sao chép link & mã bảo mật bài thi! Bạn có thể dán vào nhóm Zalo lớp.');
  };

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      <div className="edtech-page-header">
        <div>
          <Space align="center" size={10}>
            <Title level={4} style={{ margin: 0, fontWeight: 800 }}>
              Thiết Kế Đề Kiểm Tra Đánh Giá Năng Lực
            </Title>
            <Tag color="blue">{questions.length} câu hỏi</Tag>
          </Space>
          <Text type="secondary" style={{ display: 'block', marginTop: 4 }}>
            Khởi tạo đề thi trắc nghiệm trực tuyến có mã bảo mật PIN chống thi hộ hoặc bài kiểm tra giấy trên lớp.
          </Text>
        </div>
      </div>

      <Card
        className="edtech-card"
        title={
          <Space>
            <FormOutlined style={{ color: '#1e3a8a' }} />
            <span>Thông Tin Chung & Cấu Hình Khung Giờ Thi</span>
          </Space>
        }
        style={{ marginBottom: 20 }}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            ten_bai_kiem_tra: 'Kiểm tra Từ vựng & Ngữ pháp Unit 3',
            lop: 'Lớp A1 - Starter',
            ngay_kiem_tra: dayjs(),
            gio_mo_de: dayjs('08:00', 'HH:mm'),
            gio_dong_de: dayjs('22:00', 'HH:mm'),
            ma_vao_thi: '1234',
          }}
        >
          <Row gutter={16}>
            <Col xs={24} md={14}>
              <Form.Item
                name="ten_bai_kiem_tra"
                label="Tên bài kiểm tra"
                rules={[{ required: true, message: 'Vui lòng nhập tên bài thi!' }]}
              >
                <Input placeholder="Ví dụ: Từ vựng & Ngữ pháp Unit 3" />
              </Form.Item>
            </Col>
            <Col xs={24} md={10}>
              <Form.Item
                name="lop"
                label="Áp dụng cho lớp học"
                rules={[{ required: true, message: 'Chọn lớp!' }]}
              >
                <Select
                  options={[
                    { value: 'Lớp A1 - Starter', label: 'Lớp A1 - Starter' },
                    { value: 'Lớp B2 - Intermediate', label: 'Lớp B2 - Intermediate' },
                    { value: 'Lớp C1 - Advanced', label: 'Lớp C1 - Advanced' },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Hình thức tổ chức kiểm tra">
            <Radio.Group value={examType} onChange={(e) => setExamType(e.target.value)}>
              <Space direction="vertical" size={8}>
                <Radio value={EXAM_TYPE.HE_THONG}>
                  <strong>💻 Thi trên hệ thống (Online)</strong> — Cổng mở/đóng cố định, tự chấm điểm & có mã vào thi
                </Radio>
                <Radio value={EXAM_TYPE.GIAY}>
                  <strong>📝 Thi giấy tại lớp (Offline)</strong> — Học sinh làm bài trên giấy, giáo viên nhập điểm
                </Radio>
              </Space>
            </Radio.Group>
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} sm={8}>
              <Form.Item
                name="ngay_kiem_tra"
                label="Ngày kiểm tra"
                rules={[{ required: true, message: 'Vui lòng chọn ngày!' }]}
              >
                <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
              </Form.Item>
            </Col>

            {examType === EXAM_TYPE.HE_THONG && (
              <>
                <Col xs={12} sm={8}>
                  <Form.Item
                    name="gio_mo_de"
                    label="Giờ mở đề (Bắt đầu)"
                    rules={[{ required: true, message: 'Chọn giờ mở đề!' }]}
                    extra="Trước giờ này chưa thể mở đề"
                  >
                    <TimePicker format="HH:mm" minuteStep={5} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col xs={12} sm={8}>
                  <Form.Item
                    name="gio_dong_de"
                    label="Giờ đóng cổng (Thu bài)"
                    rules={[{ required: true, message: 'Chọn giờ đóng cổng!' }]}
                    extra="Tự động khóa & thu bài đúng giờ"
                  >
                    <TimePicker format="HH:mm" minuteStep={5} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </>
            )}
          </Row>

          {examType === EXAM_TYPE.HE_THONG && (
            <Form.Item
              name="ma_vao_thi"
              label="Mã PIN bảo mật vào thi (Chống thi hộ)"
              rules={[{ required: true, message: 'Vui lòng đặt mã bảo mật vào thi!' }]}
              extra="Giáo viên cung cấp mã này trong lớp để học sinh nhập vào mới được mở đề thi"
              style={{ marginBottom: 0 }}
            >
              <Input
                prefix={<LockOutlined style={{ color: '#0284c7' }} />}
                placeholder="Ví dụ: 1234 hoặc ENG2026"
                style={{ maxWidth: 280, fontWeight: 700 }}
              />
            </Form.Item>
          )}
        </Form>
      </Card>

      {/* Phần tạo câu hỏi — chỉ cho thi online */}
      {examType === EXAM_TYPE.HE_THONG && (
        <>
          <Card
            className="edtech-card"
            title={
              <Space>
                <PlusOutlined style={{ color: '#0284c7' }} />
                <span>Soạn Câu Hỏi Trắc Nghiệm Mới</span>
              </Space>
            }
            style={{ marginBottom: 20 }}
          >
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <div>
                <Text strong style={{ display: 'block', marginBottom: 6 }}>
                  Nội dung câu hỏi tiếng Anh:
                </Text>
                <Input.TextArea
                  placeholder='Nhập câu hỏi (Ví dụ: Choose the correct word: "She _______ to school every morning.")'
                  rows={2}
                  value={currentQuestion.noi_dung}
                  onChange={(e) => setCurrentQuestion((p) => ({ ...p, noi_dung: e.target.value }))}
                />
              </div>

              <Row gutter={[12, 12]}>
                {['A', 'B', 'C', 'D'].map((opt) => {
                  const key = `dap_an_${opt.toLowerCase()}`;
                  return (
                    <Col xs={24} sm={12} key={opt}>
                      <Input
                        addonBefore={<strong>{opt}</strong>}
                        placeholder={`Nhập phương án ${opt}`}
                        value={currentQuestion[key]}
                        onChange={(e) =>
                          setCurrentQuestion((p) => ({ ...p, [key]: e.target.value }))
                        }
                      />
                    </Col>
                  );
                })}
              </Row>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 12,
                  background: '#f8fafc',
                  padding: '12px 16px',
                  borderRadius: 10,
                  border: '1px solid #e2e8f0',
                }}
              >
                <Space>
                  <Text strong>Chọn đáp án đúng:</Text>
                  <Radio.Group
                    value={currentQuestion.dap_an_dung}
                    onChange={(e) =>
                      setCurrentQuestion((p) => ({ ...p, dap_an_dung: e.target.value }))
                    }
                    buttonStyle="solid"
                  >
                    <Radio.Button value="A">Đáp án A</Radio.Button>
                    <Radio.Button value="B">Đáp án B</Radio.Button>
                    <Radio.Button value="C">Đáp án C</Radio.Button>
                    <Radio.Button value="D">Đáp án D</Radio.Button>
                  </Radio.Group>
                </Space>

                <Button type="primary" icon={<PlusOutlined />} onClick={addQuestion}>
                  Thêm vào đề thi
                </Button>
              </div>
            </Space>
          </Card>

          {/* Danh sách câu hỏi đã thêm */}
          {questions.length > 0 && (
            <Card
              className="edtech-card"
              title={
                <Space>
                  <QuestionCircleOutlined style={{ color: '#1e3a8a' }} />
                  <span>Ngân Hàng Câu Hỏi Trong Đề ({questions.length} câu)</span>
                </Space>
              }
              style={{ marginBottom: 24 }}
            >
              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                {questions.map((q, idx) => (
                  <div
                    key={q.id}
                    style={{
                      padding: '16px 20px',
                      borderRadius: 12,
                      border: '1px solid #e2e8f0',
                      background: '#ffffff',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: 16,
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                        <Tag color="geekblue" style={{ margin: 0, fontWeight: 700 }}>
                          Câu {idx + 1}
                        </Tag>
                        <Text strong style={{ fontSize: 14.5, color: '#0f172a' }}>
                          {q.noi_dung}
                        </Text>
                      </div>
                      <Space wrap size={8}>
                        <Tag color={q.dap_an_dung === 'A' ? 'success' : 'default'}>
                          A: {q.dap_an_a}
                        </Tag>
                        <Tag color={q.dap_an_dung === 'B' ? 'success' : 'default'}>
                          B: {q.dap_an_b}
                        </Tag>
                        {q.dap_an_c && (
                          <Tag color={q.dap_an_dung === 'C' ? 'success' : 'default'}>
                            C: {q.dap_an_c}
                          </Tag>
                        )}
                        {q.dap_an_d && (
                          <Tag color={q.dap_an_dung === 'D' ? 'success' : 'default'}>
                            D: {q.dap_an_d}
                          </Tag>
                        )}
                      </Space>
                    </div>
                    <Button
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={() => removeQuestion(q.id)}
                    >
                      Xóa
                    </Button>
                  </div>
                ))}
              </Space>
            </Card>
          )}
        </>
      )}

      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <Button
          type="primary"
          size="large"
          className="btn-cta-orange"
          icon={<SaveOutlined />}
          onClick={handleSubmit}
          style={{ height: 50, minWidth: 300, fontSize: 16, borderRadius: 10 }}
        >
          {examType === EXAM_TYPE.GIAY
            ? 'Lưu bài kiểm tra giấy'
            : `Tạo & Xuất Link Bài Thi (${questions.length} câu)`}
        </Button>
      </div>

      {/* Modal hiển thị link bài thi cho giáo viên */}
      <Modal
        open={createdExamModal.open}
        onCancel={() =>
          setCreatedExamModal({
            open: false,
            examId: null,
            examName: '',
            passCode: '',
            openTime: '',
            closeTime: '',
          })
        }
        footer={null}
        title={
          <Space>
            <CheckCircleOutlined style={{ color: '#10b981', fontSize: 22 }} />
            <span>Tạo bài thi online thành công!</span>
          </Space>
        }
        centered
        width={580}
      >
        <div style={{ padding: '12px 0' }}>
          <Alert
            type="info"
            showIcon
            message="Thông tin Cổng thi & Mã bảo mật"
            description={
              <div style={{ marginTop: 4 }}>
                • Khung giờ mở đề: <strong>{createdExamModal.openTime} - {createdExamModal.closeTime}</strong>
                <br />
                • Mã bảo mật vào thi (PIN):{' '}
                <Tag color="magenta" style={{ fontSize: 15, fontWeight: 'bold' }}>
                  {createdExamModal.passCode}
                </Tag>
              </div>
            }
            style={{ marginBottom: 16, borderRadius: 10 }}
          />

          <Paragraph>
            Sao chép đường dẫn dưới đây và gửi vào nhóm Zalo lớp để học viên truy cập làm bài:
          </Paragraph>

          <Input.Search
            value={examLink}
            enterButton={
              <>
                <CopyOutlined /> Sao chép Link & Mã
              </>
            }
            onSearch={handleCopyLink}
            readOnly
            size="large"
            style={{ marginBottom: 20 }}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <Button icon={<EyeOutlined />} onClick={() => window.open(previewLink, '_blank')}>
              👁️ Mở xem thử (Chế độ Giáo viên)
            </Button>
            <Button type="primary" onClick={() => navigate('/my-classes')}>
              Hoàn thành
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

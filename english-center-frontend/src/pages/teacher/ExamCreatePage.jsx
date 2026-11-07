import { useState } from 'react';
import {
  Form,
  Input,
  InputNumber,
  Button,
  Card,
  Space,
  Typography,
  Radio,
  DatePicker,
  List,
  App as AntApp,
  Tag,
  Modal,
} from 'antd';
import { PlusOutlined, DeleteOutlined, SaveOutlined, CopyOutlined, EyeOutlined, CheckCircleOutlined } from '@ant-design/icons';
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
  ]);
  const [currentQuestion, setCurrentQuestion] = useState({
    noi_dung: '',
    dap_an_a: '',
    dap_an_b: '',
    dap_an_c: '',
    dap_an_d: '',
    dap_an_dung: 'A',
  });
  const [createdExamModal, setCreatedExamModal] = useState({ open: false, examId: null, examName: '' });

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
        message.error('Thi online cần ít nhất 1 câu hỏi!');
        return;
      }
      
      const newExamId = Math.floor(100 + Math.random() * 900);
      
      if (examType === EXAM_TYPE.HE_THONG) {
        setCreatedExamModal({
          open: true,
          examId: newExamId,
          examName: values.ten_bai_kiem_tra,
        });
      } else {
        message.success('Đã tạo bài kiểm tra thi giấy thành công!');
        navigate('/my-classes');
      }
    } catch {
      // validation error
    }
  };

  const examLink = `${window.location.origin}/thi/${createdExamModal.examId}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(examLink);
    message.success('📋 Đã sao chép link bài thi! Bạn có thể dán ngay vào nhóm Zalo lớp.');
  };

  return (
    <div style={{ maxWidth: 840, margin: '0 auto' }}>
      <Title level={4}>📝 Tạo bài kiểm tra mới</Title>

      <Card style={{ borderRadius: 12, marginBottom: 16 }}>
        <Form form={form} layout="vertical" initialValues={{ ten_bai_kiem_tra: 'Kiểm tra Từ vựng & Ngữ pháp Unit 3' }}>
          <Form.Item
            name="ten_bai_kiem_tra"
            label="Tên bài kiểm tra"
            rules={[{ required: true, message: 'Vui lòng nhập tên bài thi!' }]}
          >
            <Input placeholder="Ví dụ: Từ vựng Unit 3" />
          </Form.Item>

          <Form.Item label="Hình thức thi">
            <Radio.Group value={examType} onChange={(e) => setExamType(e.target.value)}>
              <Radio value={EXAM_TYPE.HE_THONG}>💻 Thi trên hệ thống (Online) — Hệ thống tự tạo link & tự chấm điểm</Radio>
              <Radio value={EXAM_TYPE.GIAY}>📝 Thi giấy (Offline) — Học sinh làm ra giấy tại lớp</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            name="ngay_kiem_tra"
            label="Ngày kiểm tra"
            initialValue={dayjs()}
          >
            <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
          </Form.Item>

          {examType === EXAM_TYPE.HE_THONG && (
            <Form.Item
              name="thoi_gian_phut"
              label="Thời gian làm bài (phút)"
              initialValue={15}
              rules={[{ required: true }]}
            >
              <InputNumber min={5} max={120} style={{ width: '100%' }} />
            </Form.Item>
          )}
        </Form>
      </Card>

      {/* Phần tạo câu hỏi — chỉ cho thi online */}
      {examType === EXAM_TYPE.HE_THONG && (
        <>
          <Card
            title={`Thêm câu hỏi trắc nghiệm (Hiện có: ${questions.length} câu)`}
            style={{ borderRadius: 12, marginBottom: 16 }}
          >
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <Input.TextArea
                placeholder="Nhập nội dung câu hỏi..."
                rows={2}
                value={currentQuestion.noi_dung}
                onChange={(e) => setCurrentQuestion((p) => ({ ...p, noi_dung: e.target.value }))}
              />
              <Space wrap style={{ width: '100%' }}>
                <Input
                  addonBefore="A"
                  placeholder="Đáp án A"
                  value={currentQuestion.dap_an_a}
                  onChange={(e) => setCurrentQuestion((p) => ({ ...p, dap_an_a: e.target.value }))}
                  style={{ width: 240 }}
                />
                <Input
                  addonBefore="B"
                  placeholder="Đáp án B"
                  value={currentQuestion.dap_an_b}
                  onChange={(e) => setCurrentQuestion((p) => ({ ...p, dap_an_b: e.target.value }))}
                  style={{ width: 240 }}
                />
                <Input
                  addonBefore="C"
                  placeholder="Đáp án C"
                  value={currentQuestion.dap_an_c}
                  onChange={(e) => setCurrentQuestion((p) => ({ ...p, dap_an_c: e.target.value }))}
                  style={{ width: 240 }}
                />
                <Input
                  addonBefore="D"
                  placeholder="Đáp án D"
                  value={currentQuestion.dap_an_d}
                  onChange={(e) => setCurrentQuestion((p) => ({ ...p, dap_an_d: e.target.value }))}
                  style={{ width: 240 }}
                />
              </Space>
              <Space>
                <Text strong>Đáp án đúng:</Text>
                <Radio.Group
                  value={currentQuestion.dap_an_dung}
                  onChange={(e) => setCurrentQuestion((p) => ({ ...p, dap_an_dung: e.target.value }))}
                >
                  <Radio value="A">A</Radio>
                  <Radio value="B">B</Radio>
                  <Radio value="C">C</Radio>
                  <Radio value="D">D</Radio>
                </Radio.Group>
              </Space>
              <Button type="dashed" icon={<PlusOutlined />} onClick={addQuestion} block>
                Thêm câu hỏi này vào đề
              </Button>
            </Space>
          </Card>

          {/* Danh sách câu hỏi đã thêm */}
          {questions.length > 0 && (
            <Card title="Danh sách câu hỏi trong đề" style={{ borderRadius: 12, marginBottom: 16 }}>
              <List
                dataSource={questions}
                renderItem={(q, idx) => (
                  <List.Item
                    actions={[
                      <Button
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={() => removeQuestion(q.id)}
                      >
                        Xóa
                      </Button>,
                    ]}
                  >
                    <List.Item.Meta
                      title={`Câu ${idx + 1}: ${q.noi_dung}`}
                      description={
                        <Space wrap>
                          <Tag color={q.dap_an_dung === 'A' ? 'green' : 'default'}>A: {q.dap_an_a}</Tag>
                          <Tag color={q.dap_an_dung === 'B' ? 'green' : 'default'}>B: {q.dap_an_b}</Tag>
                          {q.dap_an_c && <Tag color={q.dap_an_dung === 'C' ? 'green' : 'default'}>C: {q.dap_an_c}</Tag>}
                          {q.dap_an_d && <Tag color={q.dap_an_dung === 'D' ? 'green' : 'default'}>D: {q.dap_an_d}</Tag>}
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>
          )}
        </>
      )}

      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <Button type="primary" size="large" icon={<SaveOutlined />} onClick={handleSubmit} style={{ height: 48, minWidth: 260, fontSize: 16 }}>
          {examType === EXAM_TYPE.GIAY ? 'Lưu bài kiểm tra giấy' : `Tạo & Lấy Link Bài Thi (${questions.length} câu)`}
        </Button>
      </div>

      {/* Modal hiển thị link bài thi cho giáo viên */}
      <Modal
        open={createdExamModal.open}
        onCancel={() => setCreatedExamModal({ open: false, examId: null, examName: '' })}
        footer={null}
        title={
          <Space>
            <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 20 }} />
            <span>Tạo bài thi online thành công!</span>
          </Space>
        }
        centered
        width={560}
      >
        <div style={{ padding: '12px 0' }}>
          <Paragraph>
            Bài thi <strong>"{createdExamModal.examName}"</strong> đã được tạo. Bạn hãy sao chép đường link bên dưới và gửi vào nhóm Zalo lớp để học sinh bấm vào làm bài:
          </Paragraph>

          <Input.Search
            value={examLink}
            enterButton={<><CopyOutlined /> Sao chép Link</>}
            onSearch={handleCopyLink}
            readOnly
            size="large"
            style={{ marginBottom: 20 }}
          />

          <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button icon={<EyeOutlined />} onClick={() => window.open(examLink, '_blank')}>
              Mở thử giao diện học sinh
            </Button>
            <Button type="primary" onClick={() => navigate('/my-classes')}>
              Hoàn thành
            </Button>
          </Space>
        </div>
      </Modal>
    </div>
  );
}

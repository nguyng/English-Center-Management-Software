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
  Divider,
  List,
  App as AntApp,
  Tag,
} from 'antd';
import { PlusOutlined, DeleteOutlined, SaveOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { EXAM_TYPE } from '../../utils/constants';

const { Title, Text } = Typography;

export default function ExamCreatePage() {
  const [form] = Form.useForm();
  const [examType, setExamType] = useState(EXAM_TYPE.HE_THONG);
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState({
    noi_dung: '',
    dap_an_a: '',
    dap_an_b: '',
    dap_an_c: '',
    dap_an_d: '',
    dap_an_dung: 'A',
  });
  const { message } = AntApp.useApp();

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
      // TODO: Gọi API
      const payload = {
        ...values,
        hinh_thuc: examType,
        questions: examType === EXAM_TYPE.HE_THONG ? questions : undefined,
      };
      console.log('Create exam:', payload);
      message.success('Tạo bài kiểm tra thành công!');
    } catch (error) {
      // validation error
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <Title level={4}>📝 Tạo bài kiểm tra mới</Title>

      <Card style={{ borderRadius: 8, marginBottom: 16 }}>
        <Form form={form} layout="vertical">
          <Form.Item
            name="ten_bai_kiem_tra"
            label="Tên bài kiểm tra"
            rules={[{ required: true, message: 'Vui lòng nhập tên!' }]}
          >
            <Input placeholder="Ví dụ: Từ vựng Unit 3" />
          </Form.Item>

          <Form.Item label="Hình thức thi">
            <Radio.Group value={examType} onChange={(e) => setExamType(e.target.value)}>
              <Radio value={EXAM_TYPE.HE_THONG}>💻 Thi trên hệ thống (Online)</Radio>
              <Radio value={EXAM_TYPE.GIAY}>📝 Thi giấy (Offline)</Radio>
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
            title={`Thêm câu hỏi (Đã có: ${questions.length} câu)`}
            style={{ borderRadius: 8, marginBottom: 16 }}
          >
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <Input.TextArea
                placeholder="Nội dung câu hỏi..."
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
                <Text>Đáp án đúng:</Text>
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
                Thêm câu hỏi
              </Button>
            </Space>
          </Card>

          {/* Danh sách câu hỏi đã thêm */}
          {questions.length > 0 && (
            <Card title="Danh sách câu hỏi" style={{ borderRadius: 8, marginBottom: 16 }}>
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

      <div style={{ textAlign: 'center' }}>
        <Button type="primary" size="large" icon={<SaveOutlined />} onClick={handleSubmit}>
          {examType === EXAM_TYPE.GIAY ? 'Tạo bài kiểm tra' : `Tạo bài kiểm tra (${questions.length} câu)`}
        </Button>
      </div>
    </div>
  );
}


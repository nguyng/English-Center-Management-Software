import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Table, Button, Typography, Card, Tag, Space, Alert, App as AntApp } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import ScoreInput from '../../components/ScoreInput';
import { formatScore, getGradeLabel } from '../../utils/formatters';
import { isInSafeSendHours } from '../../utils/validators';

const { Title, Text } = Typography;

// Mock data
const mockExamInfo = {
  id: 1,
  ten_bai_kiem_tra: 'Từ vựng Unit 3',
  hinh_thuc: 'giay',
  ngay_kiem_tra: '2026-11-05',
  lop: 'Lớp A1 - Starter',
};

const mockStudentsForScore = [
  { id: 1, ho_ten: 'Nguyễn Văn An', trang_thai_diem_danh: 'CoMat', diem: null },
  { id: 2, ho_ten: 'Trần Thị Bảo', trang_thai_diem_danh: 'CoMat', diem: null },
  { id: 3, ho_ten: 'Lê Hoàng Cường', trang_thai_diem_danh: 'Vang', diem: null },
  { id: 4, ho_ten: 'Phạm Minh Đức', trang_thai_diem_danh: 'CoMat', diem: null },
  { id: 5, ho_ten: 'Hoàng Thu Hà', trang_thai_diem_danh: 'CoMat', diem: null },
];

export default function ExamScorePage() {
  const { examId } = useParams();
  const { message, modal } = AntApp.useApp();
  const [scores, setScores] = useState({});
  const [saving, setSaving] = useState(false);

  const presentStudents = mockStudentsForScore.filter((s) => s.trang_thai_diem_danh === 'CoMat');
  const scoredCount = presentStudents.filter((s) => scores[s.id] !== null && scores[s.id] !== undefined).length;

  const handleSave = async () => {
    if (scoredCount === 0) {
      message.warning('Chưa nhập điểm cho học sinh nào!');
      return;
    }

    // Kiểm tra khung giờ an toàn
    if (!isInSafeSendHours()) {
      modal.confirm({
        title: '⏰ Ngoài khung giờ gửi tin an toàn',
        content: 'Hiện tại đã quá 21:30 hoặc chưa đến 07:00. Bạn muốn hẹn giờ tự động gửi vào 07:30 sáng mai để không làm phiền giấc ngủ của phụ huynh?',
        okText: 'Hẹn gửi 07:30 sáng mai',
        cancelText: 'Gửi ngay bây giờ',
        onOk: () => doSave(true),
        onCancel: () => doSave(false),
      });
      return;
    }

    doSave(false);
  };

  const doSave = async (scheduleForMorning) => {
    setSaving(true);
    try {
      // TODO: Gọi API thật
      // await examApi.saveManualScores(examId, { scores, scheduleForMorning });
      await new Promise((r) => setTimeout(r, 1000));

      if (scheduleForMorning) {
        message.success(`✅ Đã lưu điểm! Tin nhắn sẽ được gửi vào 07:30 sáng mai.`);
      } else {
        message.success(`✅ Đã lưu điểm và gửi thông báo cho ${scoredCount} phụ huynh!`);
      }
    } catch (error) {
      message.error('Lỗi: ' + (error.message || 'Vui lòng thử lại'));
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { title: 'STT', key: 'stt', render: (_, __, i) => i + 1, width: 50 },
    { title: 'Họ tên', dataIndex: 'ho_ten', key: 'name' },
    {
      title: 'Điểm danh',
      dataIndex: 'trang_thai_diem_danh',
      key: 'dd',
      width: 120,
      render: (s) => s === 'CoMat' ? <Tag color="green">Có mặt</Tag> : <Tag color="red">Vắng</Tag>,
    },
    {
      title: 'Điểm số (0.0 - 10.0)',
      key: 'diem',
      width: 150,
      align: 'center',
      render: (_, record) => {
        if (record.trang_thai_diem_danh === 'Vang') {
          return <Text type="secondary">Không thi</Text>;
        }
        return (
          <ScoreInput
            value={scores[record.id]}
            onChange={(val) => setScores((prev) => ({ ...prev, [record.id]: val }))}
          />
        );
      },
    },
    {
      title: 'Xếp loại',
      key: 'grade',
      width: 100,
      render: (_, record) => {
        const s = scores[record.id];
        if (record.trang_thai_diem_danh === 'Vang' || s === null || s === undefined) return '—';
        const label = getGradeLabel(s);
        const color = s >= 8 ? 'green' : s >= 6.5 ? 'blue' : s >= 5 ? 'orange' : 'red';
        return <Tag color={color}>{formatScore(s)} — {label}</Tag>;
      },
    },
  ];

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <Title level={4}>📝 Nhập điểm thi giấy</Title>

      <Card size="small" style={{ marginBottom: 16, borderRadius: 8 }}>
        <Space size="large">
          <div><Text type="secondary">Bài kiểm tra:</Text><br /><Text strong>{mockExamInfo.ten_bai_kiem_tra}</Text></div>
          <div><Text type="secondary">Lớp:</Text><br /><Text strong>{mockExamInfo.lop}</Text></div>
          <div><Text type="secondary">Đã nhập:</Text><br /><Text strong>{scoredCount}/{presentStudents.length}</Text></div>
        </Space>
      </Card>

      <Alert
        type="info"
        showIcon
        message="Nhập điểm từ 0.0 đến 10.0. Dấu phẩy (,) tự động chuyển thành dấu chấm (.). Hệ thống sẽ chỉ gửi tin cho những học sinh đã có điểm."
        style={{ marginBottom: 16 }}
      />

      <Table dataSource={mockStudentsForScore} columns={columns} rowKey="id" pagination={false} bordered />

      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <Button
          type="primary"
          size="large"
          icon={<SaveOutlined />}
          loading={saving}
          onClick={handleSave}
          disabled={scoredCount === 0}
        >
          Lưu điểm & Gửi thông báo ({scoredCount} học sinh)
        </Button>
      </div>
    </div>
  );
}


import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Table, Button, Typography, Tag, Space, Alert, App as AntApp } from 'antd';
import { SaveOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
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
  const { examId: _examId } = useParams();
  const { message, modal } = AntApp.useApp();
  const [scores, setScores] = useState({});
  const [saving, setSaving] = useState(false);

  const presentStudents = mockStudentsForScore.filter((s) => s.trang_thai_diem_danh === 'CoMat');
  const scoredCount = presentStudents.filter(
    (s) => scores[s.id] !== null && scores[s.id] !== undefined
  ).length;

  const handleSave = async () => {
    if (scoredCount === 0) {
      message.warning('Chưa nhập điểm cho học sinh nào!');
      return;
    }

    // Kiểm tra khung giờ an toàn
    if (!isInSafeSendHours()) {
      modal.confirm({
        title: '⏰ Ngoài khung giờ gửi tin an toàn',
        content:
          'Hiện tại đã quá 21:30 hoặc chưa đến 07:00. Bạn muốn hẹn giờ tự động gửi vào 07:30 sáng mai để không làm phiền giấc ngủ của phụ huynh?',
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
      render: (name) => <Text strong>{name}</Text>,
    },
    {
      title: 'Chuyên cần',
      dataIndex: 'trang_thai_diem_danh',
      key: 'dd',
      width: 140,
      render: (s) =>
        s === 'CoMat' ? (
          <Tag color="success" icon={<CheckCircleOutlined />}>
            Có mặt
          </Tag>
        ) : (
          <Tag color="error" icon={<CloseCircleOutlined />}>
            Vắng mặt
          </Tag>
        ),
    },
    {
      title: 'Điểm số (0.0 - 10.0)',
      key: 'diem',
      width: 170,
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
      width: 150,
      align: 'center',
      render: (_, record) => {
        const s = scores[record.id];
        if (record.trang_thai_diem_danh === 'Vang' || s === null || s === undefined) return '—';
        const label = getGradeLabel(s);
        const color = s >= 8 ? 'success' : s >= 6.5 ? 'processing' : s >= 5 ? 'warning' : 'error';
        return (
          <Tag color={color}>
            {formatScore(s)} — {label}
          </Tag>
        );
      },
    },
  ];

  return (
    <div style={{ maxWidth: 880, margin: '0 auto' }}>
      <div className="edtech-page-header">
        <div>
          <Space size={8} style={{ marginBottom: 4 }}>
            <Tag color="geekblue">{mockExamInfo.lop}</Tag>
            <Tag color="cyan">Bài kiểm tra giấy</Tag>
          </Space>
          <Title level={4} style={{ margin: 0, fontWeight: 800 }}>
            Nhập Điểm Thi Giấy: {mockExamInfo.ten_bai_kiem_tra}
          </Title>
        </div>
        <Tag color="blue" style={{ fontSize: 14, padding: '6px 14px', borderRadius: 999 }}>
          Đã chấm: <strong>{scoredCount}/{presentStudents.length}</strong> học viên
        </Tag>
      </div>

      <Alert
        type="info"
        showIcon
        message="Nhập điểm từ 0.0 đến 10.0. Dấu phẩy (,) tự động chuyển thành dấu chấm (.). Hệ thống sẽ chỉ gửi tin Zalo ZNS cho những học sinh đã có điểm."
        style={{ marginBottom: 20, borderRadius: 12 }}
      />

      <div className="edtech-table-wrapper" style={{ marginBottom: 24 }}>
        <Table
          dataSource={mockStudentsForScore}
          columns={columns}
          rowKey="id"
          pagination={false}
          scroll={{ x: 650 }}
        />
      </div>

      <div style={{ textAlign: 'center' }}>
        <Button
          type="primary"
          size="large"
          className="btn-cta-orange"
          icon={<SaveOutlined />}
          loading={saving}
          onClick={handleSave}
          disabled={scoredCount === 0}
          style={{ minWidth: 280, height: 48, fontSize: 15.5, borderRadius: 10 }}
        >
          Lưu điểm & Gửi thông báo ({scoredCount} học sinh)
        </Button>
      </div>
    </div>
  );
}

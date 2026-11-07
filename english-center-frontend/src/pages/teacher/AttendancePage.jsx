import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Table,
  Switch,
  Button,
  Space,
  Typography,
  Segmented,
  Checkbox,
  Radio,
  DatePicker,
  Tag,
  Card,
  Divider,
  Alert,
  Input,
  App as AntApp,
} from 'antd';
import {
  SendOutlined,
  FilterOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExperimentOutlined,
  CopyOutlined,
  EyeOutlined,
  PlusOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import ScoreInput from '../../components/ScoreInput';
import ConfirmModal from '../../components/ConfirmModal';
import dayjs from 'dayjs';
import { ATTENDANCE_STATUS, EXAM_TYPE } from '../../utils/constants';
import { formatScore, getGradeLabel } from '../../utils/formatters';

const { Title, Text, Paragraph } = Typography;

// Mock data — sẽ thay bằng API thật
const mockSessionInfo = {
  id: 1,
  lop: 'Lớp A1 - Starter',
  ma_lop: 'A1-2026',
  gio_bat_dau: '17:30',
  gio_ket_thuc: '19:00',
  ca_hoc: '17:30 - 19:00',
  ngay_hoc: '2026-11-05',
  giao_vien: 'Nguyễn Văn A',
};

const mockStudents = [
  { id: 1, ho_ten: 'Nguyễn Văn An', sdt_phu_huynh: '0901234567' },
  { id: 2, ho_ten: 'Trần Thị Bảo', sdt_phu_huynh: '0912345678' },
  { id: 3, ho_ten: 'Lê Hoàng Cường', sdt_phu_huynh: '0923456789' },
  { id: 4, ho_ten: 'Phạm Minh Đức', sdt_phu_huynh: '0934567890' },
  { id: 5, ho_ten: 'Hoàng Thu Hà', sdt_phu_huynh: '0945678901' },
  { id: 6, ho_ten: 'Vũ Quốc Khánh', sdt_phu_huynh: '0956789012' },
  { id: 7, ho_ten: 'Đỗ Thị Lan', sdt_phu_huynh: '0967890123' },
  { id: 8, ho_ten: 'Bùi Văn Minh', sdt_phu_huynh: '0978901234' },
];

export default function AttendancePage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { message, modal } = AntApp.useApp();

  // ===== STATE =====
  // Điểm danh: mặc định TẤT CẢ = Có mặt
  const [attendance, setAttendance] = useState(() => {
    const initial = {};
    mockStudents.forEach((s) => {
      initial[s.id] = ATTENDANCE_STATUS.CO_MAT;
    });
    return initial;
  });

  // Bộ lọc hiển thị
  const [filter, setFilter] = useState('all'); // 'all' | 'absent'

  // Kiểm tra
  const [hasExam, setHasExam] = useState(false);
  const [examType, setExamType] = useState(null); // 'he_thong' | 'giay'
  const [examDate, setExamDate] = useState(dayjs());
  const [examName, setExamName] = useState('');

  // Điểm thi giấy
  const [scores, setScores] = useState({});

  // Ghi chú
  const [notes, setNotes] = useState({});

  // Modal xác nhận
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sending, setSending] = useState(false);

  // ===== COMPUTED =====
  const absentCount = useMemo(
    () => Object.values(attendance).filter((s) => s === ATTENDANCE_STATUS.VANG).length,
    [attendance]
  );

  const presentCount = mockStudents.length - absentCount;

  const displayStudents = useMemo(() => {
    const list = mockStudents.map((s) => ({
      ...s,
      trangThai: attendance[s.id],
      diem: scores[s.id] ?? null,
    }));
    if (filter === 'absent') {
      return list.filter((s) => s.trangThai === ATTENDANCE_STATUS.VANG);
    }
    return list;
  }, [attendance, scores, filter]);

  // ===== HANDLERS =====
  const toggleAttendance = (studentId) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]:
        prev[studentId] === ATTENDANCE_STATUS.CO_MAT
          ? ATTENDANCE_STATUS.VANG
          : ATTENDANCE_STATUS.CO_MAT,
    }));
  };

  const handleScoreChange = (studentId, value) => {
    setScores((prev) => ({ ...prev, [studentId]: value }));
  };

  const handleConfirmAndSend = () => {
    // Validate điểm thi giấy nếu có
    if (hasExam && examType === EXAM_TYPE.GIAY) {
      const presentStudents = mockStudents.filter(
        (s) => attendance[s.id] === ATTENDANCE_STATUS.CO_MAT
      );
      const missingScores = presentStudents.filter(
        (s) => scores[s.id] === null || scores[s.id] === undefined
      );
      if (missingScores.length > 0) {
        modal.confirm({
          title: 'Có học sinh chưa nhập điểm',
          content: `Còn ${missingScores.length} học sinh có mặt chưa được nhập điểm. Bạn có muốn tiếp tục gửi không? (Hệ thống sẽ chỉ gửi điểm cho những bạn đã có điểm)`,
          okText: 'Tiếp tục gửi',
          cancelText: 'Quay lại nhập điểm',
          onOk: () => setConfirmOpen(true),
        });
        return;
      }
    }
    setConfirmOpen(true);
  };

  const handleSend = async () => {
    setSending(true);
    try {
      // TODO: Gọi API thật
      // await attendanceApi.saveAndNotify(sessionId, {
      //   attendance,
      //   scores: hasExam && examType === EXAM_TYPE.GIAY ? scores : undefined,
      //   examInfo: hasExam ? { examType, examDate, examName } : undefined,
      // });

      // Giả lập delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      message.success('✅ Đã xác nhận điểm danh và gửi thông báo Zalo thành công!');
      setConfirmOpen(false);
    } catch (error) {
      message.error('❌ Có lỗi xảy ra: ' + (error.message || 'Vui lòng thử lại'));
    } finally {
      setSending(false);
    }
  };

  // ===== RENDER =====
  const columns = [
    {
      title: 'STT',
      key: 'stt',
      width: 50,
      align: 'center',
      render: (_, __, idx) => idx + 1,
    },
    {
      title: 'Họ tên',
      dataIndex: 'ho_ten',
      key: 'ho_ten',
      render: (name, record) => (
        <Text strong={record.trangThai === ATTENDANCE_STATUS.VANG} type={record.trangThai === ATTENDANCE_STATUS.VANG ? 'danger' : undefined}>
          {name}
        </Text>
      ),
    },
    {
      title: 'SĐT Phụ huynh',
      dataIndex: 'sdt_phu_huynh',
      key: 'sdt',
      width: 130,
    },
    {
      title: 'Trạng thái',
      key: 'trangThai',
      width: 150,
      align: 'center',
      render: (_, record) => (
        <Switch
          checked={record.trangThai === ATTENDANCE_STATUS.CO_MAT}
          onChange={() => toggleAttendance(record.id)}
          checkedChildren={<><CheckCircleOutlined /> Có mặt</>}
          unCheckedChildren={<><CloseCircleOutlined /> Vắng</>}
          style={{
            backgroundColor:
              record.trangThai === ATTENDANCE_STATUS.CO_MAT ? '#52c41a' : '#ff4d4f',
          }}
        />
      ),
    },
  ];

  // Cột điểm: chỉ hiện khi bật kiểm tra + chọn thi giấy
  if (hasExam && examType === EXAM_TYPE.GIAY) {
    columns.push({
      title: 'Điểm thi giấy',
      key: 'diem',
      width: 120,
      align: 'center',
      render: (_, record) => {
        if (record.trangThai === ATTENDANCE_STATUS.VANG) {
          return <Tag color="red">Vắng — Không thi</Tag>;
        }
        return (
          <ScoreInput
            value={scores[record.id]}
            onChange={(val) => handleScoreChange(record.id, val)}
          />
        );
      },
    });

    // Cột xếp loại
    columns.push({
      title: 'Xếp loại',
      key: 'xeploai',
      width: 100,
      align: 'center',
      render: (_, record) => {
        if (record.trangThai === ATTENDANCE_STATUS.VANG) return null;
        const score = scores[record.id];
        if (score === null || score === undefined) return <Text type="secondary">—</Text>;
        const label = getGradeLabel(score);
        const color = score >= 8 ? 'green' : score >= 6.5 ? 'blue' : score >= 5 ? 'orange' : 'red';
        return <Tag color={color}>{label}</Tag>;
      },
    });
  }

  // Cột nhận xét từng học sinh (gửi kèm Zalo)
  columns.push({
    title: 'Nhận xét buổi học (khen ngợi / nhắc nhở / lý do vắng)',
    key: 'note',
    render: (_, record) => (
      <Input
        placeholder={record.trangThai === ATTENDANCE_STATUS.VANG ? 'Nhập lý do vắng (nếu có)...' : 'Nhận xét bé hôm nay...'}
        value={notes[record.id] || ''}
        onChange={(e) => setNotes((prev) => ({ ...prev, [record.id]: e.target.value }))}
        size="small"
        allowClear
      />
    ),
  });

  // Tóm tắt thông báo sẽ gửi
  const buildSummary = () => {
    const absent = mockStudents.filter((s) => attendance[s.id] === ATTENDANCE_STATUS.VANG);
    const present = mockStudents.filter((s) => attendance[s.id] === ATTENDANCE_STATUS.CO_MAT);
    const lines = [];

    lines.push(`📋 Tổng: ${mockStudents.length} học sinh | ✅ Có mặt: ${present.length} | ❌ Vắng: ${absent.length}`);

    if (absent.length > 0) {
      lines.push(`\n🔔 Sẽ gửi tin BÁO VẮNG cho ${absent.length} phụ huynh:`);
      absent.forEach((s) => {
        const noteStr = notes[s.id] ? ` (Ghi chú: "${notes[s.id]}")` : '';
        lines.push(`   • ${s.ho_ten} (${s.sdt_phu_huynh})${noteStr}`);
      });
    }

    if (hasExam && examType) {
      const scored = present.filter((s) => scores[s.id] !== null && scores[s.id] !== undefined);
      if (examType === EXAM_TYPE.HE_THONG) {
        lines.push(`\n📝 Thi online — Hệ thống sẽ tự chấm và gửi điểm cuối ca.`);
      } else if (scored.length > 0) {
        lines.push(`\n📝 Sẽ gửi tin BÁO ĐIỂM cho ${scored.length} học sinh:`);
        scored.forEach((s) => {
          const noteStr = notes[s.id] ? ` — Nhận xét: "${notes[s.id]}"` : '';
          lines.push(`   • ${s.ho_ten}: ${formatScore(scores[s.id])}/10${noteStr}`);
        });
      }
    }

    // Các bạn có mặt không kiểm tra nhưng có nhận xét
    const presentWithNotesOnly = present.filter((s) => notes[s.id]?.trim() && (!hasExam || examType !== EXAM_TYPE.GIAY || scores[s.id] === null || scores[s.id] === undefined));
    if (presentWithNotesOnly.length > 0 && !hasExam) {
      lines.push(`\n💬 Có ${presentWithNotesOnly.length} học sinh được thêm nhận xét chuyên cần.`);
    }

    if (!hasExam && absent.length === 0 && presentWithNotesOnly.length === 0) {
      lines.push(`\n✅ Không có học sinh vắng, không có kiểm tra → Không gửi tin nào.`);
    }

    return lines.join('\n');
  };

  return (
    <div>
      {/* Header thông tin buổi học */}
      <Card size="small" style={{ marginBottom: 16, borderRadius: 8 }}>
        <Space size="large" wrap>
          <div>
            <Text type="secondary">Lớp</Text>
            <br />
            <Text strong style={{ fontSize: 16 }}>{mockSessionInfo.lop}</Text>
          </div>
          <div>
            <Text type="secondary">Ca học</Text>
            <br />
            <Text strong>{mockSessionInfo.ca_hoc}</Text>
          </div>
          <div>
            <Text type="secondary">Ngày</Text>
            <br />
            <Text strong>{dayjs(mockSessionInfo.ngay_hoc).format('DD/MM/YYYY')}</Text>
          </div>
          <div>
            <Text type="secondary">Giáo viên</Text>
            <br />
            <Text strong>{mockSessionInfo.giao_vien}</Text>
          </div>
        </Space>
      </Card>

      {/* Thanh công cụ: Lọc + Thống kê */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <Segmented
          options={[
            {
              label: (
                <Space>
                  <FilterOutlined />
                  Tất cả ({mockStudents.length})
                </Space>
              ),
              value: 'all',
            },
            {
              label: (
                <Space>
                  <CloseCircleOutlined />
                  Học sinh vắng ({absentCount})
                </Space>
              ),
              value: 'absent',
            },
          ]}
          value={filter}
          onChange={setFilter}
          size="large"
        />
        <Space>
          <Tag color="green" style={{ fontSize: 14, padding: '4px 12px' }}>
            ✅ Có mặt: {presentCount}
          </Tag>
          <Tag color="red" style={{ fontSize: 14, padding: '4px 12px' }}>
            ❌ Vắng: {absentCount}
          </Tag>
        </Space>
      </div>

      {/* Bảng điểm danh */}
      <Table
        dataSource={displayStudents}
        columns={columns}
        rowKey="id"
        pagination={false}
        bordered
        size="middle"
        rowClassName={(record) =>
          record.trangThai === ATTENDANCE_STATUS.VANG ? 'ant-table-row-absent' : ''
        }
      />

      <Divider />

      {/* Khu vực cấu hình kiểm tra */}
      <Card
        size="small"
        title={
          <Space>
            <ExperimentOutlined />
            <Text strong>Cấu hình bài kiểm tra</Text>
          </Space>
        }
        style={{ marginBottom: 16, borderRadius: 8 }}
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Checkbox
            checked={hasExam}
            onChange={(e) => {
              setHasExam(e.target.checked);
              if (!e.target.checked) {
                setExamType(null);
                setScores({});
              }
            }}
            style={{ fontSize: 15 }}
          >
            <Text strong>Buổi học này có bài kiểm tra</Text>
          </Checkbox>

          {hasExam && (
            <>
              <Radio.Group
                value={examType}
                onChange={(e) => {
                  setExamType(e.target.value);
                  if (e.target.value !== EXAM_TYPE.GIAY) {
                    setScores({});
                  }
                }}
              >
                <Space direction="vertical">
                  <Radio value={EXAM_TYPE.HE_THONG}>
                    💻 Thi trên hệ thống (Online) — Hệ thống tự chấm điểm
                  </Radio>
                  <Radio value={EXAM_TYPE.GIAY}>
                    📝 Thi giấy (Offline) — Giáo viên nhập điểm thủ công
                  </Radio>
                </Space>
              </Radio.Group>

              <Space wrap>
                <div>
                  <Text type="secondary">Ngày kiểm tra:</Text>
                  <br />
                  <DatePicker
                    value={examDate}
                    onChange={setExamDate}
                    format="DD/MM/YYYY"
                    style={{ width: 200 }}
                  />
                </div>
              </Space>

              {examType === EXAM_TYPE.GIAY && (
                <Alert
                  type="info"
                  showIcon
                  message="Nhập điểm thi giấy"
                  description="Nhập điểm từ 0.0 đến 10.0 cho từng học sinh có mặt trong bảng điểm danh phía trên. Dấu phẩy (,) sẽ tự động được chuyển thành dấu chấm (.)."
                />
              )}

              {examType === EXAM_TYPE.HE_THONG && (
                <div style={{ background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 8, padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                    <Text strong style={{ fontSize: 15, color: '#389e0d' }}>
                      💻 Đề thi online: "Từ vựng & Ngữ pháp Unit 3"
                    </Text>
                    <div>
                      <Tag color="magenta" style={{ fontWeight: 'bold' }}>Mã PIN vào thi: 1234</Tag>
                      <Tag color="cyan">Khung giờ: 08:00 - 22:00</Tag>
                    </div>
                  </div>
                  <Paragraph style={{ margin: '8px 0', color: '#555' }}>
                    Giáo viên sao chép link và mã PIN gửi vào nhóm Zalo lớp để học sinh làm bài:
                  </Paragraph>
                  <Space style={{ width: '100%' }} wrap>
                    <Input
                      value={`${window.location.origin}/thi/101`}
                      readOnly
                      style={{ width: 320, background: '#fff' }}
                    />
                    <Button
                      type="primary"
                      icon={<CopyOutlined />}
                      onClick={() => {
                        const copyText = `Link làm bài kiểm tra: ${window.location.origin}/thi/101\nMã bảo mật vào thi (PIN): 1234\nKhung giờ mở đề: 08:00 - 22:00`;
                        navigator.clipboard.writeText(copyText);
                        message.success('📋 Đã sao chép link & mã PIN bài thi! Hãy dán vào nhóm Zalo lớp.');
                      }}
                    >
                      Sao chép Link & Mã
                    </Button>
                    <Button
                      icon={<EyeOutlined />}
                      onClick={() => window.open(`${window.location.origin}/thi/101?preview=true`, '_blank')}
                    >
                      Mở xem thử (GV)
                    </Button>
                    <Button
                      icon={<TrophyOutlined />}
                      onClick={() => navigate('/exam/results/101')}
                    >
                      Xem bảng điểm học sinh
                    </Button>
                    <Button
                      icon={<PlusOutlined />}
                      onClick={() => navigate('/exam/create')}
                    >
                      Tạo đề mới
                    </Button>
                  </Space>
                  <div style={{ marginTop: 8, fontSize: 13, color: '#888' }}>
                    💡 Học sinh làm bài xong hệ thống sẽ tự động chấm điểm. Giáo viên có thể bấm "Xem bảng điểm học sinh" để theo dõi kết quả từng câu của cả lớp.
                  </div>
                </div>
              )}
            </>
          )}
        </Space>
      </Card>

      {/* Nút hành động */}
      <div style={{ textAlign: 'center', padding: '16px 0' }}>
        <Button
          type="primary"
          size="large"
          icon={<SendOutlined />}
          onClick={handleConfirmAndSend}
          style={{ minWidth: 300, height: 48, fontSize: 16 }}
        >
          Xác nhận & Gửi thông báo Zalo
        </Button>
      </div>

      {/* Modal xác nhận trước khi gửi */}
      <ConfirmModal
        open={confirmOpen}
        onOk={handleSend}
        onCancel={() => setConfirmOpen(false)}
        title="Xác nhận gửi thông báo Zalo"
        loading={sending}
        okText="Gửi ngay"
        cancelText="Quay lại"
        content={
          <div>
            <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13, background: '#f5f5f5', padding: 12, borderRadius: 6 }}>
              {buildSummary()}
            </pre>
            <Alert
              type="warning"
              showIcon
              message="Sau khi gửi, tin nhắn sẽ được gửi đến phụ huynh qua Zalo. Hành động này không thể hoàn tác."
              style={{ marginTop: 12 }}
            />
          </div>
        }
      />

      {/* CSS cho hàng vắng */}
      <style>{`
        .ant-table-row-absent td {
          background-color: #fff2f0 !important;
        }
      `}</style>
    </div>
  );
}


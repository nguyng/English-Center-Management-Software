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
  Alert,
  Input,
  Avatar,
  Row,
  Col,
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
  ArrowLeftOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  UserOutlined,
  PhoneOutlined,
} from '@ant-design/icons';
import ScoreInput from '../../components/ScoreInput';
import ConfirmModal from '../../components/ConfirmModal';
import dayjs from 'dayjs';
import { ATTENDANCE_STATUS, EXAM_TYPE } from '../../utils/constants';
import { formatScore, getGradeLabel, formatPhone } from '../../utils/formatters';

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
  const { sessionId: _sessionId } = useParams();
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
      width: 56,
      align: 'center',
      render: (_, __, idx) => <Text type="secondary">{idx + 1}</Text>,
    },
    {
      title: 'Họ và tên học viên',
      dataIndex: 'ho_ten',
      key: 'ho_ten',
      width: 220,
      render: (name, record) => {
        const isAbsent = record.trangThai === ATTENDANCE_STATUS.VANG;
        const initials = name
          .split(' ')
          .slice(-2)
          .map((w) => w[0])
          .join('')
          .toUpperCase();
        return (
          <Space size={10}>
            <Avatar
              size={34}
              style={{
                background: isAbsent
                  ? '#ef4444'
                  : 'linear-gradient(135deg, #1e3a8a 0%, #0284c7 100%)',
                fontSize: 12.5,
                fontWeight: 700,
              }}
            >
              {initials}
            </Avatar>
            <Text strong style={{ color: isAbsent ? '#dc2626' : '#0f172a', fontSize: 14 }}>
              {name}
            </Text>
          </Space>
        );
      },
    },
    {
      title: 'SĐT Phụ huynh',
      dataIndex: 'sdt_phu_huynh',
      key: 'sdt',
      width: 150,
      render: (sdt) => (
        <Space size={5}>
          <PhoneOutlined style={{ color: '#0284c7' }} />
          <span style={{ fontFamily: 'monospace', fontSize: 13.5 }}>{formatPhone(sdt)}</span>
        </Space>
      ),
    },
    {
      title: 'Trạng thái chuyên cần',
      key: 'trangThai',
      width: 160,
      align: 'center',
      render: (_, record) => (
        <Switch
          checked={record.trangThai === ATTENDANCE_STATUS.CO_MAT}
          onChange={() => toggleAttendance(record.id)}
          checkedChildren={
            <>
              <CheckCircleOutlined /> Có mặt
            </>
          }
          unCheckedChildren={
            <>
              <CloseCircleOutlined /> Vắng
            </>
          }
          style={{
            backgroundColor:
              record.trangThai === ATTENDANCE_STATUS.CO_MAT ? '#10b981' : '#ef4444',
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
      width: 130,
      align: 'center',
      render: (_, record) => {
        if (record.trangThai === ATTENDANCE_STATUS.VANG) {
          return <Tag color="error">Vắng — Không thi</Tag>;
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
      width: 110,
      align: 'center',
      render: (_, record) => {
        if (record.trangThai === ATTENDANCE_STATUS.VANG) return null;
        const score = scores[record.id];
        if (score === null || score === undefined) return <Text type="secondary">—</Text>;
        const label = getGradeLabel(score);
        const color = score >= 8 ? 'success' : score >= 6.5 ? 'processing' : score >= 5 ? 'warning' : 'error';
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
        placeholder={
          record.trangThai === ATTENDANCE_STATUS.VANG
            ? 'Nhập lý do vắng (nếu có)...'
            : 'Nhận xét thái độ học tập hôm nay...'
        }
        value={notes[record.id] || ''}
        onChange={(e) => setNotes((prev) => ({ ...prev, [record.id]: e.target.value }))}
        allowClear
      />
    ),
  });

  // Tóm tắt thông báo sẽ gửi
  const buildSummary = () => {
    const absent = mockStudents.filter((s) => attendance[s.id] === ATTENDANCE_STATUS.VANG);
    const present = mockStudents.filter((s) => attendance[s.id] === ATTENDANCE_STATUS.CO_MAT);
    const lines = [];

    lines.push(
      `📋 Tổng: ${mockStudents.length} học sinh | ✅ Có mặt: ${present.length} | ❌ Vắng: ${absent.length}`
    );

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

    const presentWithNotesOnly = present.filter(
      (s) =>
        notes[s.id]?.trim() &&
        (!hasExam ||
          examType !== EXAM_TYPE.GIAY ||
          scores[s.id] === null ||
          scores[s.id] === undefined)
    );
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
      {/* Hero Session Info Header */}
      <div className="edtech-hero-banner" style={{ padding: '22px 28px', marginBottom: 20 }}>
        <Row gutter={[16, 16]} align="middle" justify="space-between" style={{ position: 'relative', zIndex: 1 }}>
          <Col xs={24} md={14}>
            <Space size={10} style={{ marginBottom: 8 }}>
              <Button
                size="small"
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate(-1)}
                style={{
                  background: 'rgba(255,255,255,0.14)',
                  borderColor: 'rgba(255,255,255,0.25)',
                  color: '#fff',
                }}
              >
                Quay lại
              </Button>
              <Tag color="cyan" style={{ margin: 0, fontWeight: 700 }}>
                Mã lớp: {mockSessionInfo.ma_lop}
              </Tag>
            </Space>
            <Title level={3} style={{ color: '#ffffff', margin: 0, fontWeight: 800 }}>
              Điểm Danh & Đánh Giá: {mockSessionInfo.lop}
            </Title>
          </Col>
          <Col xs={24} md={10}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                flexWrap: 'wrap',
                gap: 12,
              }}
            >
              <div
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.18)',
                  borderRadius: 10,
                  padding: '8px 14px',
                }}
              >
                <div style={{ fontSize: 11.5, color: '#bae6fd' }}>
                  <ClockCircleOutlined /> Khung giờ
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>
                  {mockSessionInfo.ca_hoc}
                </div>
              </div>
              <div
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.18)',
                  borderRadius: 10,
                  padding: '8px 14px',
                }}
              >
                <div style={{ fontSize: 11.5, color: '#bae6fd' }}>
                  <CalendarOutlined /> Ngày học
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>
                  {dayjs(mockSessionInfo.ngay_hoc).format('DD/MM/YYYY')}
                </div>
              </div>
              <div
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.18)',
                  borderRadius: 10,
                  padding: '8px 14px',
                }}
              >
                <div style={{ fontSize: 11.5, color: '#bae6fd' }}>
                  <UserOutlined /> Giảng viên
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>
                  {mockSessionInfo.giao_vien}
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </div>

      {/* Table Wrapper with Toolbar */}
      <div className="edtech-table-wrapper" style={{ marginBottom: 24 }}>
        <div className="edtech-filter-bar" style={{ border: 'none', borderBottom: '1px solid #f1f5f9' }}>
          <Segmented
            options={[
              {
                label: (
                  <Space>
                    <FilterOutlined />
                    <span>Tất cả học viên ({mockStudents.length})</span>
                  </Space>
                ),
                value: 'all',
              },
              {
                label: (
                  <Space>
                    <CloseCircleOutlined style={{ color: absentCount > 0 ? '#ef4444' : undefined }} />
                    <span>Vắng mặt ({absentCount})</span>
                  </Space>
                ),
                value: 'absent',
              },
            ]}
            value={filter}
            onChange={setFilter}
          />
          <Space size={10}>
            <Tag
              color="success"
              style={{ fontSize: 13.5, padding: '5px 14px', borderRadius: 999, margin: 0 }}
            >
              ✅ Có mặt: <strong>{presentCount}</strong>
            </Tag>
            <Tag
              color="error"
              style={{ fontSize: 13.5, padding: '5px 14px', borderRadius: 999, margin: 0 }}
            >
              ❌ Vắng: <strong>{absentCount}</strong>
            </Tag>
          </Space>
        </div>

        <Table
          dataSource={displayStudents}
          columns={columns}
          rowKey="id"
          pagination={false}
          size="middle"
          scroll={{ x: 860 }}
          rowClassName={(record) =>
            record.trangThai === ATTENDANCE_STATUS.VANG ? 'ant-table-row-absent' : ''
          }
        />
      </div>

      {/* Khu vực cấu hình kiểm tra */}
      <Card
        className="edtech-card"
        title={
          <Space>
            <ExperimentOutlined style={{ color: '#0284c7' }} />
            <span>Tích hợp Bài Kiểm Tra Định Kỳ Trong Buổi Học</span>
          </Space>
        }
        style={{ marginBottom: 24 }}
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
            <Text strong style={{ fontSize: 15 }}>
              Buổi học hôm nay có tổ chức kiểm tra đánh giá
            </Text>
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
                <Space direction="vertical" size={10}>
                  <Radio value={EXAM_TYPE.HE_THONG}>
                    <strong>💻 Thi trên hệ thống (Online)</strong> — Cổng thi mở theo giờ, chống gian lận & tự chấm điểm
                  </Radio>
                  <Radio value={EXAM_TYPE.GIAY}>
                    <strong>📝 Thi giấy tại lớp (Offline)</strong> — Giáo viên nhập điểm trực tiếp trên bảng điểm danh
                  </Radio>
                </Space>
              </Radio.Group>

              <Space wrap>
                <div>
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    Ngày kiểm tra:
                  </Text>
                  <br />
                  <DatePicker
                    value={examDate}
                    onChange={setExamDate}
                    format="DD/MM/YYYY"
                    style={{ width: 200, marginTop: 4 }}
                  />
                </div>
              </Space>

              {examType === EXAM_TYPE.GIAY && (
                <Alert
                  type="info"
                  showIcon
                  message="Hướng dẫn nhập điểm thi giấy"
                  description="Nhập điểm từ 0.0 đến 10.0 cho từng học sinh có mặt trong bảng điểm danh phía trên. Dấu phẩy (,) sẽ tự động được chuyển thành dấu chấm (.)."
                  style={{ borderRadius: 10 }}
                />
              )}

              {examType === EXAM_TYPE.HE_THONG && (
                <div
                  style={{
                    background: '#f0f9ff',
                    border: '1px solid #bae6fd',
                    borderRadius: 12,
                    padding: 20,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 8,
                      marginBottom: 8,
                    }}
                  >
                    <Text strong style={{ fontSize: 15.5, color: '#0369a1' }}>
                      💻 Đề thi online đang gán: "Từ vựng & Ngữ pháp Unit 3"
                    </Text>
                    <Space>
                      <Tag color="magenta" style={{ fontWeight: 'bold' }}>
                        Mã PIN vào thi: 1234
                      </Tag>
                      <Tag color="cyan">Khung giờ: 08:00 - 22:00</Tag>
                    </Space>
                  </div>
                  <Paragraph style={{ margin: '4px 0 12px', color: '#334155', fontSize: 13.5 }}>
                    Giáo viên sao chép đường dẫn và mã PIN dưới đây gửi vào nhóm Zalo lớp để học sinh làm bài:
                  </Paragraph>
                  <Space style={{ width: '100%' }} wrap>
                    <Input
                      value={`${window.location.origin}/thi/101`}
                      readOnly
                      style={{ width: 320, background: '#fff', fontWeight: 500 }}
                    />
                    <Button
                      type="primary"
                      icon={<CopyOutlined />}
                      onClick={() => {
                        const copyText = `Link làm bài kiểm tra: ${window.location.origin}/thi/101\nMã bảo mật vào thi (PIN): 1234\nKhung giờ mở đề: 08:00 - 22:00`;
                        navigator.clipboard.writeText(copyText);
                        message.success(
                          '📋 Đã sao chép link & mã PIN bài thi! Hãy dán vào nhóm Zalo lớp.'
                        );
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
                    <Button icon={<PlusOutlined />} onClick={() => navigate('/exam/create')}>
                      Tạo đề mới
                    </Button>
                  </Space>
                </div>
              )}
            </>
          )}
        </Space>
      </Card>

      {/* Bottom Sticky Action Card */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: 16,
          padding: '18px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          boxShadow: '0 8px 24px rgba(15, 23, 42, 0.06)',
        }}
      >
        <div>
          <Text strong style={{ fontSize: 15, color: '#0f172a', display: 'block' }}>
            Hoàn tất kiểm tra chuyên cần buổi học
          </Text>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Hệ thống sẽ tổng hợp danh sách {absentCount} học viên vắng mặt để gửi thông báo Zalo ZNS tới phụ huynh.
          </Text>
        </div>
        <Button
          type="primary"
          size="large"
          className="btn-cta-orange"
          icon={<SendOutlined />}
          onClick={handleConfirmAndSend}
          style={{ minWidth: 280, height: 48, fontSize: 15.5, borderRadius: 10 }}
        >
          Xác nhận & Gửi thông báo Zalo
        </Button>
      </div>

      {/* Modal xác nhận trước khi gửi */}
      <ConfirmModal
        open={confirmOpen}
        onOk={handleSend}
        onCancel={() => setConfirmOpen(false)}
        title="Xác nhận gửi thông báo Zalo ZNS"
        loading={sending}
        okText="Gửi ngay"
        cancelText="Quay lại"
        content={
          <div>
            <pre
              style={{
                whiteSpace: 'pre-wrap',
                fontSize: 13,
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                padding: 14,
                borderRadius: 8,
                fontFamily: 'inherit',
                lineHeight: 1.6,
              }}
            >
              {buildSummary()}
            </pre>
            <Alert
              type="warning"
              showIcon
              message="Sau khi xác nhận, tin nhắn ZNS sẽ được phát tới số điện thoại phụ huynh qua Zalo OA. Hành động này không thể hoàn tác."
              style={{ marginTop: 12, borderRadius: 8 }}
            />
          </div>
        }
      />
    </div>
  );
}

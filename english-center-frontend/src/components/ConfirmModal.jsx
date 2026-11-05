import { Modal, Typography } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';

const { Text } = Typography;

export default function ConfirmModal({
  open,
  onOk,
  onCancel,
  title = 'Xác nhận',
  content,
  okText = 'Đồng ý',
  cancelText = 'Hủy',
  danger = false,
  loading = false,
}) {
  return (
    <Modal
      open={open}
      onOk={onOk}
      onCancel={onCancel}
      title={
        <span>
          <ExclamationCircleOutlined style={{ color: danger ? '#ff4d4f' : '#faad14', marginRight: 8 }} />
          {title}
        </span>
      }
      okText={okText}
      cancelText={cancelText}
      okButtonProps={{ danger, loading }}
      centered
    >
      {typeof content === 'string' ? <Text>{content}</Text> : content}
    </Modal>
  );
}

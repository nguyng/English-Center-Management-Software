import { Input } from 'antd';
import { VN_PHONE_REGEX } from '../utils/validators';

export default function PhoneInput({ value, onChange, ...props }) {
  const isValid = !value || VN_PHONE_REGEX.test(value);

  const handleChange = (e) => {
    // Chỉ cho phép nhập số, tối đa 10 ký tự
    const cleaned = e.target.value.replace(/\D/g, '').slice(0, 10);
    onChange(cleaned);
  };

  return (
    <Input
      value={value}
      onChange={handleChange}
      status={value && !isValid ? 'error' : ''}
      placeholder="0901234567"
      maxLength={10}
      addonBefore="+84"
      {...props}
    />
  );
}

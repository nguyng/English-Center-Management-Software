import { InputNumber } from 'antd';

export default function ScoreInput({ value, onChange, disabled = false }) {
  const handleChange = (val) => {
    if (val !== null && val !== undefined) {
      // Chặn ngoài khoảng 0-10
      if (val < 0 || val > 10) return;
      // Làm tròn 1 chữ số thập phân
      const rounded = Math.round(val * 10) / 10;
      onChange(rounded);
    } else {
      onChange(null);
    }
  };

  return (
    <InputNumber
      min={0}
      max={10}
      step={0.1}
      precision={1}
      value={value}
      onChange={handleChange}
      disabled={disabled}
      style={{ width: 80 }}
      placeholder="0.0"
      onKeyDown={(e) => {
        // Tự đổi dấu phẩy thành dấu chấm
        if (e.key === ',') {
          e.preventDefault();
          const input = e.target;
          const start = input.selectionStart;
          const currentVal = input.value;
          const newValue = currentVal.slice(0, start) + '.' + currentVal.slice(input.selectionEnd);
          // Trigger qua native input event
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype,
            'value'
          ).set;
          nativeInputValueSetter.call(input, newValue);
          input.dispatchEvent(new Event('input', { bubbles: true }));
          setTimeout(() => input.setSelectionRange(start + 1, start + 1), 0);
        }
      }}
    />
  );
}

import { DatePicker } from 'antd';
import dayjs from 'dayjs';

const DateRangeFilter = ({ value, onChange }) => {
  const [start, end] = value || [null, null];

  return (
    <DatePicker.RangePicker
      size="large"
      value={[start ? dayjs(start) : null, end ? dayjs(end) : null]}
      onChange={(dates) => {
        if (!dates) return onChange([null, null]);
        onChange([dates[0]?.toISOString(), dates[1]?.toISOString()]);
      }}
    />
  );
};

export default DateRangeFilter;

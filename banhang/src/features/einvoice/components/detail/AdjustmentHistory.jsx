import { Timeline, Typography } from 'antd';
import dayjs from 'dayjs';

const KIND_LABELS = { replace: 'Thay thế', reduce: 'Điều chỉnh giảm' };

// Adjustment/replacement files exported for this sale.
const AdjustmentHistory = ({ adjustments = [] }) =>
  adjustments.length ? (
    <Timeline
      items={adjustments.map((entry) => ({
        children: (
          <Typography.Text>
            {dayjs(entry.at).format('DD/MM/YYYY HH:mm')} —{' '}
            {KIND_LABELS[entry.kind] || entry.kind} HĐ gốc số{' '}
            {entry.originalNumber}
            {entry.originalSeries ? ` (${entry.originalSeries})` : ''}
          </Typography.Text>
        ),
      }))}
    />
  ) : null;

export default AdjustmentHistory;

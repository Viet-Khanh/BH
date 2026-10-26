import { Alert, Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import { reminderParts } from '../../domain/reminder.js';
import { useEinvoiceSummary } from '../../hooks/useEinvoiceSummary.js';

// One-line Home reminder: e-invoices must be issued on the day of sale.
const EinvoiceReminder = ({ settings }) => {
  const navigate = useNavigate();
  const parts = reminderParts(useEinvoiceSummary(settings));
  if (!parts.length) return null;
  return (
    <Alert
      type="warning"
      showIcon
      style={{ marginBottom: 16 }}
      message={`Hoá đơn điện tử: còn ${parts.join(' · ')}.`}
      action={
        <Button
          size="small"
          type="primary"
          onClick={() => navigate('/einvoice')}
        >
          Xử lý
        </Button>
      }
    />
  );
};

export default EinvoiceReminder;

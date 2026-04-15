import { formatMoney } from '../../../utils/moneyFormat.js';

const ReportPurchaseDetailsSummary = ({ summary }) => (
  <>
    <div style={{ display: 'flex', gap: 40 }}>
      <span className="text-gray-600">
        Tiền hàng:{' '}
        <strong style={{ color: 'blue' }} className="text-lg font-bold">
          {formatMoney(summary.amount)}
        </strong>
      </span>
      <span className="text-gray-600">
        Đã thu:{' '}
        <strong style={{ color: 'green' }} className="text-lg font-bold">
          {formatMoney(summary.paid)}
        </strong>
      </span>
    </div>

    <div style={{ display: 'flex', gap: 40 }}>
      <span className="text-gray-600">
        Còn nợ:{' '}
        <strong style={{ color: 'red' }} className="text-lg font-bold">
          {formatMoney(summary.remain)}
        </strong>
      </span>
      <span className="text-gray-600">
        Tổng cộng:{' '}
        <strong style={{ color: '#0f766e' }} className="text-lg font-bold">
          {formatMoney(summary.totalPay)}
        </strong>
      </span>
    </div>
  </>
);

export default ReportPurchaseDetailsSummary;

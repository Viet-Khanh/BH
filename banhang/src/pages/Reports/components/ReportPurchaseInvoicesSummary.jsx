import { formatMoney } from '../../../utils/moneyFormat.js';

const ReportPurchaseInvoicesSummary = ({ summary = {} }) => (
  <>
    <div style={{ display: 'flex', gap: 40 }}>
      <span className="text-gray-600">
        Tổng bán:{' '}
        <strong style={{ color: 'blue' }} className="text-lg font-bold">
          {formatMoney(summary.amount || 0)}
        </strong>
      </span>
      <span className="text-gray-600">
        Đã thu:{' '}
        <strong style={{ color: 'green' }} className="text-lg font-bold">
          {formatMoney(summary.paid || 0)}
        </strong>
      </span>
    </div>

    <div style={{ display: 'flex', gap: 40 }}>
      <span className="text-gray-600">
        Còn nợ:{' '}
        <strong style={{ color: 'red' }} className="text-lg font-bold">
          {formatMoney(summary.remain || 0)}
        </strong>
      </span>
    </div>
  </>
);

export default ReportPurchaseInvoicesSummary;

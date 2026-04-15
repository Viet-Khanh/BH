import { formatMoney } from '../../../utils/moneyFormat.js';

const ReportSalesInvoicesSummary = ({ summary, showSensitiveInfo = false }) => (
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
      {showSensitiveInfo ? (
        <span className="text-gray-600">
          Lợi nhuận:{' '}
          <strong style={{ color: 'purple' }} className="text-lg font-bold">
            {formatMoney(summary.profit)}
          </strong>
        </span>
      ) : null}
    </div>
  </>
);

export default ReportSalesInvoicesSummary;

import { Modal, Spin } from 'antd';
import dayjs from 'dayjs';
import { useStockCard } from '../hooks/useStockCard.js';
import {
  formatStockArea,
  formatStockNumber,
  formatStockSize,
} from '../reportStockMovementUtils.js';

const TYPE_LABELS = { in: 'Nhập', out: 'Xuất' };

const BalanceCell = ({ value }) => (
  <td className={value < 0 ? 'text-danger' : undefined}>
    {formatStockNumber(value)}
  </td>
);

const StockCardSummary = ({ product, labels }) => (
  <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 12 }}>
    <div>
      Tồn đầu ({labels.opening}):{' '}
      <strong>{formatStockNumber(product.openingStock)}</strong>
    </div>
    <div>
      Nhập: <strong>{formatStockNumber(product.inQty)}</strong>
    </div>
    <div>
      Xuất: <strong>{formatStockNumber(product.outQty)}</strong>
    </div>
    <div>
      Tồn cuối ({labels.closing}):{' '}
      <strong>{formatStockNumber(product.closingStock)}</strong>
    </div>
  </div>
);

const StockCardEntryRow = ({ entry }) => (
  <tr>
    <td>{dayjs(entry.date).format('DD/MM/YYYY HH:mm')}</td>
    <td>{entry.code}</td>
    <td className={entry.type === 'in' ? 'text-success' : undefined}>
      {TYPE_LABELS[entry.type]}
    </td>
    <td>{entry.partnerName}</td>
    <td>{formatStockNumber(entry.qty)}</td>
    <td>{formatStockSize(entry.length, entry.width)}</td>
    <td>{formatStockArea(entry.area)}</td>
    <BalanceCell value={entry.balance} />
  </tr>
);

const StockCardTable = ({ card }) => (
  <div className="table-wrapper">
    <table className="invoice-items-table">
      <thead>
        <tr>
          <th>Ngày</th>
          <th>Chứng từ</th>
          <th>Loại</th>
          <th>Đối tác</th>
          <th>SL</th>
          <th>Dài × Rộng</th>
          <th>m²</th>
          <th>Tồn sau</th>
        </tr>
      </thead>
      <tbody>
        <tr style={{ fontWeight: 600 }}>
          <td colSpan={7}>Tồn đầu kỳ</td>
          <BalanceCell value={card.product.openingStock} />
        </tr>
        {card.entries.map((entry) => (
          <StockCardEntryRow key={entry.key} entry={entry} />
        ))}
        {!card.entries.length && (
          <tr>
            <td colSpan={8}>Không có phát sinh trong kỳ.</td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
);

const StockCardModal = ({ product, range, labels, onClose }) => {
  const { card, loading } = useStockCard({ productId: product?.id, range });

  return (
    <Modal
      title={`Thẻ kho: ${product?.name || ''}${product?.unit ? ` (${product.unit})` : ''}`}
      open={!!product}
      onCancel={onClose}
      footer={null}
      width={960}
    >
      <Spin spinning={loading}>
        {card ? (
          <>
            <StockCardSummary product={card.product} labels={labels} />
            <StockCardTable card={card} />
          </>
        ) : (
          <div style={{ minHeight: 120 }} />
        )}
      </Spin>
    </Modal>
  );
};

export default StockCardModal;

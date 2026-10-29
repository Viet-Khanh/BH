import { formatMoney } from '../../../../utils/moneyFormat.js';
import { row } from './html.js';

// Total; old debt and grand total when the customer owed before; paid; debt or change.
export const renderTotals = ({ amounts }) => {
  const { total, oldDebt, paid, due } = amounts;
  const lines = [row('TỔNG CỘNG', formatMoney(total), 'row total')];
  if (oldDebt !== 0) {
    lines.push(
      row('Nợ cũ', formatMoney(oldDebt)),
      row('Tổng thanh toán', formatMoney(total + oldDebt), 'row total')
    );
  }
  lines.push(row('Khách trả', formatMoney(paid)));
  if (due > 0) lines.push(row('Còn nợ', formatMoney(due)));
  if (due < 0) lines.push(row('Tiền thối', formatMoney(-due)));
  return lines.join('');
};

// Money of a sale receipt: total, customer's old debt, paid now, amount due.
import { getLineAmount } from '../../../utils/lineMeasure.js';

const sumBy = (list, pick) =>
  (Array.isArray(list) ? list : []).reduce(
    (sum, entry) => sum + Number(pick(entry) || 0),
    0
  );

// due = total + oldDebt − paid (< 0 = change to give back).
export const getReceiptAmounts = (
  invoice = {},
  payments = [],
  items = invoice?.items
) => {
  const total = Number(
    invoice?.total ??
      sumBy(items, (item) => item.lineTotal ?? getLineAmount(item))
  );
  const oldDebt = Number(invoice?.customerDebt || 0);
  const paid = sumBy(payments, (payment) => payment.amount);
  return { total, oldDebt, paid, due: total + oldDebt - paid };
};

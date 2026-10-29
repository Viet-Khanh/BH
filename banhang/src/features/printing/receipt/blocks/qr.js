import { formatMoney } from '../../../../utils/moneyFormat.js';
import { findBank } from '../banks.js';
import { text } from './html.js';

// VietQR made beforehand (receiptAssets); caption lets the customer check the payee.
export const renderQr = ({ qrSvg, settings, amounts }) => {
  if (!qrSvg) return '';
  const bank = findBank(settings.bankBin)?.name || settings.bankBin || '';
  const lines = [
    `${text(bank)} · ${text(settings.bankAccountNo || '')}`,
    settings.bankAccountName && text(settings.bankAccountName),
    `Số tiền: ${formatMoney(amounts.due)}`,
  ].filter(Boolean);
  return `<div class="center"><div class="qr">${qrSvg}</div><div class="small">${lines.join('<br />')}</div></div>`;
};

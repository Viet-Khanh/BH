import { printHtml } from '../../utils/printUtils.js';
import { renderDebtReceiptTemplate } from '../../utils/renderDebtReceiptTemplate.js';

export const findSupplierDebtPaymentRow = (debtDetail, paymentId) =>
  debtDetail?.debtPayments?.find((row) => row.id === paymentId) || null;

export const printSupplierDebtPaymentDocument = async ({
  payment,
  supplier,
  settings,
  timelineRow,
  copies,
}) => {
  if (!payment || !supplier) return;
  const html = renderDebtReceiptTemplate({
    receipt: payment,
    customer: supplier,
    settings,
    debtBefore: Number(timelineRow?.oldDebt ?? payment?.oldDebt ?? 0),
    labels: {
      title: 'PHIẾU TRẢ NỢ',
      subtitle: 'Biên nhận trả công nợ nhà cung cấp',
      dateLabel: 'Ngày trả:',
      partnerSectionTitle: 'Thông tin nhà cung cấp',
      partnerNameLabel: 'Nhà cung cấp:',
      fallbackPartnerName: 'Nhà cung cấp',
      debtBeforeLabel: 'Nợ trước trả',
      amountLabel: 'Số tiền trả',
      debtAfterLabel: 'Còn lại sau trả',
      payerSignatureTitle: 'Người nhận tiền',
    },
  });
  const printCopies = Math.max(
    1,
    Math.round(Number(copies ?? settings?.printCopies ?? 1))
  );
  await printHtml(html, { copies: printCopies, autoPageSize: true });
};

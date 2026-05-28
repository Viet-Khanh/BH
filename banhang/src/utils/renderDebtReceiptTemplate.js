import dayjs from 'dayjs';
import { formatMoney } from './moneyFormat.js';

const METHOD_LABELS = {
  cash: 'Tiền mặt',
  bank: 'Chuyển khoản',
  other: 'Khác',
};

const escapeHtml = (value) =>
  String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

export const renderDebtReceiptTemplate = ({
  receipt,
  customer,
  settings,
  debtBefore = 0,
  labels = {},
}) => {
  const text = {
    title: 'PHIẾU THU NỢ',
    subtitle: 'Biên nhận thu công nợ khách hàng',
    dateLabel: 'Ngày thu:',
    partnerSectionTitle: 'Thông tin khách hàng',
    partnerNameLabel: 'Khách hàng:',
    fallbackPartnerName: 'Khách hàng',
    debtBeforeLabel: 'Nợ trước thu',
    amountLabel: 'Số tiền thu',
    debtAfterLabel: 'Còn lại sau thu',
    payerSignatureTitle: 'Người nộp tiền',
    printMeta: 'Chứng từ được in từ hệ thống bán hàng',
    ...labels,
  };
  const amount = Number(receipt?.amount || 0);
  const remainingDebt = Number(debtBefore || 0) - amount;
  const methodLabel = METHOD_LABELS[receipt?.method] || receipt?.method || '';
  const receiptDate = receipt?.date
    ? dayjs(receipt.date).format('DD/MM/YYYY HH:mm')
    : '';
  const printDate = dayjs().format('DD/MM/YYYY HH:mm');
  const note = String(receipt?.note || '').trim();

  return `
    <style>
      @page { size: A5 portrait; margin: 8mm 9mm; }
      body {
        margin: 0;
        font-family: "Times New Roman", Times, serif;
        color: #111;
        background: #fff;
      }
      .receipt {
        max-width: 520px;
        margin: 0 auto;
        font-size: 14px;
        line-height: 1.45;
      }
      .shop-header {
        text-align: center;
      }
      .shop-name {
        font-size: 20px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.4px;
      }
      .shop-line {
        margin-top: 2px;
      }
      .divider {
        border-top: 1.5px solid #111;
        margin: 10px 0 12px;
      }
      .title-wrap {
        text-align: center;
      }
      .title {
        font-size: 24px;
        font-weight: 700;
        letter-spacing: 1px;
        text-transform: uppercase;
      }
      .subtitle {
        margin-top: 2px;
        font-style: italic;
        font-size: 13px;
      }
      .meta {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px 14px;
        margin-top: 12px;
        padding: 8px 10px;
        border: 1px solid #111;
      }
      .meta-item {
        display: flex;
        gap: 6px;
      }
      .meta-label {
        min-width: 74px;
        font-weight: 700;
      }
      .section {
        margin-top: 12px;
        border: 1px solid #111;
        padding: 8px 10px;
      }
      .section-title {
        font-weight: 700;
        text-transform: uppercase;
        margin-bottom: 6px;
      }
      .row {
        display: flex;
        gap: 8px;
        margin-top: 4px;
      }
      .label {
        min-width: 92px;
        font-weight: 700;
      }
      table.summary {
        width: 100%;
        border-collapse: collapse;
        margin-top: 12px;
      }
      table.summary td {
        border: 1px solid #111;
        padding: 8px 10px;
      }
      table.summary td:first-child {
        font-weight: 700;
      }
      table.summary td:last-child {
        text-align: right;
        font-weight: 700;
        width: 170px;
      }
      table.summary tr.total td {
        font-size: 15px;
        background: #f3f3f3;
      }
      .note-box {
        min-height: 52px;
        border: 1px solid #111;
        padding: 8px 10px;
        margin-top: 6px;
        white-space: pre-wrap;
      }
      .footer-line {
        margin-top: 8px;
        text-align: right;
        font-style: italic;
      }
      .signatures {
        display: flex;
        justify-content: space-between;
        margin-top: 28px;
      }
      .sign-col {
        width: 42%;
        text-align: center;
      }
      .sign-title {
        font-weight: 700;
        text-transform: uppercase;
      }
      .sign-sub {
        font-size: 12px;
        font-style: italic;
        margin-top: 2px;
      }
      .sign-space {
        height: 74px;
      }
      .print-meta {
        margin-top: 8px;
        text-align: right;
        font-size: 11px;
      }
    </style>
    <div class="receipt">
      <div class="shop-header">
        <div class="shop-name">${escapeHtml(settings?.shopName || '')}</div>
        <div class="shop-line">${escapeHtml(settings?.shopAddress || '')}</div>
        <div class="shop-line">Điện thoại: ${escapeHtml(settings?.shopPhone || '')}</div>
      </div>
      <div class="divider"></div>
      <div class="title-wrap">
        <div class="title">${escapeHtml(text.title)}</div>
        <div class="subtitle">${escapeHtml(text.subtitle)}</div>
      </div>

      <div class="meta">
        <div class="meta-item">
          <div class="meta-label">Số phiếu:</div>
          <div>${escapeHtml(receipt?.code || receipt?.id || '')}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">${escapeHtml(text.dateLabel)}</div>
          <div>${escapeHtml(receiptDate)}</div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">${escapeHtml(text.partnerSectionTitle)}</div>
        <div class="row">
          <div class="label">${escapeHtml(text.partnerNameLabel)}</div>
          <div>${escapeHtml(customer?.name || text.fallbackPartnerName)}</div>
        </div>
        <div class="row">
          <div class="label">Điện thoại:</div>
          <div>${escapeHtml(customer?.phone || '')}</div>
        </div>
        <div class="row">
          <div class="label">Địa chỉ:</div>
          <div>${escapeHtml(customer?.address || '')}</div>
        </div>
        <div class="row">
          <div class="label">Phương thức:</div>
          <div>${escapeHtml(methodLabel)}</div>
        </div>
      </div>

      <table class="summary">
        <tr>
          <td>${escapeHtml(text.debtBeforeLabel)}</td>
          <td>${formatMoney(debtBefore)}</td>
        </tr>
        <tr class="total">
          <td>${escapeHtml(text.amountLabel)}</td>
          <td>${formatMoney(amount)}</td>
        </tr>
        <tr>
          <td>${escapeHtml(text.debtAfterLabel)}</td>
          <td>${formatMoney(remainingDebt)}</td>
        </tr>
      </table>

      <div class="section">
        <div class="section-title">Ghi chú</div>
        <div class="note-box">${escapeHtml(note)}</div>
      </div>

      <div class="footer-line">Ngày in: ${escapeHtml(printDate)}</div>

      <div class="signatures">
        <div class="sign-col">
          <div class="sign-title">${escapeHtml(text.payerSignatureTitle)}</div>
          <div class="sign-sub">(Ký, ghi rõ họ tên)</div>
          <div class="sign-space"></div>
        </div>
        <div class="sign-col">
          <div class="sign-title">Người lập phiếu</div>
          <div class="sign-sub">(Ký, ghi rõ họ tên)</div>
          <div class="sign-space"></div>
        </div>
      </div>

      <div class="print-meta">${escapeHtml(text.printMeta)}</div>
    </div>
  `;
};

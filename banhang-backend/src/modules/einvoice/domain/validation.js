import { isAfterReducedVat, REDUCED_RATE } from './reducedVat.js';

const error = (message) => ({ level: 'error', message });
const warning = (message) => ({ level: 'warning', message });

// Problems that block the whole export.
export const validateSettings = (settings = {}) =>
  String(settings.sellerTaxCode || '').trim()
    ? []
    : [error('Chưa nhập mã số thuế người bán (Hệ thống → Hoá đơn điện tử).')];

const validateLine = (line, taxMethod) => {
  const issues = [];
  const label = `Dòng ${line.index}`;
  if (!(Number(line.quantity) > 0))
    issues.push(error(`${label}: số lượng phải lớn hơn 0.`));
  if (Number(line.unitPrice) < 0)
    issues.push(error(`${label}: đơn giá không được âm.`));
  if (taxMethod === 'deduction' && !line.vatRate) {
    issues.push(error(`${label}: thuế suất GTGT không hợp lệ.`));
  }
  return issues;
};

// Errors exclude the invoice from export; warnings are shown but allowed.
export const validateDocument = (doc) => {
  const issues = doc.lines.length ? [] : [error('Hoá đơn không có dòng hàng.')];
  doc.lines.forEach((line) =>
    issues.push(...validateLine(line, doc.taxMethod))
  );
  if (
    isAfterReducedVat(doc.date) &&
    doc.lines.some((line) => line.vatRate === REDUCED_RATE)
  ) {
    issues.push(
      warning(
        'Thuế suất 8% chỉ áp dụng đến 31/12/2026: kiểm tra lại thuế suất.'
      )
    );
  }
  if (doc.buyer.taxCode && !doc.buyer.address) {
    issues.push(warning('Khách có mã số thuế nhưng chưa có địa chỉ.'));
  }
  return issues;
};

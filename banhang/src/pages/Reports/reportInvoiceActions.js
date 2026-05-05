import * as XLSX from 'xlsx';
import { saveWorkbook } from '../../utils/excelExport.js';
import { printHtml } from '../../utils/printUtils.js';

export const exportReportInvoiceItems = async ({
  items = [],
  code,
  priceKey = 'unitPrice',
}) => {
  const rowsToExport = items.map((item, index) => ({
    STT: index + 1,
    Ten_hang: item.name,
    DVT: item.unit,
    Quy_cach: item.spec,
    So_luong: item.qty,
    Don_gia: item[priceKey],
    Thanh_tien: item.lineTotal,
    Ghi_chu: item.note,
  }));

  if (!rowsToExport.length) {
    return false;
  }

  const worksheet = XLSX.utils.json_to_sheet(rowsToExport);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Hoa_don');
  await saveWorkbook(workbook, code || 'hoa-don');
  return true;
};

export const printReportInvoicePreview = async ({
  previewHtml,
  settings,
  copies,
}) => {
  if (!previewHtml) return;
  const printCopies = Math.max(
    1,
    Math.round(Number(copies ?? settings?.printCopies ?? 1))
  );
  await printHtml(previewHtml, { copies: printCopies, autoPageSize: true });
};

import { message } from 'antd';
import dayjs from 'dayjs';
import { useCallback, useState } from 'react';
import * as XLSX from 'xlsx';
import { saveWorkbook } from '../../../utils/excelExport.js';
import { markEinvoicesExported } from '../api/einvoiceApi.js';
import { applyProfile } from '../domain/applyProfile.js';
import { getProfile } from '../profiles/index.js';

const hasErrors = (item) =>
  item.issues.some((issue) => issue.level === 'error');

export const buildEinvoiceWorkbook = (profile, documents) => {
  const { sheetName, rows } = applyProfile(profile, documents, {
    taxMethod: documents[0]?.taxMethod,
  });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.aoa_to_sheet(rows),
    sheetName
  );
  return workbook;
};

// Builds the file, lets the user save it, and only then marks the invoices
// exported (cancelling the save dialog changes nothing).
export const useEinvoiceExport = ({ onExported }) => {
  const [exporting, setExporting] = useState(false);

  const exportItems = useCallback(
    async (items, profileId) => {
      const exportable = items.filter((item) => !hasErrors(item));
      const skipped = items.length - exportable.length;
      if (!exportable.length) {
        message.error('Không có hoá đơn hợp lệ để xuất.');
        return;
      }
      const profile = getProfile(profileId);
      setExporting(true);
      try {
        const workbook = buildEinvoiceWorkbook(
          profile,
          exportable.map((item) => item.document)
        );
        const fileName = `HDDT-${dayjs().format('YYYYMMDD-HHmm')}`;
        if (!(await saveWorkbook(workbook, fileName))) return;
        await markEinvoicesExported(
          exportable.map((item) => item.invoiceId),
          profile.id
        );
        const skippedText = skipped ? `, bỏ qua ${skipped} hoá đơn có lỗi` : '';
        message.success(`Đã xuất ${exportable.length} hoá đơn${skippedText}.`);
        onExported?.();
      } catch (error) {
        message.error(`Xuất file thất bại: ${error.message}`);
      } finally {
        setExporting(false);
      }
    },
    [onExported]
  );

  return { exporting, exportItems };
};

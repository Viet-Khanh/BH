import { message } from 'antd';
import dayjs from 'dayjs';
import { useCallback, useState } from 'react';
import * as XLSX from 'xlsx';
import { saveWorkbook } from '../../../utils/excelExport.js';
import {
  markEinvoicesAdjusted,
  markEinvoicesExported,
} from '../api/einvoiceApi.js';
import {
  applyProfile,
  documentProblems,
  profileProblems,
} from '../domain/applyProfile.js';
import { getProfile } from '../profiles/index.js';

// issue = normal export of pending sales; adjust = adjustment/replacement data
// for sales changed after export (backend `item.adjustment`).
const PURPOSES = {
  issue: {
    filePrefix: 'HDDT',
    documentOf: (item) => item.document,
    issuesOf: (item) => item.issues,
    mark: markEinvoicesExported,
  },
  adjust: {
    filePrefix: 'HDDT-DieuChinh',
    documentOf: (item) => item.adjustment?.document,
    issuesOf: (item) => item.adjustment?.issues || [],
    mark: markEinvoicesAdjusted,
  },
};

export const buildEinvoiceWorkbook = (profile, documents) => {
  const { sheetName, rows } = applyProfile(profile, documents, {
    taxMethod: documents[0]?.taxMethod,
  });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.aoa_to_sheet(rows),
    sheetName.slice(0, 31)
  );
  return workbook;
};

// Builds the file, lets the user save it, and only then marks the invoices
// (cancelling the save dialog changes nothing).
export const useEinvoiceExport = ({ settings, onExported }) => {
  const [exporting, setExporting] = useState(false);

  const exportItems = useCallback(
    async (items, profileId, purposeKey = 'issue') => {
      const purpose = PURPOSES[purposeKey];
      const profile = getProfile(profileId, settings, purposeKey);
      const blocking = profileProblems(profile);
      if (blocking.length) {
        message.error(blocking[0]);
        return;
      }
      const exportable = items.filter((item) => {
        const doc = purpose.documentOf(item);
        return (
          doc &&
          !purpose.issuesOf(item).some((issue) => issue.level === 'error') &&
          !documentProblems(profile, doc).length
        );
      });
      const skipped = items.length - exportable.length;
      if (!exportable.length) {
        message.error('Không có hoá đơn hợp lệ để xuất với mẫu này.');
        return;
      }
      setExporting(true);
      try {
        const workbook = buildEinvoiceWorkbook(
          profile,
          exportable.map(purpose.documentOf)
        );
        const fileName = `${purpose.filePrefix}-${dayjs().format('YYYYMMDD-HHmm')}`;
        if (!(await saveWorkbook(workbook, fileName))) return;
        await purpose.mark(
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
    [settings, onExported]
  );

  return { exporting, exportItems };
};

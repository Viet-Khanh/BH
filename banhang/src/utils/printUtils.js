import { message } from 'antd';
import {
  injectPageSizeCss,
  normalizeMmPageSize,
  normalizePageSize,
} from './printPageSize.js';
import {
  resolveAutoHeightPageSize,
  resolveAutoPageSize,
} from './printMeasure.js';

const resolvePageSize = async (documentHtml, options) => {
  const { pageSize, pageSizeMm, autoPageSize, autoHeightWidthMm } = options;
  const explicit =
    normalizeMmPageSize(pageSizeMm) || normalizePageSize(pageSize);
  if (Number(autoHeightWidthMm) > 0) {
    try {
      const measured = await resolveAutoHeightPageSize(
        documentHtml,
        Number(autoHeightWidthMm)
      );
      return measured || explicit;
    } catch (error) {
      return explicit;
    }
  }
  if (!autoPageSize) return explicit;
  try {
    return await resolveAutoPageSize(documentHtml);
  } catch (error) {
    return explicit || 'A4';
  }
};

const wrapHtmlDocument = (html) => {
  const content = String(html || '');
  if (!content.trim()) return '';
  if (/<html[\s>]/i.test(content)) return content;
  return `<!doctype html>
    <html lang="vi">
      <head>
        <meta charset="utf-8" />
        <title>In</title>
      </head>
      <body>${content}</body>
    </html>`;
};

export const printHtml = async (
  html,
  {
    copies = 1,
    forceDialog = false,
    pageSize = '',
    pageSizeMm = null,
    autoPageSize = false,
    autoHeightWidthMm = 0,
    deviceName = '',
  } = {}
) => {
  const documentHtml = wrapHtmlDocument(html);
  if (!documentHtml) {
    message.warning('Khong co du lieu de in.');
    return false;
  }

  const safeCopies = Math.max(1, Math.round(Number(copies) || 1));
  const resolvedPageSize = await resolvePageSize(documentHtml, {
    pageSize,
    pageSizeMm,
    autoPageSize,
    autoHeightWidthMm,
  });
  const htmlForPrint = injectPageSizeCss(documentHtml, resolvedPageSize);
  const printerName = String(deviceName || '').trim();

  const hasElectronPrint =
    typeof window !== 'undefined' &&
    typeof window.electronAPI?.printHtml === 'function';

  if (hasElectronPrint) {
    try {
      const result = await window.electronAPI.printHtml(htmlForPrint, {
        copies: safeCopies,
        silent: !forceDialog,
        pageSize: resolvedPageSize,
        deviceName: printerName,
      });
      if (result?.ok === false) {
        throw new Error(result.error || 'Print failed');
      }
      if (result?.fallback) {
        message.warning(
          `Không tìm thấy máy in '${printerName}', đã in ra máy mặc định.`
        );
      }
      return true;
    } catch (error) {
      message.warning('Khong the in tu dong, dang mo hop thoai in.');
    }
  }

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    message.warning('Trinh duyet chan cua so in.');
    return false;
  }

  printWindow.document.write(htmlForPrint);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
  printWindow.onafterprint = () => printWindow.close();
  return true;
};

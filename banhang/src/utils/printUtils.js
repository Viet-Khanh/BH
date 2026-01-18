import { message } from 'antd';

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

export const printHtml = async (html, { copies = 1, forceDialog = false } = {}) => {
  const documentHtml = wrapHtmlDocument(html);
  if (!documentHtml) {
    message.warning('Khong co du lieu de in.');
    return false;
  }

  const safeCopies = Math.max(1, Math.round(Number(copies) || 1));

  const hasElectronPrint =
    typeof window !== 'undefined' && typeof window.electronAPI?.printHtml === 'function';

  if (hasElectronPrint) {
    try {
      const result = await window.electronAPI.printHtml(documentHtml, {
        copies: safeCopies,
        silent: !forceDialog,
      });
      if (result?.ok === false) {
        throw new Error(result.error || 'Print failed');
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

  printWindow.document.write(documentHtml);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
  printWindow.onafterprint = () => printWindow.close();
  return true;
};

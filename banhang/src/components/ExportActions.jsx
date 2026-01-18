import { useEffect } from 'react';
import { Button, Dropdown, message } from 'antd';
import * as XLSX from 'xlsx';
import { useSettingsStore } from '../store/settingsStore.js';
import { saveWorkbook } from '../utils/excelExport.js';
import { printHtml } from '../utils/printUtils.js';

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const buildPrintHtml = ({ title, rows }) => {
  const safeTitle = escapeHtml(title || 'Du lieu');
  const headers = rows.length ? Object.keys(rows[0]) : [];
  const headerCells = headers.map((key) => `<th>${escapeHtml(key.replace(/_/g, ' '))}</th>`).join('');
  const bodyRows = rows.length
    ? rows
        .map(
          (row) =>
            `<tr>${headers
              .map((key) => `<td>${escapeHtml(row[key])}</td>`)
              .join('')}</tr>`
        )
        .join('')
    : `<tr><td colspan="${Math.max(headers.length, 1)}">Chưa có dữ liệu.</td></tr>`;

  return `<!doctype html>
    <html lang="vi">
      <head>
        <meta charset="utf-8" />
        <title>${safeTitle}</title>
        <style>
          body { font-family: "Be Vietnam Pro", Arial, sans-serif; padding: 24px; color: #123b3a; }
          h2 { margin: 0 0 12px; font-size: 20px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th, td { border: 1px solid #d7e5e3; padding: 6px 8px; text-align: left; }
          th { background: #f2fbfa; }
        </style>
      </head>
      <body>
        <h2>${safeTitle}</h2>
        <table>
          ${headers.length ? `<thead><tr>${headerCells}</tr></thead>` : ''}
          <tbody>${bodyRows}</tbody>
        </table>
      </body>
    </html>`;
};

const ExportActions = ({ rows = [], pdfRows, fileName = 'du-lieu', sheetName = 'Data', title }) => {
  const rowsForPdf = pdfRows && pdfRows.length ? pdfRows : rows;
  const { settings, load: loadSettings } = useSettingsStore();

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const printCopies = Math.max(1, Math.round(Number(settings?.printCopies || 1)));

  const handleExcel = async () => {
    if (!rows.length) {
      message.warning('Không có dữ liệu để xuất.');
      return;
    }
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    await saveWorkbook(workbook, fileName);
  };

  const handlePrint = async () => {
    if (!rowsForPdf.length) {
      message.warning('Không có dữ liệu để in.');
      return;
    }
    const html = buildPrintHtml({ title: title || fileName, rows: rowsForPdf });
    await printHtml(html, { copies: printCopies });
  };

  const handlePdf = async () => {
    if (!rowsForPdf.length) {
      message.warning('Không có dữ liệu để xuất.');
      return;
    }
    const html = buildPrintHtml({ title: title || fileName, rows: rowsForPdf });
    await printHtml(html, { copies: printCopies, forceDialog: true });
  };

  const exportItems = [
    { key: 'excel', label: 'Excel' },
    { key: 'pdf', label: 'PDF' },
  ];

  const handleMenuClick = ({ key }) => {
    if (key === 'excel') void handleExcel();
    if (key === 'pdf') void handlePdf();
  };

  return (
    <div className="export-actions">
      <Button size="large" onClick={handlePrint}>
        In
      </Button>
      <Dropdown menu={{ items: exportItems, onClick: handleMenuClick }} trigger={['click']}>
        <Button size="large">Xuất</Button>
      </Dropdown>
    </div>
  );
};

export default ExportActions;

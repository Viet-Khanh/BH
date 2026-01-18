import { useRef, useState } from 'react';
import { message } from 'antd';
import * as XLSX from 'xlsx';
import { saveWorkbook } from '../../utils/excelExport.js';
import {
  buildTemplateRow,
  IMPORT_CONFIGS,
  normalizeHeader,
  TEMPLATE_CONFIGS,
} from './catalogUtils.js';

const useCatalogImport = ({
  activeKey,
  bulkAddProducts,
  bulkAddCustomers,
  bulkAddSuppliers,
  bulkAddUnits,
}) => {
  const [importing, setImporting] = useState(false);
  const [importTarget, setImportTarget] = useState(null);
  const fileInputRef = useRef(null);
  const importTargetRef = useRef(null);

  const resetImportState = () => {
    setImportTarget(null);
    importTargetRef.current = null;
  };

  const handleDownloadTemplate = async (tabKey) => {
    const config = TEMPLATE_CONFIGS[tabKey];
    if (!config) {
      message.warning('Chưa hỗ trợ tải mẫu cho tab này.');
      return;
    }
    const worksheet = XLSX.utils.json_to_sheet([buildTemplateRow(config.headers)]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, config.sheetName);
    await saveWorkbook(workbook, config.fileName);
  };

  const readWorkbook = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = new Uint8Array(event.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          resolve(workbook);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(reader.error || new Error('File read error'));
      reader.readAsArrayBuffer(file);
    });

  const handleImportExcel = async (file, tabKey) => {
    const config = IMPORT_CONFIGS[tabKey];
    const bulkAddMap = {
      products: bulkAddProducts,
      customers: bulkAddCustomers,
      suppliers: bulkAddSuppliers,
      units: bulkAddUnits,
    };
    const bulkAdd = bulkAddMap[tabKey];
    if (!config || !bulkAdd) {
      message.warning('Chưa hỗ trợ nhập dữ liệu cho tab này.');
      return;
    }

    setImporting(true);
    try {
      const workbook = await readWorkbook(file);
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) {
        message.warning('File không có sheet dữ liệu.');
        return;
      }
      const worksheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
      if (!rows.length) {
        message.warning('File không có dữ liệu để nhập.');
        return;
      }

      const [headerRow = [], ...dataRows] = rows;
      const normalizedHeaders = headerRow.map((cell) => normalizeHeader(cell));
      if (!normalizedHeaders.some(Boolean)) {
        message.warning('Không tìm thấy tiêu đề cột trong file.');
        return;
      }

      const fieldPresence = {};
      normalizedHeaders.forEach((headerKey) => {
        const field = config.columnMap[headerKey];
        if (field) fieldPresence[field] = true;
      });
      const missingFields = config.requiredFields.filter((field) => !fieldPresence[field]);
      if (missingFields.length) {
        const labels = missingFields.map((field) => config.requiredLabels[field] || field);
        message.error(`Thiếu cột bắt buộc: ${labels.join(', ')}.`);
        return;
      }

      const items = dataRows
        .filter((row) => row.some((cell) => String(cell ?? '').trim() !== ''))
        .map((row) => {
          const raw = {};
          normalizedHeaders.forEach((headerKey, index) => {
            const field = config.columnMap[headerKey];
            if (!field) return;
            raw[field] = row[index];
          });
          return config.buildItem(raw);
        })
        .filter(Boolean);

      if (!items.length) {
        message.warning('Không có dòng hợp lệ để nhập.');
        return;
      }

      await bulkAdd(items);
      const skipped = dataRows.length - items.length;
      if (skipped > 0) {
        message.success(`Đã nhập ${items.length} dòng. Bỏ qua ${skipped} dòng trống hoặc thiếu dữ liệu.`);
      } else {
        message.success(`Đã nhập ${items.length} dòng.`);
      }
    } catch (error) {
      message.error(`Không thể nhập dữ liệu: ${error.message || 'Lỗi không xác định'}`);
    } finally {
      setImporting(false);
    }
  };

  const triggerImport = (tabKey) => {
    importTargetRef.current = tabKey;
    setImportTarget(tabKey);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const tabKey = importTargetRef.current || activeKey;
    await handleImportExcel(file, tabKey);
    event.target.value = '';
  };

  return {
    importing,
    importTarget,
    fileInputRef,
    handleDownloadTemplate,
    triggerImport,
    handleFileChange,
    resetImportState,
  };
};

export default useCatalogImport;

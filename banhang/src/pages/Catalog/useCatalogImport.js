import { useRef, useState } from 'react';
import { message } from 'antd';
import * as XLSX from 'xlsx';
import { saveWorkbook } from '../../utils/excelExport.js';
import {
  buildProductPriceUpdateRows,
  buildTemplateRow,
  IMPORT_CONFIGS,
  normalizeHeader,
  PRODUCT_PRICE_UPDATE_IMPORT_CONFIG,
  PRODUCT_PRICE_UPDATE_TEMPLATE_CONFIG,
  TEMPLATE_CONFIGS,
} from './catalogUtils.js';

const useCatalogImport = ({
  activeKey,
  products,
  bulkAddProducts,
  bulkAddCustomers,
  bulkAddSuppliers,
  bulkAddUnits,
  bulkUpdatePricesByName,
}) => {
  const [importing, setImporting] = useState(false);
  const [importTarget, setImportTarget] = useState(null);
  const [importMode, setImportMode] = useState(null);
  const fileInputRef = useRef(null);
  const importTargetRef = useRef(null);

  const resetImportState = () => {
    setImportTarget(null);
    setImportMode(null);
    importTargetRef.current = null;
  };

  const handleDownloadTemplate = async (tabKey, mode = 'catalog') => {
    if (mode === 'price-update') {
      if (tabKey !== 'products') {
        message.warning('Chỉ hỗ trợ cập nhật giá cho sản phẩm.');
        return;
      }
      const rows = buildProductPriceUpdateRows(products);
      const headers = PRODUCT_PRICE_UPDATE_TEMPLATE_CONFIG.headers;
      const values = rows.length
        ? rows.map((row) => headers.map((header) => row[header] ?? ''))
        : [headers.map(() => '')];
      const worksheet = XLSX.utils.aoa_to_sheet([headers, ...values]);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        PRODUCT_PRICE_UPDATE_TEMPLATE_CONFIG.sheetName
      );
      await saveWorkbook(
        workbook,
        PRODUCT_PRICE_UPDATE_TEMPLATE_CONFIG.fileName
      );
      return;
    }

    const config = TEMPLATE_CONFIGS[tabKey];
    if (!config) {
      message.warning('Chưa hỗ trợ tải mẫu cho tab này.');
      return;
    }
    const worksheet = XLSX.utils.json_to_sheet([
      buildTemplateRow(config.headers),
    ]);
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
      reader.onerror = () =>
        reject(reader.error || new Error('File read error'));
      reader.readAsArrayBuffer(file);
    });

  const parseWorkbookItems = (workbook, config) => {
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      throw new Error('File không có sheet dữ liệu.');
    }

    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
    if (!rows.length) {
      throw new Error('File không có dữ liệu để nhập.');
    }

    const [headerRow = [], ...dataRows] = rows;
    const normalizedHeaders = headerRow.map((cell) => normalizeHeader(cell));
    if (!normalizedHeaders.some(Boolean)) {
      throw new Error('Không tìm thấy tiêu đề cột trong file.');
    }

    const fieldPresence = {};
    normalizedHeaders.forEach((headerKey) => {
      const field = config.columnMap[headerKey];
      if (field) fieldPresence[field] = true;
    });
    const missingFields = config.requiredFields.filter(
      (field) => !fieldPresence[field]
    );
    if (missingFields.length) {
      const labels = missingFields.map(
        (field) => config.requiredLabels[field] || field
      );
      throw new Error(`Thiếu cột bắt buộc: ${labels.join(', ')}.`);
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

    return {
      items,
      skipped: dataRows.length - items.length,
    };
  };

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
      const { items, skipped } = parseWorkbookItems(workbook, config);
      if (!items.length) {
        message.warning('Không có dòng hợp lệ để nhập.');
        return;
      }

      await bulkAdd(items);
      if (skipped > 0) {
        message.success(
          `Đã nhập ${items.length} dòng. Bỏ qua ${skipped} dòng trống hoặc thiếu dữ liệu.`
        );
      } else {
        message.success(`Đã nhập ${items.length} dòng.`);
      }
    } catch (error) {
      message.error(
        `Không thể nhập dữ liệu: ${error.message || 'Lỗi không xác định'}`
      );
    } finally {
      setImporting(false);
    }
  };

  const handlePriceUpdateExcel = async (file, tabKey) => {
    if (tabKey !== 'products' || typeof bulkUpdatePricesByName !== 'function') {
      message.warning('Chưa hỗ trợ cập nhật giá cho tab này.');
      return;
    }

    setImporting(true);
    try {
      const workbook = await readWorkbook(file);
      const { items, skipped } = parseWorkbookItems(
        workbook,
        PRODUCT_PRICE_UPDATE_IMPORT_CONFIG
      );
      if (!items.length) {
        message.warning('Không có dòng hợp lệ để cập nhật giá.');
        return;
      }

      const result = await bulkUpdatePricesByName(items);
      const parts = [];
      const updatedCount = Number(result?.updatedCount || 0);
      if (updatedCount > 0) parts.push(`Đã cập nhật ${updatedCount} sản phẩm`);
      if (result?.missingNames?.length) {
        parts.push(`Không tìm thấy ${result.missingNames.length} tên sản phẩm`);
      }
      if (result?.duplicateNamesInFile?.length) {
        parts.push(
          `Trùng ${result.duplicateNamesInFile.length} tên trong file`
        );
      }
      if (result?.ambiguousNames?.length) {
        parts.push(
          `Có ${result.ambiguousNames.length} tên đang bị trùng trong hệ thống`
        );
      }
      const invalidCount = skipped + Number(result?.invalidRows?.length || 0);
      if (invalidCount > 0)
        parts.push(`Bỏ qua ${invalidCount} dòng không hợp lệ`);

      const summary = parts.join('. ');
      if (
        updatedCount > 0 &&
        !result?.missingNames?.length &&
        !result?.duplicateNamesInFile?.length &&
        !result?.ambiguousNames?.length &&
        invalidCount === 0
      ) {
        message.success(summary || 'Đã cập nhật giá sản phẩm.');
      } else if (updatedCount > 0) {
        message.warning(summary || 'Đã cập nhật một phần dữ liệu giá.');
      } else {
        message.error(summary || 'Không có sản phẩm nào được cập nhật.');
      }
    } catch (error) {
      message.error(
        `Không thể cập nhật giá: ${error.message || 'Lỗi không xác định'}`
      );
    } finally {
      setImporting(false);
    }
  };

  const triggerImport = (tabKey, mode = 'catalog') => {
    importTargetRef.current = { tabKey, mode };
    setImportTarget(tabKey);
    setImportMode(mode);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const target = importTargetRef.current || {
      tabKey: activeKey,
      mode: 'catalog',
    };
    if (target.mode === 'price-update') {
      await handlePriceUpdateExcel(file, target.tabKey);
    } else {
      await handleImportExcel(file, target.tabKey);
    }
    event.target.value = '';
  };

  return {
    importing,
    importTarget,
    importMode,
    fileInputRef,
    handleDownloadTemplate,
    triggerImport,
    handleFileChange,
    resetImportState,
  };
};

export default useCatalogImport;

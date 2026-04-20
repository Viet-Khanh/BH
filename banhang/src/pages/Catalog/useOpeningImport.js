import { useRef, useState } from 'react';
import { message } from 'antd';
import * as XLSX from 'xlsx';
import { saveWorkbook } from '../../utils/excelExport.js';
import { commitOpeningImport, previewOpeningImport } from './openingImportApi.js';
import {
  buildOpeningImportTemplateWorkbook,
  canCommitOpeningImport,
  getOpeningImportTargetLabel,
  parseOpeningImportWorkbook,
} from './openingImportUtils.js';

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

const useOpeningImport = ({ loadCustomers, loadSuppliers }) => {
  const fileInputRef = useRef(null);
  const targetRef = useRef(null);
  const [previewing, setPreviewing] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [previewTarget, setPreviewTarget] = useState(null);
  const [previewResult, setPreviewResult] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const resetOpeningImportState = () => {
    setPreviewTarget(null);
    setPreviewResult(null);
    setPreviewOpen(false);
    targetRef.current = null;
  };

  const handleDownloadOpeningTemplate = async (target) => {
    try {
      const { workbook, fileName } = buildOpeningImportTemplateWorkbook(target);
      await saveWorkbook(workbook, fileName);
    } catch (error) {
      message.error(error.message || 'Không thể tải mẫu đầu kỳ.');
    }
  };

  const triggerOpeningImport = (target) => {
    targetRef.current = target;
    setPreviewTarget(target);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleOpeningFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const target = targetRef.current;
    if (!target) {
      message.error('Không xác định được loại import đầu kỳ.');
      event.target.value = '';
      return;
    }

    setPreviewing(true);
    try {
      const workbook = await readWorkbook(file);
      const rows = parseOpeningImportWorkbook(workbook, target);
      const preview = await previewOpeningImport({ target, rows });
      setPreviewTarget(target);
      setPreviewResult(preview);
      setPreviewOpen(true);
    } catch (error) {
      message.error(error.message || 'Không thể đọc file đầu kỳ.');
    } finally {
      setPreviewing(false);
      event.target.value = '';
    }
  };

  const handleConfirmOpeningImport = async () => {
    if (!canCommitOpeningImport(previewResult)) return;

    setCommitting(true);
    try {
      const result = await commitOpeningImport({
        target: previewResult.target,
        rows: previewResult.normalizedRows,
      });

      try {
        if (result.target === 'customers') await loadCustomers();
        if (result.target === 'suppliers') await loadSuppliers();
      } catch {
        message.warning('Đã nhập dữ liệu nhưng không thể tải lại danh sách.');
      }

      message.success(
        `Đã nhập ${result.created.masters} ${getOpeningImportTargetLabel(
          result.target
        )} và ${result.created.debtDocs} chứng từ công nợ đầu kỳ.`
      );
      resetOpeningImportState();
    } catch (error) {
      const details = error.details;
      if (details?.target && Array.isArray(details?.errors)) {
        setPreviewTarget(details.target);
        setPreviewResult(details);
        setPreviewOpen(true);
      }
      message.error(error.message || 'Không thể nhập dữ liệu đầu kỳ.');
    } finally {
      setCommitting(false);
    }
  };

  return {
    previewing,
    previewTarget,
    previewResult,
    previewOpen,
    committing,
    fileInputRef,
    handleDownloadOpeningTemplate,
    triggerOpeningImport,
    handleOpeningFileChange,
    handleConfirmOpeningImport,
    closePreview: resetOpeningImportState,
    resetOpeningImportState,
  };
};

export default useOpeningImport;

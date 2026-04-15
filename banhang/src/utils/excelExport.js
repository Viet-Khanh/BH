import { message } from 'antd';
import * as XLSX from 'xlsx';

export const saveWorkbook = async (workbook, fileName) => {
  const baseName = String(fileName || 'du-lieu').trim() || 'du-lieu';
  const targetName = baseName.toLowerCase().endsWith('.xlsx')
    ? baseName
    : `${baseName}.xlsx`;

  const hasElectronSave =
    typeof window !== 'undefined' &&
    typeof window.electronAPI?.saveFile === 'function';

  if (hasElectronSave) {
    try {
      const data = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const result = await window.electronAPI.saveFile(data, {
        defaultPath: targetName,
        filters: [{ name: 'Excel', extensions: ['xlsx'] }],
      });
      return !result?.canceled;
    } catch (error) {
      message.error(
        `Khong the luu file: ${error.message || 'Loi khong xac dinh'}`
      );
      return false;
    }
  }

  XLSX.writeFile(workbook, targetName);
  return true;
};

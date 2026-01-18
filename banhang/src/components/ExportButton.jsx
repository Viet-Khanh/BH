import { Button, message } from 'antd';
import * as XLSX from 'xlsx';
import { saveWorkbook } from '../utils/excelExport.js';

const ExportButton = ({ rows = [], fileName, sheetName = 'Data' }) => {
  const handleExport = async () => {
    if (!rows.length) {
      message.warning('Không có dữ liệu để xuất.');
      return;
    }
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    await saveWorkbook(workbook, fileName);
  };

  return (
    <Button size="large" onClick={handleExport}>
      Xuất Excel
    </Button>
  );
};

export default ExportButton;

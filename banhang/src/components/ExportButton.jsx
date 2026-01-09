import { Button, message } from 'antd';
import * as XLSX from 'xlsx';

const ExportButton = ({ rows = [], fileName, sheetName = 'Data' }) => {
  const handleExport = () => {
    if (!rows.length) {
      message.warning('Không có dữ liệu để xuất.');
      return;
    }
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  };

  return (
    <Button size="large" onClick={handleExport}>
      Xuất Excel
    </Button>
  );
};

export default ExportButton;

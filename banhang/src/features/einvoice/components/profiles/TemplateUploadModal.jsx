import {
  Button,
  Checkbox,
  InputNumber,
  message,
  Modal,
  Select,
  Space,
  Typography,
  Upload,
} from 'antd';
import { useMemo, useState } from 'react';
import {
  buildProfileFromTemplate,
  detectHeaderRow,
  looksLikeKeyRow,
} from '../../domain/templateReader.js';
import { pickMainSheet, readWorkbookRows } from '../../domain/workbookRows.js';

const readFile = (file) =>
  file.arrayBuffer().then((buffer) => readWorkbookRows(buffer));

// Provider template file → draft profile (sheet, header row, key row).
const TemplateUploadModal = ({ open, onCancel, onCreate }) => {
  const [sheets, setSheets] = useState([]);
  const [sheetName, setSheetName] = useState('');
  const [headerRow, setHeaderRow] = useState(1);
  const [keyRow, setKeyRow] = useState(false);
  const sheet = sheets.find((item) => item.name === sheetName);
  const header = useMemo(
    () =>
      (sheet?.rows[headerRow - 1] || []).filter((cell) => String(cell).trim()),
    [sheet, headerRow]
  );

  const selectSheet = (target) => {
    const index = detectHeaderRow(target.rows);
    setSheetName(target.name);
    setHeaderRow(index + 1);
    setKeyRow(looksLikeKeyRow(target.rows[index + 1]));
  };

  const load = async (file) => {
    try {
      const loaded = await readFile(file);
      setSheets(loaded);
      selectSheet(pickMainSheet(loaded));
    } catch (error) {
      message.error(`Không đọc được file: ${error.message}`);
    }
    return false;
  };

  const create = () =>
    onCreate(
      buildProfileFromTemplate({
        rows: sheet.rows,
        sheetName,
        headerRowIndex: headerRow - 1,
        keyRow,
        name: `Mẫu ${sheetName}`,
      })
    );

  return (
    <Modal
      open={open}
      title="Tạo mẫu từ file mẫu của nhà cung cấp"
      okText="Tạo mẫu"
      cancelText="Huỷ"
      okButtonProps={{ disabled: !header.length }}
      onOk={create}
      onCancel={onCancel}
      destroyOnClose
    >
      <Typography.Paragraph type="secondary">
        Tải file Excel mẫu "nhập hoá đơn từ Excel" trên trang nhà cung cấp, rồi
        chọn file đó. App tự nhận dòng tiêu đề và đoán dữ liệu cho từng cột.
      </Typography.Paragraph>
      <Upload
        accept=".xlsx,.xls"
        maxCount={1}
        beforeUpload={load}
        showUploadList={false}
      >
        <Button>Chọn file mẫu…</Button>
      </Upload>
      {sheet && (
        <Space direction="vertical" style={{ marginTop: 16, width: '100%' }}>
          <Space wrap>
            <span>Sheet:</span>
            <Select
              style={{ width: 220 }}
              value={sheetName}
              options={sheets.map((item) => ({
                value: item.name,
                label: item.name,
              }))}
              onChange={(name) =>
                selectSheet(sheets.find((item) => item.name === name))
              }
            />
            <span>Dòng tiêu đề:</span>
            <InputNumber
              min={1}
              max={sheet.rows.length}
              value={headerRow}
              onChange={setHeaderRow}
            />
          </Space>
          <Checkbox
            checked={keyRow}
            onChange={(event) => setKeyRow(event.target.checked)}
          >
            Dòng ngay dưới tiêu đề là mã trường (giữ lại khi xuất)
          </Checkbox>
          <Typography.Text>
            {header.length} cột: {header.slice(0, 8).join(' · ')}
            {header.length > 8 ? ' …' : ''}
          </Typography.Text>
        </Space>
      )}
    </Modal>
  );
};

export default TemplateUploadModal;

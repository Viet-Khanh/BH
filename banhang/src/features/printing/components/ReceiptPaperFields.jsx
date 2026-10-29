import { Form, InputNumber, Radio, Space } from 'antd';
import { RECEIPT_PAPER_OPTIONS } from '../domain/printSettingsForm.js';
import { getReceiptPaper } from '../receipt/receiptPaper.js';

const formatMm = (value) => String(Math.round(value * 10) / 10);

// Paper radio; "Tùy chỉnh" adds width + side margin; roll papers show the printable width.
// `paperSettings` = paper fields on screen.
const ReceiptPaperFields = ({ paperSettings }) => {
  const paper = getReceiptPaper(paperSettings);
  const hint = paper.roll
    ? `Vùng in ≈ ${formatMm(paper.printableMm)} mm`
    : undefined;

  return (
    <>
      <Form.Item label="Khổ giấy hoá đơn" name="receiptPaper" extra={hint}>
        <Radio.Group options={RECEIPT_PAPER_OPTIONS} />
      </Form.Item>
      {paperSettings.receiptPaper === 'custom' && (
        <Space wrap align="start" size="large">
          <Form.Item label="Chiều rộng giấy (mm)" name="receiptWidthMm">
            <InputNumber min={40} max={112} step={1} style={{ width: 140 }} />
          </Form.Item>
          <Form.Item label="Lề trái/phải (mm)" name="receiptMarginMm">
            <InputNumber min={0} max={10} step={0.5} style={{ width: 140 }} />
          </Form.Item>
        </Space>
      )}
    </>
  );
};

export default ReceiptPaperFields;

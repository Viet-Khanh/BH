import { useMemo } from 'react';
import { Button, message, Space, Typography } from 'antd';
import { printSampleReceipt } from '../../samplePrints.js';
import { getReceiptPaper } from '../../receipt/receiptPaper.js';
import { hasBankInfo, toDesignerPatch } from './designerState.js';
import DesignerBlockList from './DesignerBlockList.jsx';
import ReceiptPreview from './ReceiptPreview.jsx';
import { useReceiptDesigner } from './useReceiptDesigner.js';
import { useReceiptPreviewHtml } from './useReceiptPreviewHtml.js';
import './receiptDesigner.css';

// Roll receipt designer (System → In ấn → Hoá đơn, roll paper only).
// `paperSettings` = paper fields on screen; `readPreviewSettings()` = printer form
// values on screen (saved or not). Has its own "Lưu" (receiptLayout + receiptLogo).
const ReceiptDesigner = ({ paperSettings, readPreviewSettings }) => {
  const { settings, state, dispatch, pickLogo, save } = useReceiptDesigner();
  const { layout, logo, dirty } = state;
  const patch = useMemo(
    () => toDesignerPatch({ layout, logo }),
    [layout, logo]
  );
  const previewSettings = useMemo(
    () => ({ ...settings, ...paperSettings, ...patch }),
    [settings, paperSettings, patch]
  );
  const paper = getReceiptPaper(previewSettings);
  const html = useReceiptPreviewHtml(previewSettings);

  const extra = {
    logo,
    onPickLogo: (file) => pickLogo(file, paper.printableMm),
    bankMissing: !hasBankInfo(settings),
  };

  const printTest = () =>
    printSampleReceipt({ ...readPreviewSettings(), ...patch }).catch((error) =>
      message.error(error?.message || 'Không in thử được.')
    );

  return (
    <div className="receipt-designer">
      <Typography.Title level={5}>Thiết kế hoá đơn cuộn</Typography.Title>
      <div className="receipt-designer-body">
        <DesignerBlockList layout={layout} dispatch={dispatch} extra={extra} />
        <div className="receipt-designer-preview">
          <Typography.Text type="secondary">
            Xem trước (khổ {paper.widthMm} mm, dữ liệu mẫu)
          </Typography.Text>
          <ReceiptPreview html={html} widthMm={paper.widthMm} />
        </div>
      </div>
      <Space wrap>
        <Button onClick={printTest}>In thử</Button>
        <Button onClick={() => dispatch({ type: 'reset' })}>
          Khôi phục mặc định
        </Button>
        <Button type="primary" onClick={save} disabled={!dirty}>
          Lưu thiết kế
        </Button>
        {dirty && (
          <Typography.Text type="secondary">
            Có thay đổi chưa lưu
          </Typography.Text>
        )}
      </Space>
    </div>
  );
};

export default ReceiptDesigner;

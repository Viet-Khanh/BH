import { Button, Modal, Space, Typography, Upload } from 'antd';
import { useResultImport } from '../../hooks/useResultImport.js';
import ResultMapping from './ResultMapping.jsx';
import ResultPreview from './ResultPreview.jsx';

const HELP =
  'Trên trang nhà cung cấp, xuất danh sách hoá đơn đã phát hành ra Excel rồi chọn file đó. App ghép theo mã hoá đơn trong app (nếu file có), nếu không thì theo ngày + tổng tiền, rồi ghi số hoá đơn, ký hiệu, mã tra cứu.';

// Fills e-invoice numbers from the provider's issued-invoice list.
const ResultImportModal = ({ open, onClose, onApplied }) => {
  const state = useResultImport({ onApplied });
  const close = () => {
    state.reset();
    onClose();
  };
  const canCheck =
    state.sheet && state.mapping.number !== undefined && state.rows.length;

  return (
    <Modal
      open={open}
      width={640}
      title="Nhập kết quả từ nhà cung cấp"
      onCancel={close}
      footer={
        <Space>
          <Button onClick={close}>Đóng</Button>
          <Button
            disabled={!canCheck}
            loading={state.busy}
            onClick={state.check}
          >
            Kiểm tra ({state.rows.length} dòng)
          </Button>
          <Button
            type="primary"
            disabled={!state.preview?.matched.length || state.preview.applied}
            loading={state.busy}
            onClick={state.apply}
          >
            Ghi số hoá đơn
          </Button>
        </Space>
      }
    >
      <Typography.Paragraph type="secondary">{HELP}</Typography.Paragraph>
      <Upload
        accept=".xlsx,.xls,.csv"
        maxCount={1}
        showUploadList={false}
        beforeUpload={state.load}
      >
        <Button>Chọn file danh sách hoá đơn…</Button>
      </Upload>
      {state.sheet && (
        <div style={{ marginTop: 16 }}>
          <ResultMapping state={state} />
        </div>
      )}
      {state.preview && <ResultPreview preview={state.preview} />}
    </Modal>
  );
};

export default ResultImportModal;

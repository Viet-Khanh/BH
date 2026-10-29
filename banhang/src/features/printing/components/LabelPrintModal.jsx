import { useMemo } from 'react';
import { Button, Modal, Space, Switch, Table } from 'antd';
import { getLabelPrintColumns } from './labelPrintColumns.jsx';
import { useEnterToPrint } from './useEnterToPrint.js';
import { LABEL_PRINT_MODAL_CLASS } from '../labels/labelPrintKeys.js';

// Above other modals (it can open from the purchase detail modal).
const Z_INDEX = 1100;

// Confirm list before printing labels; takes the object returned by useLabelPrint.
const LabelPrintModal = ({
  open,
  rows,
  total,
  forPurchase,
  printerName,
  printing,
  setRowUnit,
  setRowCount,
  skipWithBarcode,
  setSkipWithBarcode,
  print,
  close,
}) => {
  useEnterToPrint({ open, onPrint: print });
  const columns = useMemo(
    () =>
      getLabelPrintColumns({
        onUnitChange: setRowUnit,
        onCountChange: setRowCount,
      }),
    [setRowCount, setRowUnit]
  );

  const footer = (
    <Space style={{ width: '100%', justifyContent: 'space-between' }}>
      <span>
        Tổng: <b>{total}</b> tem
      </span>
      <Space>
        <Button onClick={close}>Bỏ qua</Button>
        <Button type="primary" loading={printing} onClick={print}>
          In (Enter)
        </Button>
      </Space>
    </Space>
  );

  return (
    <Modal
      title={`In tem → ${printerName || 'máy in mặc định'}`}
      open={open}
      onCancel={close}
      footer={footer}
      width={860}
      zIndex={Z_INDEX}
      wrapClassName={LABEL_PRINT_MODAL_CLASS}
      destroyOnHidden
    >
      {forPurchase && (
        <Space style={{ marginBottom: 12 }}>
          <Switch checked={skipWithBarcode} onChange={setSkipWithBarcode} />
          <span>Bỏ qua hàng đã có mã vạch</span>
        </Space>
      )}
      <Table
        size="small"
        rowKey="key"
        columns={columns}
        dataSource={rows}
        pagination={false}
        scroll={{ y: 420 }}
        locale={{ emptyText: 'Không có hàng cần in tem.' }}
      />
    </Modal>
  );
};

export default LabelPrintModal;

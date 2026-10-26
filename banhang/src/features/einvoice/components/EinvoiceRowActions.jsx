import { Button, Input, message, Modal, Space } from 'antd';
import { useState } from 'react';
import { setEinvoiceNumber, unmarkEinvoices } from '../api/einvoiceApi.js';

// Actions for an exported invoice: record the provider's number, or unmark it
// (e.g. the upload failed) so it can be exported again.
const EinvoiceRowActions = ({ item, onChanged }) => {
  const [numberOpen, setNumberOpen] = useState(false);
  const [number, setNumber] = useState(item.einvoice?.number || '');

  if (item.status === 'pending') return null;

  const saveNumber = async () => {
    try {
      await setEinvoiceNumber(item.invoiceId, number);
      setNumberOpen(false);
      onChanged();
    } catch (error) {
      message.error(error.message);
    }
  };

  const unmark = () =>
    Modal.confirm({
      title: 'Bỏ đánh dấu đã xuất?',
      content:
        'Chỉ dùng khi file chưa được nhập thành công lên trang nhà cung cấp. Hoá đơn sẽ trở về "Chưa xuất".',
      okText: 'Bỏ đánh dấu',
      cancelText: 'Huỷ',
      onOk: async () => {
        await unmarkEinvoices([item.invoiceId]);
        onChanged();
      },
    });

  return (
    <Space size="small">
      <Button size="small" onClick={() => setNumberOpen(true)}>
        Số HĐĐT
      </Button>
      <Button size="small" onClick={unmark}>
        Bỏ đánh dấu
      </Button>
      <Modal
        open={numberOpen}
        title={`Số hoá đơn điện tử của ${item.code}`}
        okText="Lưu"
        cancelText="Huỷ"
        onOk={saveNumber}
        onCancel={() => setNumberOpen(false)}
      >
        <Input
          value={number}
          placeholder="Số hoá đơn trên trang nhà cung cấp"
          onChange={(event) => setNumber(event.target.value)}
        />
      </Modal>
    </Space>
  );
};

export default EinvoiceRowActions;

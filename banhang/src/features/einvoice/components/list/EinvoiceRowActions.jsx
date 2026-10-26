import { Button, Modal, Space } from 'antd';
import { useState } from 'react';
import { unmarkEinvoices } from '../../api/einvoiceApi.js';
import IssuedNumberModal from './IssuedNumberModal.jsx';

// Actions for an exported invoice: record the provider's number, or unmark it
// (e.g. the upload failed) so it can be exported again.
const EinvoiceRowActions = ({ item, onChanged }) => {
  const [numberOpen, setNumberOpen] = useState(false);

  if (item.status === 'pending') return null;

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
      <IssuedNumberModal
        item={item}
        open={numberOpen}
        onClose={() => setNumberOpen(false)}
        onSaved={onChanged}
      />
    </Space>
  );
};

export default EinvoiceRowActions;

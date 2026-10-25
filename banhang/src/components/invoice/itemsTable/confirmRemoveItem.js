import { Modal } from 'antd';

export const confirmRemoveItem = ({ productName, onConfirm }) => {
  Modal.confirm({
    title: 'Xóa sản phẩm khỏi hóa đơn?',
    content: productName ? `Sản phẩm: ${productName}` : undefined,
    okText: 'Xóa',
    cancelText: 'Hủy',
    okButtonProps: { danger: true },
    onOk: onConfirm,
  });
};

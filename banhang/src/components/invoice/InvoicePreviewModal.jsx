import { Modal } from 'antd';
import InvoicePreview from '../InvoicePreview.jsx';

const InvoicePreviewModal = ({ open, onClose, html }) => (
  <Modal
    title="Xem trước hóa đơn"
    open={open}
    onCancel={onClose}
    footer={null}
    width={900}
  >
    <InvoicePreview html={html} />
  </Modal>
);

export default InvoicePreviewModal;

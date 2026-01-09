import { Button, Modal } from 'antd';
import ProductPicker from '../../components/ProductPicker.jsx';

const PurchaseSearchModal = ({ open, onClose, products, onAddProduct }) => (
  <Modal
    title="Nhập hàng hóa"
    open={open}
    onCancel={onClose}
    footer={null}
    width={900}
  >
    <div className="pos-add-grid">
      <div>
        <ProductPicker
          products={products}
          value={null}
          onChange={onAddProduct}
        />
      </div>
      <div>
        <div className="section-title">Thêm nhanh</div>
        <Button type="primary" className="btn-primary" onClick={onClose}>
          Đóng
        </Button>
      </div>
    </div>
  </Modal>
);

export default PurchaseSearchModal;

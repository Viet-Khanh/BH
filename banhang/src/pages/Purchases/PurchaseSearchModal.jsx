import { useEffect, useState } from 'react';
import { Button, InputNumber, Modal, Space, message } from 'antd';
import ProductPicker from '../../components/ProductPicker.jsx';

const getValidDimension = (value) => {
  const numeric = Number(value || 0);
  return numeric > 0 ? numeric : null;
};

const PurchaseSearchModal = ({ open, onClose, products, onAddProduct }) => {
  const [pendingLength, setPendingLength] = useState(null);
  const [pendingWidth, setPendingWidth] = useState(null);

  useEffect(() => {
    if (open) return;
    setPendingLength(null);
    setPendingWidth(null);
  }, [open]);

  const handleAddProduct = (productId) => {
    const lengthValue = getValidDimension(pendingLength);
    const widthValue = getValidDimension(pendingWidth);
    if ((lengthValue && !widthValue) || (!lengthValue && widthValue)) {
      message.error('Vui lòng nhập đủ chiều dài và chiều rộng.');
      return;
    }
    onAddProduct(productId, { length: lengthValue, width: widthValue });
    setPendingLength(null);
    setPendingWidth(null);
  };

  return (
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
            onChange={handleAddProduct}
          />
        </div>
        <div>
          <div className="section-title">Thêm nhanh</div>
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <div>Chiều dài</div>
              <InputNumber
                min={0}
                style={{ width: '100%' }}
                value={pendingLength ?? undefined}
                onChange={setPendingLength}
              />
            </div>
            <div>
              <div>Chiều rộng</div>
              <InputNumber
                min={0}
                style={{ width: '100%' }}
                value={pendingWidth ?? undefined}
                onChange={setPendingWidth}
              />
            </div>
            <Button type="primary" className="btn-primary" onClick={onClose}>
              Đóng
            </Button>
          </Space>
        </div>
      </div>
    </Modal>
  );
};

export default PurchaseSearchModal;

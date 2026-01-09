import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, InputNumber, Modal, Space } from 'antd';
import ProductPicker from '../ProductPicker.jsx';
import { formatNumberInput, parseNumberInput } from '../../utils/numberInput.js';
import { isGlassProduct } from './invoiceUtils.js';

const InvoiceProductModal = ({
  open,
  onClose,
  products,
  pendingProduct,
  pendingQty,
  pendingPrice,
  pendingLength,
  pendingWidth,
  onChangeProduct,
  onChangeQty,
  onChangePrice,
  onChangeLength,
  onChangeWidth,
  onConfirmAdd,
}) => {
  const [searchKeyword, setSearchKeyword] = useState('');
  const searchInputRef = useRef(null);
  const qtyInputRef = useRef(null);
  const lastProductIdRef = useRef(null);

  const focusSearchInput = useCallback(() => {
    requestAnimationFrame(() => {
      searchInputRef.current?.focus();
    });
  }, []);

  const handleAdd = useCallback(() => {
    const added = onConfirmAdd({ closeAfter: false });
    if (!added) return;
    setSearchKeyword('');
    focusSearchInput();
  }, [onConfirmAdd, focusSearchInput]);

  useEffect(() => {
    if (!open) return;
    focusSearchInput();
  }, [open, focusSearchInput]);

  useEffect(() => {
    if (!open) return;
    const nextId = pendingProduct?.id || null;
    if (nextId && nextId !== lastProductIdRef.current) {
      requestAnimationFrame(() => {
        qtyInputRef.current?.focus();
      });
    }
    lastProductIdRef.current = nextId;
  }, [open, pendingProduct]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event) => {
      if (event.key !== 'F1') return;
      event.preventDefault();
      handleAdd();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, handleAdd]);

  return (
  <Modal
    title="Nhập hàng hóa"
    open={open}
    onCancel={onClose}
    footer={null}
    width={1100}
  >
      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{flex: 3}}>
          <ProductPicker
            products={products}
            value={pendingProduct?.id || null}
            onChange={onChangeProduct}
            keyword={searchKeyword}
            onKeywordChange={setSearchKeyword}
            inputRef={searchInputRef}
          />
        </div>
        <div style={{flex: 2}}>
          <div className="section-title">Thông tin hàng</div>
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <strong>{pendingProduct?.name || 'Chưa chọn sản phẩm'}</strong>
              <div>{pendingProduct?.code || ''}</div>
            </div>
            <div>
              <div>Số lượng</div>
              <InputNumber
                style={{ width: '100%' }}
                value={pendingQty}
                onChange={onChangeQty}
                ref={qtyInputRef}
              />
            </div>
            <div>
              <div>Đơn giá</div>
              <InputNumber
                min={0}
                style={{ width: '100%' }}
                value={pendingPrice}
                formatter={formatNumberInput}
                parser={parseNumberInput}
                onChange={onChangePrice}
              />
            </div>
            {isGlassProduct(pendingProduct) && (
              <>
                <div>
                  <div>Chiều dài</div>
                  <InputNumber
                    min={0}
                    style={{ width: '100%' }}
                    value={pendingLength ?? undefined}
                    onChange={onChangeLength}
                  />
                </div>
                <div>
                  <div>Chiều rộng</div>
                  <InputNumber
                    min={0}
                    style={{ width: '100%' }}
                    value={pendingWidth ?? undefined}
                    onChange={onChangeWidth}
                  />
                </div>
              </>
            )}
            <div className="pos-payment-actions">
              <Button
                type="primary"
                className="btn-success"
                disabled={!pendingProduct}
                onClick={handleAdd}
              >
                Thêm vào hóa đơn
              </Button>
              <Button onClick={onClose}>Xong</Button>
            </div>
          </Space>
        </div>
      </div>
    </Modal>
  );
};

export default InvoiceProductModal;

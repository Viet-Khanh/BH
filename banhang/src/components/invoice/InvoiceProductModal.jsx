import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, InputNumber, Modal, Space } from 'antd';
import ProductPicker from '../ProductPicker.jsx';
import { formatNumberInput, parseNumberInput } from '../../utils/numberInput.js';
import { formatMoney } from '../../utils/moneyFormat.js';

const InvoiceProductModal = ({
  open,
  onClose,
  products,
  pendingProduct,
  pendingQty,
  pendingPrice,
  pendingLength,
  pendingWidth,
  previousPrice,
  onSearchProducts,
  onChangeProduct,
  onChangeQty,
  onChangePrice,
  onChangeLength,
  onChangeWidth,
  onApplyPreviousPrice,
  onConfirmAdd,
  autoFocusSearchOnOpen = true,
  showDimensions = true,
}) => {
  const [searchKeyword, setSearchKeyword] = useState('');
  const searchInputRef = useRef(null);
  const qtyInputRef = useRef(null);
  const lastProductIdRef = useRef(null);
  const isFirstOpenCycleRef = useRef(true);

  const focusSearchInput = useCallback(({ selectAll = false } = {}) => {
    requestAnimationFrame(() => {
      if (!searchInputRef.current) return;
      if (selectAll) {
        searchInputRef.current.focus({ cursor: 'all' });
        searchInputRef.current.select?.();
        return;
      }
      searchInputRef.current.focus();
    });
  }, []);

  const handleAdd = useCallback(() => {
    const added = onConfirmAdd({ closeAfter: false });
    if (!added) return;
    focusSearchInput({ selectAll: true });
  }, [onConfirmAdd, focusSearchInput]);

  useEffect(() => {
    if (!open || !autoFocusSearchOnOpen) return;
    focusSearchInput();
  }, [open, focusSearchInput, autoFocusSearchOnOpen]);

  useEffect(() => {
    if (!open) {
      isFirstOpenCycleRef.current = true;
      return;
    }
    const nextId = pendingProduct?.id || null;
    if (nextId && nextId !== lastProductIdRef.current && !isFirstOpenCycleRef.current) {
      requestAnimationFrame(() => {
        qtyInputRef.current?.focus();
      });
    }
    isFirstOpenCycleRef.current = false;
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

  useEffect(() => {
    if (!open || !onSearchProducts) return;
    const keyword = searchKeyword.trim();
    const timer = setTimeout(() => {
      onSearchProducts(keyword);
    }, 250);
    return () => clearTimeout(timer);
  }, [open, searchKeyword, onSearchProducts]);

  const hasPreviousPrice = Number.isFinite(previousPrice);
  const isSamePrice =
    hasPreviousPrice && Number(pendingPrice || 0) === Number(previousPrice || 0);

  return (
    <Modal
      title="Nhập hàng hóa"
      open={open}
      onCancel={onClose}
      afterOpenChange={(nextOpen) => {
        if (nextOpen && autoFocusSearchOnOpen) {
          focusSearchInput();
        }
      }}
      footer={null}
      width={1100}
    >
      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ flex: 3 }}>
          <ProductPicker
            products={products}
            value={pendingProduct?.id || null}
            onChange={onChangeProduct}
            keyword={searchKeyword}
            onKeywordChange={setSearchKeyword}
            inputRef={searchInputRef}
            showStock
          />
        </div>
        <div style={{ flex: 2 }}>
          <div className="section-title">Thông tin hàng</div>
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <strong>{pendingProduct?.name || 'Chưa chọn sản phẩm'}</strong>
              <div>{pendingProduct?.code || ''}</div>
              <div>Tồn kho: {Number(pendingProduct?.stock ?? pendingProduct?.openingStock ?? 0)}</div>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <InputNumber
                  min={0}
                  style={{ width: '100%' }}
                  value={pendingPrice}
                  formatter={formatNumberInput}
                  parser={parseNumberInput}
                  onChange={onChangePrice}
                />
                {hasPreviousPrice && (
                  <Button
                    type="link"
                    size="small"
                    style={{ padding: 0, height: 'auto' }}
                    disabled={isSamePrice}
                    onClick={() => onApplyPreviousPrice?.()}
                  >
                    Giá trước: {formatMoney(previousPrice)}
                  </Button>
                )}
              </div>
            </div>
            {showDimensions && (
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

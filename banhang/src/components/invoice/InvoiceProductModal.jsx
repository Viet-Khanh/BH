import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, Form, InputNumber, Modal, Space, message } from 'antd';
import ProductPicker from '../ProductPicker.jsx';
import {
  formatNumberInput,
  parseNumberInput,
} from '../../utils/numberInput.js';
import { formatMoney } from '../../utils/moneyFormat.js';
import CatalogFormModal from '../../pages/Catalog/CatalogFormModal.jsx';
import { buildCodeFromName } from '../../pages/Catalog/catalogUtils.js';

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
  onCreateProduct,
  onProductCreated,
  autoFocusSearchOnOpen = true,
  showDimensions = true,
  priceMin = 0,
}) => {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [createProductOpen, setCreateProductOpen] = useState(false);
  const [createProductLoading, setCreateProductLoading] = useState(false);
  const [codeEdited, setCodeEdited] = useState(false);
  const searchInputRef = useRef(null);
  const qtyInputRef = useRef(null);
  const lastProductIdRef = useRef(null);
  const isFirstOpenCycleRef = useRef(true);
  const [createProductForm] = Form.useForm();

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
    if (
      nextId &&
      nextId !== lastProductIdRef.current &&
      !isFirstOpenCycleRef.current
    ) {
      requestAnimationFrame(() => {
        qtyInputRef.current?.focus();
      });
    }
    isFirstOpenCycleRef.current = false;
    lastProductIdRef.current = nextId;
  }, [open, pendingProduct]);

  useEffect(() => {
    if (!open || createProductOpen) return;
    const handleKeyDown = (event) => {
      if (event.key !== 'F1') return;
      event.preventDefault();
      handleAdd();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, createProductOpen, handleAdd]);

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
    hasPreviousPrice &&
    Number(pendingPrice || 0) === Number(previousPrice || 0);
  const canCreateProduct = typeof onCreateProduct === 'function';

  const handleOpenCreateProduct = () => {
    if (!canCreateProduct) return;
    createProductForm.resetFields();
    setCodeEdited(false);
    setCreateProductOpen(true);
  };

  const handleCloseCreateProduct = () => {
    if (createProductLoading) return;
    setCreateProductOpen(false);
  };

  const handleCreateProductNameChange = (event) => {
    const name = event.target.value || '';
    if (!codeEdited) {
      createProductForm.setFieldsValue({ code: buildCodeFromName(name) });
    }
  };

  const handleCreateProductCodeChange = (event) => {
    const value = event.target.value || '';
    setCodeEdited(value.trim().length > 0);
  };

  const handleSaveCreateProduct = async () => {
    if (!canCreateProduct) return;
    let values;
    try {
      values = await createProductForm.validateFields();
    } catch {
      return;
    }
    setCreateProductLoading(true);
    try {
      const createdProduct = await onCreateProduct(values);
      if (!createdProduct?.id) {
        throw new Error('Không thể tạo sản phẩm.');
      }
      setCreateProductOpen(false);
      createProductForm.resetFields();
      setCodeEdited(false);
      setSearchKeyword('');
      onSearchProducts?.('');
      if (onProductCreated) onProductCreated(createdProduct);
      else onChangeProduct?.(createdProduct.id);
      message.success('Đã tạo sản phẩm.');
      focusSearchInput({ selectAll: true });
    } catch (error) {
      message.error(
        `Không thể tạo sản phẩm: ${error.message || 'Lỗi không xác định'}`
      );
    } finally {
      setCreateProductLoading(false);
    }
  };

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
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 8,
            }}
          >
            <div className="section-title" style={{ margin: 0 }}>
              Danh sách hàng hóa
            </div>
            <Button
              onClick={handleOpenCreateProduct}
              disabled={!canCreateProduct}
            >
              Thêm mặt hàng
            </Button>
          </div>
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
              <div>
                Tồn kho:{' '}
                {Number(
                  pendingProduct?.stock ?? pendingProduct?.openingStock ?? 0
                )}
              </div>
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
                  min={priceMin}
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
      <CatalogFormModal
        open={createProductOpen}
        editing={null}
        activeKey="products"
        form={createProductForm}
        onCancel={handleCloseCreateProduct}
        onSave={handleSaveCreateProduct}
        onNameChange={handleCreateProductNameChange}
        onCodeChange={handleCreateProductCodeChange}
        confirmLoading={createProductLoading}
      />
    </Modal>
  );
};

export default InvoiceProductModal;

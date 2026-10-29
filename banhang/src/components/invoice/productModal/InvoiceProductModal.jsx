import { Button, Modal } from 'antd';
import { useCallback } from 'react';
import { useEditionFeature } from '../../../platform/useActiveModule.js';
import CatalogFormModal from '../../../pages/Catalog/CatalogFormModal.jsx';
import ProductPicker from '../../ProductPicker.jsx';
import ProductInfoPanel from './ProductInfoPanel.jsx';
import { useAddShortcut } from './useAddShortcut.js';
import { useDebouncedProductSearch } from './useDebouncedProductSearch.js';
import { useProductModalFocus } from './useProductModalFocus.js';
import { useQuickCreateProduct } from './useQuickCreateProduct.js';

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 8,
};

// Product picker modal shared by sales and purchases. showDimensions defaults to the edition flag.
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
  unitSelection,
  onConfirmAdd,
  onCreateProduct,
  onProductCreated,
  autoFocusSearchOnOpen = true,
  showDimensions,
  priceMin = 0,
}) => {
  const editionDimensions = useEditionFeature('dimensions');
  const unitsEnabled = useEditionFeature('units');
  const dimensions = showDimensions ?? editionDimensions;
  const { searchKeyword, setSearchKeyword } = useDebouncedProductSearch({
    open,
    onSearchProducts,
  });
  const { searchInputRef, qtyInputRef, focusSearchInput } =
    useProductModalFocus({
      open,
      autoFocusSearchOnOpen,
      pendingProductId: pendingProduct?.id,
    });
  const quickCreate = useQuickCreateProduct({
    onCreateProduct,
    products,
    onCreated: (created) => {
      setSearchKeyword('');
      onSearchProducts?.('');
      if (onProductCreated) onProductCreated(created);
      else onChangeProduct?.(created.id);
      focusSearchInput({ selectAll: true });
    },
  });

  const handleAdd = useCallback(() => {
    if (onConfirmAdd({ closeAfter: false })) {
      focusSearchInput({ selectAll: true });
    }
  }, [onConfirmAdd, focusSearchInput]);
  useAddShortcut({ enabled: open && !quickCreate.open, onAdd: handleAdd });

  return (
    <Modal
      title="Nhập hàng hóa"
      open={open}
      onCancel={onClose}
      afterOpenChange={(nextOpen) => {
        if (nextOpen && autoFocusSearchOnOpen) focusSearchInput();
      }}
      footer={null}
      width={1100}
    >
      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ flex: 3 }}>
          <div style={headerStyle}>
            <div className="section-title" style={{ margin: 0 }}>
              Danh sách hàng hóa
            </div>
            <Button
              onClick={quickCreate.openForm}
              disabled={!quickCreate.canCreate}
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
            showDetails={false}
          />
        </div>
        <ProductInfoPanel
          pendingProduct={pendingProduct}
          pendingQty={pendingQty}
          pendingPrice={pendingPrice}
          pendingLength={pendingLength}
          pendingWidth={pendingWidth}
          previousPrice={previousPrice}
          priceMin={priceMin}
          showDimensions={dimensions}
          unitSelection={
            unitsEnabled && !dimensions ? unitSelection : undefined
          }
          qtyInputRef={qtyInputRef}
          onChangeQty={onChangeQty}
          onChangePrice={onChangePrice}
          onChangeLength={onChangeLength}
          onChangeWidth={onChangeWidth}
          onApplyPreviousPrice={onApplyPreviousPrice}
          onAdd={handleAdd}
          onClose={onClose}
        />
      </div>
      <CatalogFormModal
        open={quickCreate.open}
        editing={null}
        activeKey="products"
        form={quickCreate.form}
        onCancel={quickCreate.closeForm}
        onSave={quickCreate.save}
        onNameChange={quickCreate.handleNameChange}
        onCodeChange={quickCreate.handleCodeChange}
        confirmLoading={quickCreate.loading}
      />
    </Modal>
  );
};

export default InvoiceProductModal;

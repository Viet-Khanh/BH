import { Button, InputNumber, Space } from 'antd';
import { forwardRef } from 'react';
import { formatMoney } from '../../../utils/moneyFormat.js';
import {
  formatNumberInput,
  parseNumberInput,
} from '../../../utils/numberInput.js';
import { formatStockLine } from '../../../utils/productUnits.js';
import UnitPicker from './UnitPicker.jsx';

const inputStyle = { width: '50%' };

// forwardRef: the quantity input is focused by useProductModalFocus.
const LabeledNumber = forwardRef(({ label, ...inputProps }, ref) => (
  <div>
    <div>{label}</div>
    <InputNumber ref={ref} style={inputStyle} {...inputProps} />
  </div>
));
LabeledNumber.displayName = 'LabeledNumber';

const PreviousPriceLink = ({ previousPrice, pendingPrice, onApply }) => {
  if (!Number.isFinite(previousPrice)) return null;
  const isSamePrice = Number(pendingPrice || 0) === Number(previousPrice || 0);
  return (
    <div style={{ marginTop: 4 }}>
      <Button
        type="link"
        size="small"
        style={{ padding: 0, height: 'auto' }}
        disabled={isSamePrice}
        onClick={() => onApply?.()}
      >
        Giá trước: {formatMoney(previousPrice)}
      </Button>
    </div>
  );
};

// Right column of the product modal: chosen product, quantity, price, dimensions.
const ProductInfoPanel = ({
  pendingProduct,
  pendingQty,
  pendingPrice,
  pendingLength,
  pendingWidth,
  previousPrice,
  priceMin,
  showDimensions,
  unitSelection,
  qtyInputRef,
  onChangeQty,
  onChangePrice,
  onChangeLength,
  onChangeWidth,
  onApplyPreviousPrice,
  onAdd,
  onClose,
}) => (
  <div style={{ flex: 2 }}>
    <div className="section-title">Thông tin hàng</div>
    <Space direction="vertical" style={{ width: '100%' }}>
      <div>
        <strong>{pendingProduct?.name || 'Chưa chọn sản phẩm'}</strong>
        <div>{pendingProduct?.code || ''}</div>
        <div>{formatStockLine(pendingProduct)}</div>
      </div>
      <UnitPicker product={pendingProduct} selection={unitSelection} />
      <LabeledNumber
        label="Số lượng"
        value={pendingQty}
        onChange={onChangeQty}
        ref={qtyInputRef}
      />
      <div>
        <LabeledNumber
          label="Đơn giá"
          min={priceMin}
          value={pendingPrice}
          formatter={formatNumberInput}
          parser={parseNumberInput}
          onChange={onChangePrice}
        />
        <PreviousPriceLink
          previousPrice={previousPrice}
          pendingPrice={pendingPrice}
          onApply={onApplyPreviousPrice}
        />
      </div>
      {showDimensions && (
        <>
          <LabeledNumber
            label="Chiều dài"
            min={0}
            value={pendingLength ?? undefined}
            onChange={onChangeLength}
          />
          <LabeledNumber
            label="Chiều rộng"
            min={0}
            value={pendingWidth ?? undefined}
            onChange={onChangeWidth}
          />
        </>
      )}
      <div className="pos-payment-actions">
        <Button
          type="primary"
          className="btn-success"
          disabled={!pendingProduct}
          onClick={onAdd}
        >
          Thêm vào hóa đơn
        </Button>
        <Button onClick={onClose}>Xong</Button>
      </div>
    </Space>
  </div>
);

export default ProductInfoPanel;

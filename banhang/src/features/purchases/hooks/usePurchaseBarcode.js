import { useEditionFeature } from '../../../platform/useActiveModule.js';
import { useBarcodeLines } from '../../barcode/useBarcodeLines.js';
import { SCAN_PLACEHOLDER } from '../../barcode/scanPlaceholder.js';
import { getUnitCostPrice } from '../../../utils/productUnits.js';
import { buildPurchaseLine } from '../domain/purchasesDomain.js';

const buildLine = ({ product, qty, price, unit }) =>
  buildPurchaseLine({ product, qty, unitCost: price, unit });

// Purchases: scanning when `barcode` is on and the purchase is editable; the line unit select
// and F4 when `units` is on (the table hides the select when read-only, F4 is off then).
export const usePurchaseBarcode = ({ draft, catalog }) => {
  const barcodeOn = useEditionFeature('barcode');
  const unitsEnabled = useEditionFeature('units');
  const enabled = barcodeOn && !draft.readOnlyEdit;
  const lines = useBarcodeLines({
    enabled,
    unitsEnabled: unitsEnabled && !draft.readOnlyEdit,
    items: draft.items,
    setItems: draft.setItems,
    products: catalog.products,
    searchProducts: catalog.searchProducts,
    priceField: 'unitCost',
    getUnitPrice: getUnitCostPrice,
    buildLine,
  });
  return {
    addByCode: enabled ? lines.addByCode : undefined,
    changeItemUnit: unitsEnabled ? lines.changeItemUnit : undefined,
    searchPlaceholder: barcodeOn ? SCAN_PLACEHOLDER : undefined,
  };
};

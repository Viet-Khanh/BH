import { useEditionFeature } from '../../../platform/useActiveModule.js';
import { useBarcodeLines } from '../../../features/barcode/useBarcodeLines.js';
import { buildSaleLine } from '../invoiceItemHandlers.js';

const buildLine = ({ product, qty, price, unit }) =>
  buildSaleLine({ product, qty, unitPrice: price, unit });

// Sales: scanning when `barcode` is on; the line unit select and F4 when `units` is on.
// `products` = the list the items table shows (all products).
export const useInvoiceBarcode = ({
  items,
  setItems,
  products,
  onSearchProducts,
  getUnitPrice,
}) => {
  const enabled = useEditionFeature('barcode');
  const unitsEnabled = useEditionFeature('units');
  const lines = useBarcodeLines({
    enabled,
    unitsEnabled,
    items,
    setItems,
    products,
    searchProducts: onSearchProducts,
    priceField: 'unitPrice',
    getUnitPrice,
    buildLine,
  });
  return {
    enabled,
    addByCode: enabled ? lines.addByCode : undefined,
    changeItemUnit: unitsEnabled ? lines.changeItemUnit : undefined,
  };
};

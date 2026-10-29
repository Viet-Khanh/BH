import { useEditionFeature } from '../../../platform/useActiveModule.js';
import { useBarcodeLines } from '../../../features/barcode/useBarcodeLines.js';
import { buildSaleLine } from '../invoiceItemHandlers.js';

const buildLine = ({ product, qty, price, unit }) =>
  buildSaleLine({ product, qty, unitPrice: price, unit });

// Sales: scanning when `barcode` is on; the line unit select when `units` is on.
export const useInvoiceBarcode = ({
  items,
  setItems,
  activeProducts,
  onSearchProducts,
  getUnitPrice,
}) => {
  const enabled = useEditionFeature('barcode');
  const unitsEnabled = useEditionFeature('units');
  const lines = useBarcodeLines({
    enabled,
    items,
    setItems,
    products: activeProducts,
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

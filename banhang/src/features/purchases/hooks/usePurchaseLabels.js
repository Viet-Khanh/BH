import { useCallback } from 'react';
import { useLabelPrint } from '../../printing/useLabelPrint.js';

// Label printing on the purchases screen: "In tem" in the purchase detail. The list after
// saving opens only through F8 "Lưu và in" (usePurchaseSavePrint).
export const usePurchaseLabels = ({ settings, products }) => {
  const labelPrint = useLabelPrint({ settings, products });
  const { enabled, openForPurchase } = labelPrint;

  const printDetailLabels = useCallback(
    (detail) => openForPurchase(detail?.items || []),
    [openForPurchase]
  );

  return {
    ...labelPrint,
    printDetailLabels: enabled ? printDetailLabels : null,
  };
};

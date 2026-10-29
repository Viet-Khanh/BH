import { useCallback } from 'react';
import { shouldAutoPrintLabels } from '../../printing/domain/printSettings.js';
import { useLabelPrint } from '../../printing/useLabelPrint.js';

// Label printing on the purchases screen: auto list after a new purchase, "In tem" in the detail.
export const usePurchaseLabels = ({ settings, products }) => {
  const labelPrint = useLabelPrint({ settings, products });
  const { enabled, openForPurchase } = labelPrint;
  const autoPrint = shouldAutoPrintLabels(settings, enabled);

  // Saved purchase + its products from the create response (all lines' products).
  const onPurchaseCreated = useCallback(
    (purchase, savedProducts = []) => {
      if (!autoPrint) return;
      openForPurchase(purchase?.items || [], savedProducts, { auto: true });
    },
    [autoPrint, openForPurchase]
  );

  const printDetailLabels = useCallback(
    (detail) => openForPurchase(detail?.items || []),
    [openForPurchase]
  );

  return {
    ...labelPrint,
    onPurchaseCreated,
    printDetailLabels: enabled ? printDetailLabels : null,
  };
};

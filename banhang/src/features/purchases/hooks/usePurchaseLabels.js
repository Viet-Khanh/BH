import { useCallback, useEffect, useState } from 'react';
import { shouldAutoPrintLabels } from '../../printing/domain/printSettings.js';
import { useLabelPrint } from '../../printing/useLabelPrint.js';

// Label printing on the purchases screen: auto list after a new purchase, "In tem" in the detail.
// The auto list waits until the payment modal is closed, so Enter keeps its meaning there.
export const usePurchaseLabels = ({ settings, products, paymentModalOpen }) => {
  const labelPrint = useLabelPrint({ settings, products });
  const { enabled, openForPurchase } = labelPrint;
  const autoPrint = shouldAutoPrintLabels(settings, enabled);
  const [pending, setPending] = useState(null);

  // Saved purchase + its products from the create response (all lines' products).
  const onPurchaseCreated = useCallback(
    (purchase, savedProducts = []) => {
      if (!autoPrint) return;
      setPending({ items: purchase?.items || [], products: savedProducts });
    },
    [autoPrint]
  );

  useEffect(() => {
    if (!pending || paymentModalOpen) return;
    setPending(null);
    openForPurchase(pending.items, pending.products, { auto: true });
  }, [openForPurchase, paymentModalOpen, pending]);

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

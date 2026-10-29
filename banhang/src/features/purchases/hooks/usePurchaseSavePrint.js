import { useCallback, useEffect, useRef, useState } from 'react';
import { message } from 'antd';
import { readPrintSettings } from '../../printing/domain/printSettings.js';
import { printDocument } from '../../printing/printTargets.js';
import { getPurchasePrintPlan } from '../domain/purchaseSavePrint.js';
import {
  buildPurchaseSlipHtml,
  buildSavedPurchaseSlip,
} from '../domain/purchaseSlipHtml.js';
import { mergeProducts } from '../domain/purchasesDomain.js';

// Slip on the A4 printer first, then the label list.
const runPrintJob = async (job, copies, openForPurchase) => {
  if (job.slipHtml) {
    try {
      await printDocument(job.slipHtml, { copies, autoPageSize: true });
    } catch (error) {
      message.error('Không in được phiếu nhập.');
    }
  }
  if (job.labels) openForPurchase(job.items, job.products, { auto: true });
};

// "F8 - Lưu và in" / "F12 - Lưu không in" of the purchase payment modal. The slip HTML is
// built at checkout (before the form resets) from the saved purchase; printing waits
// until the payment modal is closed, so its keys keep their meaning there.
export const usePurchaseSavePrint = ({
  settings,
  labels,
  paymentModalOpen,
  draft,
  supplierDebt,
  suppliers,
  products,
}) => {
  const savedRef = useRef(null);
  const [job, setJob] = useState(null);
  const { enabled: labelsEnabled, openForPurchase } = labels;

  // usePurchasePersistence `onSaved`: the save response's products (all lines).
  const rememberSaved = useCallback((purchase, savedProducts = []) => {
    savedRef.current = { purchase, products: savedProducts };
  }, []);

  // usePurchasePayments `onCheckedOut`; reads this render's draft (what was saved).
  const onCheckedOut = (purchase, { print, paid }) => {
    const saved =
      savedRef.current?.purchase?.id === purchase?.id ? savedRef.current : null;
    savedRef.current = null;
    const plan = getPurchasePrintPlan(settings, labelsEnabled, { print });
    if (!plan.slip && !plan.labels) return;
    const savedProducts = saved?.products || [];
    const slip = buildSavedPurchaseSlip({ purchase, draft, supplierDebt });
    const supplierId = purchase?.supplierId || draft.supplierId;
    setJob({
      slipHtml: plan.slip
        ? buildPurchaseSlipHtml({
            slip,
            supplier:
              suppliers.find((item) => item.id === supplierId) ||
              draft.supplier,
            payments: [{ amount: paid }],
            products: mergeProducts(products, savedProducts),
            settings,
          })
        : '',
      labels: plan.labels,
      items: slip.items,
      products: savedProducts,
    });
  };

  useEffect(() => {
    if (!job || paymentModalOpen) return;
    setJob(null);
    runPrintJob(job, readPrintSettings(settings).printCopies, openForPurchase);
  }, [job, openForPurchase, paymentModalOpen, settings]);

  return { rememberSaved, onCheckedOut };
};

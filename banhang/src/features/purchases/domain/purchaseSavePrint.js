// Purchase payment modal: "F8 - Lưu và in" / "F12 - Lưu không in".
import {
  readPrintSettings,
  shouldAutoPrintLabels,
} from '../../printing/domain/printSettings.js';

// What to print after saving: nothing on F12; on F8 the slip (A4) and the label list
// (edition flag `labels`) as System → In ấn → Nhập hàng says.
export const getPurchasePrintPlan = (settings, labelsEnabled, options = {}) => {
  if (options?.print !== true) return { slip: false, labels: false };
  return {
    slip: readPrintSettings(settings).purchasePrintSlip,
    labels: shouldAutoPrintLabels(settings, labelsEnabled),
  };
};

const CHECKOUT_KEYS = { F8: true, F12: false };

// Key event → `print` of the checkout (F8 true, F12 false), null for any other key
// or a modified F-key (Ctrl/Alt/Meta).
export const getCheckoutKeyPrint = (event) => {
  if (!event || event.ctrlKey || event.altKey || event.metaKey) return null;
  return Object.hasOwn(CHECKOUT_KEYS, event.key)
    ? CHECKOUT_KEYS[event.key]
    : null;
};

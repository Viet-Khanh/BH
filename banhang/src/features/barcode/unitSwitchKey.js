import { nextUnitName } from '../../utils/barcodeLines.js';

// F4 → { index, unitName } to switch the last line to its next unit, or null to ignore the key
// (other keys, Ctrl/Alt/Meta held — Alt+F4 closes the window —, a modal open, no units).
export const getUnitSwitchForKey = (
  event,
  { items = [], products = [], modalOpen = false }
) => {
  if (event.key !== 'F4') return null;
  if (event.ctrlKey || event.altKey || event.metaKey || modalOpen) return null;
  const index = items.length - 1;
  const item = items[index];
  const product = products.find((entry) => entry.id === item?.productId);
  if (!product?.units?.length) return null;
  return { index, unitName: nextUnitName(product, item.unitName) };
};

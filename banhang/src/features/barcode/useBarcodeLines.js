import { useCallback, useEffect, useRef } from 'react';
import { message } from 'antd';
import {
  findBarcodeMatch,
  mergeScannedLine,
  switchLineUnit,
} from '../../utils/barcodeLines.js';
import { findProductUnit } from '../../utils/productUnits.js';
import { playBeep } from '../../utils/beep.js';
import { createTaskQueue } from '../../utils/taskQueue.js';
import { isModalOpen } from './barcodeDom.js';
import { getUnitSwitchForKey } from './unitSwitchKey.js';
import { useBarcodeScanner } from './useBarcodeScanner.js';

const activeOnly = (list) =>
  (Array.isArray(list) ? list : []).filter((product) => !product?.isDeleted);

// Scanned/typed barcodes → merged lines (scanning when `enabled`); unit switching on lines
// (table select, F4 when `unitsEnabled`). `products` = the list the items table shows (all
// products, deleted included); only active ones match a scan. `searchProducts(code,
// { throwOnError: true })` must reject on failure so the real error is shown.
export const useBarcodeLines = ({
  enabled,
  unitsEnabled = false,
  items,
  setItems,
  products,
  searchProducts,
  priceField,
  getUnitPrice,
  buildLine,
}) => {
  const latest = useRef({});
  latest.current = { items, products, getUnitPrice, buildLine };
  const queueRef = useRef(null);
  if (!queueRef.current) queueRef.current = createTaskQueue();

  const addNow = useCallback(
    async (code) => {
      const found = activeOnly(
        await searchProducts?.(code, { throwOnError: true })
      );
      const match = findBarcodeMatch(
        [...found, ...activeOnly(latest.current.products)],
        code
      );
      if (!match) return false;
      const { product, unitName } = match;
      const unit = findProductUnit(product, unitName);
      const line = latest.current.buildLine({
        product,
        qty: 1,
        price: latest.current.getUnitPrice(product, unitName),
        unit: {
          value: unit ? unit.name : '',
          factor: unit ? Number(unit.factor) : 1,
        },
      });
      setItems((prev) => mergeScannedLine(prev, line, priceField));
      return true;
    },
    [priceField, searchProducts, setItems]
  );

  // Queued so lines are appended in scan order even when searches finish out of order.
  const addByCode = useCallback(
    (code) => queueRef.current.run(() => addNow(code)),
    [addNow]
  );

  const handleScan = useCallback(
    async (code) => {
      try {
        if (await addByCode(code)) {
          playBeep('ok');
          return;
        }
        playBeep('error');
        message.warning(`Mã ${code} chưa có trong danh mục.`);
      } catch (error) {
        playBeep('error');
        message.error(error?.message || 'Không tìm được hàng theo mã vạch.');
      }
    },
    [addByCode]
  );

  useBarcodeScanner({ enabled, onScan: handleScan });

  const changeItemUnit = useCallback(
    (index, unitName) => {
      const {
        items: current,
        products: list,
        getUnitPrice: priceOf,
      } = latest.current;
      const item = current[index];
      const product = (list || []).find(
        (entry) => entry.id === item?.productId
      );
      if (!product) return;
      const price = priceOf(product, unitName);
      setItems((prev) =>
        prev.map((line, position) =>
          position === index
            ? switchLineUnit(line, product, unitName, price, priceField)
            : line
        )
      );
    },
    [priceField, setItems]
  );

  useEffect(() => {
    if (!unitsEnabled) return undefined;
    const handleKeyDown = (event) => {
      const { items: current, products: list } = latest.current;
      const change = getUnitSwitchForKey(event, {
        items: current,
        products: list,
        modalOpen: event.key === 'F4' && isModalOpen(),
      });
      if (!change) return;
      event.preventDefault();
      changeItemUnit(change.index, change.unitName);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [changeItemUnit, unitsEnabled]);

  return { addByCode, changeItemUnit };
};

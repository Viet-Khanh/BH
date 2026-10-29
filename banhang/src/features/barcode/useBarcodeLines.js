import { useCallback, useEffect, useRef } from 'react';
import { message } from 'antd';
import {
  findBarcodeMatch,
  mergeScannedLine,
  nextUnitName,
  switchLineUnit,
} from '../../utils/barcodeLines.js';
import { findProductUnit } from '../../utils/productUnits.js';
import { playBeep } from '../../utils/beep.js';
import { useBarcodeScanner } from './useBarcodeScanner.js';

const activeOnly = (list) =>
  (Array.isArray(list) ? list : []).filter((product) => !product?.isDeleted);

// Scanned/typed barcodes → merged lines; unit switching on lines (table select, F4).
export const useBarcodeLines = ({
  enabled,
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

  const addByCode = useCallback(
    async (code) => {
      const found = activeOnly(await searchProducts?.(code));
      const match = findBarcodeMatch(
        [...found, ...latest.current.products],
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
      const product = list.find((entry) => entry.id === item?.productId);
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
    if (!enabled) return undefined;
    const handleKeyDown = (event) => {
      if (event.key !== 'F4') return;
      const { items: current, products: list } = latest.current;
      const index = current.length - 1;
      const product = list.find(
        (entry) => entry.id === current[index]?.productId
      );
      if (!product?.units?.length) return;
      event.preventDefault();
      changeItemUnit(index, nextUnitName(product, current[index].unitName));
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [changeItemUnit, enabled]);

  return { addByCode, changeItemUnit };
};

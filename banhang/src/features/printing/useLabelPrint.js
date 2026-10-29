import { useCallback, useMemo, useRef, useState } from 'react';
import { message } from 'antd';
import { useEditionFeature } from '../../platform/useActiveModule.js';
import { useSettingsStore } from '../../store/settingsStore.js';
import { readPrintSettings } from './domain/printSettings.js';
import {
  countLabels,
  createProductRows,
  createPurchaseRows,
  getPrintableRows,
  getVisibleRows,
  setRowCount as changeRowCount,
  setRowUnit as changeRowUnit,
} from './labels/labelRows.js';
import { printLabelRows } from './labels/printLabels.js';

const CLOSED = {
  open: false,
  rows: [],
  skipWithBarcode: false,
  forPurchase: false,
};

// State of the label confirm list (LabelPrintModal). `enabled` = edition flag `labels`.
export const useLabelPrint = ({ settings, products = [] } = {}) => {
  const enabled = useEditionFeature('labels');
  const storeSettings = useSettingsStore((state) => state.settings);
  const activeSettings = settings || storeSettings;
  const [state, setState] = useState(CLOSED);
  const [printing, setPrinting] = useState(false);
  const printingRef = useRef(false);

  // `auto`: opened by saving a purchase — stays closed when nothing needs a label.
  const openForPurchase = useCallback(
    (items, extraProducts = [], { auto = false } = {}) => {
      const rows = createPurchaseRows(items, products, extraProducts);
      if (auto && !getVisibleRows(rows, true).length) return false;
      setState({ open: true, rows, skipWithBarcode: true, forPurchase: true });
      return true;
    },
    [products]
  );

  const openForProduct = useCallback((product) => {
    const rows = createProductRows(product);
    setState({ open: true, rows, skipWithBarcode: false, forPurchase: false });
  }, []);

  const close = useCallback(() => setState(CLOSED), []);

  const setRowUnit = useCallback((key, unitName) => {
    setState((prev) => ({
      ...prev,
      rows: changeRowUnit(prev.rows, key, unitName),
    }));
  }, []);

  const setRowCount = useCallback((key, count) => {
    setState((prev) => ({
      ...prev,
      rows: changeRowCount(prev.rows, key, count),
    }));
  }, []);

  const setSkipWithBarcode = useCallback((skipWithBarcode) => {
    setState((prev) => ({ ...prev, skipWithBarcode }));
  }, []);

  const printableRows = useMemo(
    () => getPrintableRows(state.rows, state.skipWithBarcode),
    [state.rows, state.skipWithBarcode]
  );
  const total = countLabels(printableRows);

  const print = useCallback(async () => {
    if (printingRef.current) return false;
    if (!printableRows.length) {
      message.warning('Chưa có tem để in.');
      return false;
    }
    printingRef.current = true;
    setPrinting(true);
    try {
      const ok = await printLabelRows(printableRows, activeSettings);
      if (ok) {
        message.success(`Đã gửi ${total} tem tới máy in.`);
        setState(CLOSED);
      }
      return ok;
    } finally {
      printingRef.current = false;
      setPrinting(false);
    }
  }, [activeSettings, printableRows, total]);

  return {
    enabled,
    open: state.open,
    rows: getVisibleRows(state.rows, state.skipWithBarcode),
    total,
    forPurchase: state.forPurchase,
    printerName: readPrintSettings(activeSettings).labelPrinterName,
    printing,
    openForPurchase,
    openForProduct,
    setRowUnit,
    setRowCount,
    skipWithBarcode: state.skipWithBarcode,
    setSkipWithBarcode,
    print,
    close,
  };
};

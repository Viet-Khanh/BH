import { useEffect, useState } from 'react';
import { canListPrinters, listPrinters } from './printerList.js';

// Installed printers, read once on mount (Electron). `canChoose` is false on the web.
export const usePrinters = () => {
  const [printers, setPrinters] = useState(null);
  const [canChoose] = useState(canListPrinters);

  useEffect(() => {
    if (!canChoose) return undefined;
    let cancelled = false;
    listPrinters().then((list) => {
      if (!cancelled) setPrinters(list);
    });
    return () => {
      cancelled = true;
    };
  }, [canChoose]);

  return { printers, canChoose };
};

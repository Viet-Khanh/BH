import { useEffect, useState } from 'react';
import { buildSampleReceiptData } from '../../domain/printSamples.js';
import { loadReceiptAssets } from '../../receipt/receiptAssets.js';
import { buildReceiptHtml } from '../../receipt/receiptHtml.js';

const DELAY_MS = 300;

// Sample receipt HTML for `settings` (memoized by the caller), debounced because
// QR/barcode rendering is async; stale results are dropped.
export const useReceiptPreviewHtml = (settings) => {
  const [html, setHtml] = useState('');

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const data = buildSampleReceiptData(settings);
        const assets = await loadReceiptAssets(data);
        if (!cancelled) setHtml(buildReceiptHtml(data, assets));
      } catch {
        // keep the previous preview
      }
    }, DELAY_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [settings]);

  return html;
};

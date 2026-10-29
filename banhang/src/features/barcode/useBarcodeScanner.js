import { useEffect, useRef } from 'react';
import { getFocusedField, isModalOpen, restoreField } from './barcodeDom.js';
import { createScanKeyHandler } from './scanKeyHandler.js';

// Calls onScan(code) for barcode-scanner input anywhere on the page (no modal open).
export const useBarcodeScanner = ({ enabled, onScan }) => {
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  useEffect(() => {
    if (!enabled) return undefined;
    const handleKeyDown = createScanKeyHandler({
      onScan: (code) => onScanRef.current?.(code),
      isBlocked: isModalOpen,
      getFocusedField,
      restoreField,
    });
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [enabled]);
};

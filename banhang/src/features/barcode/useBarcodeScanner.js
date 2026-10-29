import { useEffect, useRef } from 'react';
import { createScanBuffer } from '../../utils/scanBuffer.js';

const isModalOpen = () =>
  Array.from(document.querySelectorAll('.ant-modal-wrap')).some(
    (node) => node.style.display !== 'none'
  );

const isField = (node) =>
  node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement;

// Puts back a field's value (React-controlled inputs need the native setter + input event).
const restoreValue = (snapshot) => {
  if (!snapshot || !isField(snapshot.node)) return;
  const proto = Object.getPrototypeOf(snapshot.node);
  Object.getOwnPropertyDescriptor(proto, 'value')?.set?.call(
    snapshot.node,
    snapshot.value
  );
  snapshot.node.dispatchEvent(new Event('input', { bubbles: true }));
};

// Calls onScan(code) for barcode-scanner input anywhere on the page (no modal open).
export const useBarcodeScanner = ({ enabled, onScan }) => {
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  useEffect(() => {
    if (!enabled) return undefined;
    const buffer = createScanBuffer();
    let snapshot = null;
    let leaked = false;

    const handleKeyDown = (event) => {
      if (event.ctrlKey || event.altKey || event.metaKey || isModalOpen()) {
        return;
      }
      if (event.key === 'Enter') {
        const code = buffer.end(event.timeStamp);
        if (!code) return;
        event.preventDefault();
        event.stopPropagation();
        if (leaked) restoreValue(snapshot);
        snapshot = null;
        leaked = false;
        onScanRef.current?.(code);
        return;
      }
      if (event.key.length !== 1) return;
      const state = buffer.push(event.key, event.timeStamp);
      if (state === 'first') {
        const node = document.activeElement;
        snapshot = isField(node) ? { node, value: node.value } : null;
        leaked = Boolean(snapshot);
        return;
      }
      event.preventDefault();
      event.stopPropagation();
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [enabled]);
};

import { useEffect, useRef } from 'react';
import { isPrintEnterKey } from '../labels/labelPrintKeys.js';

// While `open`, Enter prints once. Deferred a tick so a value typed just before
// (count input) is already in state when printing reads the rows.
export const useEnterToPrint = ({ open, onPrint }) => {
  const onPrintRef = useRef(onPrint);
  onPrintRef.current = onPrint;

  useEffect(() => {
    if (!open) return undefined;
    let timer = null;
    const handleKeyDown = (event) => {
      if (!isPrintEnterKey(event)) return;
      event.preventDefault();
      if (timer) return;
      timer = window.setTimeout(() => {
        timer = null;
        onPrintRef.current?.();
      }, 0);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (timer) window.clearTimeout(timer);
    };
  }, [open]);
};

import { useEffect, useRef } from 'react';
import { createLabelKeyHandler } from '../labels/labelPrintKeys.js';

// While `open`, Enter prints once (a scanner's Enter is swallowed instead). Deferred a
// tick so a value typed just before (count input) is already in state when printing.
export const useEnterToPrint = ({ open, onPrint }) => {
  const onPrintRef = useRef(onPrint);
  onPrintRef.current = onPrint;

  useEffect(() => {
    if (!open) return undefined;
    let timer = null;
    const readKey = createLabelKeyHandler();
    const handleKeyDown = (event) => {
      const action = readKey(event);
      if (!action) return;
      event.preventDefault();
      if (action !== 'print' || timer) return;
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

import { useEffect, useRef } from 'react';
import { getCheckoutKeyPrint } from '../domain/purchaseSavePrint.js';

// F8 = "Lưu và in", F12 = "Lưu không in" while the purchase payment modal is open.
// `checkout({ print })` ignores repeats while a save is running (usePurchasePayments).
export const usePurchaseCheckoutKeys = ({ open, checkout }) => {
  const checkoutRef = useRef(checkout);
  checkoutRef.current = checkout;

  useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = (event) => {
      const print = getCheckoutKeyPrint(event);
      if (print === null) return;
      event.preventDefault();
      if (event.repeat) return;
      checkoutRef.current({ print });
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open]);
};

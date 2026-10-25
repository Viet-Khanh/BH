import { useCallback, useEffect, useRef } from 'react';

const focusLater = (ref, { selectAll }) =>
  requestAnimationFrame(() => {
    if (!ref.current) return;
    if (!selectAll) {
      ref.current.focus();
      return;
    }
    ref.current.focus({ cursor: 'all' });
    ref.current.select?.();
  });

// Focus rules: search box on open, quantity box when the user picks another product.
export const useProductModalFocus = ({
  open,
  autoFocusSearchOnOpen,
  pendingProductId,
}) => {
  const searchInputRef = useRef(null);
  const qtyInputRef = useRef(null);
  const lastProductIdRef = useRef(null);
  const isFirstOpenCycleRef = useRef(true);

  const focusSearchInput = useCallback(
    ({ selectAll = false } = {}) => focusLater(searchInputRef, { selectAll }),
    []
  );

  useEffect(() => {
    if (open && autoFocusSearchOnOpen) focusSearchInput();
  }, [open, focusSearchInput, autoFocusSearchOnOpen]);

  useEffect(() => {
    if (!open) {
      isFirstOpenCycleRef.current = true;
      return;
    }
    const nextId = pendingProductId || null;
    if (
      nextId &&
      nextId !== lastProductIdRef.current &&
      !isFirstOpenCycleRef.current
    ) {
      focusLater(qtyInputRef, { selectAll: true });
    }
    isFirstOpenCycleRef.current = false;
    lastProductIdRef.current = nextId;
  }, [open, pendingProductId]);

  return { searchInputRef, qtyInputRef, focusSearchInput };
};

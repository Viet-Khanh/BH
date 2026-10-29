import { useEffect } from 'react';

// Debounced server search for the typed keyword; F2 opens the product search.
export const useInvoiceSearchEffects = ({
  searchKeyword,
  onSearchProducts,
  setSearchOpen,
}) => {
  useEffect(() => {
    if (!onSearchProducts) return;
    const keyword = searchKeyword.trim();
    if (!keyword) return;

    const timer = setTimeout(() => {
      onSearchProducts(keyword);
    }, 250);

    return () => clearTimeout(timer);
  }, [onSearchProducts, searchKeyword]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key !== 'F2') return;
      event.preventDefault();
      setSearchOpen(true);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setSearchOpen]);
};

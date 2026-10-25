import { useEffect, useState } from 'react';

const SEARCH_DELAY_MS = 250;

export const useDebouncedProductSearch = ({ open, onSearchProducts }) => {
  const [searchKeyword, setSearchKeyword] = useState('');

  useEffect(() => {
    if (!open || !onSearchProducts) return;
    const keyword = searchKeyword.trim();
    const timer = setTimeout(() => onSearchProducts(keyword), SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [open, searchKeyword, onSearchProducts]);

  return { searchKeyword, setSearchKeyword };
};

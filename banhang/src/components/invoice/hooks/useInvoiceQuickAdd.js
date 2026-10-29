import { useCallback, useMemo } from 'react';
import {
  hasSearchMatch,
  normalizeSearchText,
} from '../../../utils/searchText.js';

// Search-bar quick add: top matches for the keyword, Enter adds the first one.
export const useInvoiceQuickAdd = ({
  activeProducts,
  searchKeyword,
  setSearchKeyword,
  setSearchOpen,
  openAddModal,
}) => {
  const filteredQuick = useMemo(() => {
    const keyword = normalizeSearchText(searchKeyword);
    if (!keyword) return [];
    return activeProducts
      .filter((item) => hasSearchMatch(item, keyword))
      .slice(0, 5);
  }, [activeProducts, searchKeyword]);

  const handleQuickAdd = useCallback(() => {
    if (!filteredQuick.length) {
      setSearchOpen(true);
      return;
    }

    openAddModal(filteredQuick[0]);
    setSearchKeyword('');
  }, [filteredQuick, openAddModal, setSearchKeyword, setSearchOpen]);

  return { filteredQuick, handleQuickAdd };
};

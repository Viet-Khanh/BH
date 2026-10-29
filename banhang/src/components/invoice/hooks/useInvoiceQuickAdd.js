import { useCallback, useMemo } from 'react';
import { quickAddByCode } from '../../../features/barcode/quickAddByCode.js';
import {
  hasSearchMatch,
  normalizeSearchText,
} from '../../../utils/searchText.js';

// Search-bar quick add: Enter adds an exact barcode/code match (when addByCode is
// given), else opens the first of the top matches for the keyword.
export const useInvoiceQuickAdd = ({
  activeProducts,
  searchKeyword,
  setSearchKeyword,
  setSearchOpen,
  openAddModal,
  addByCode,
}) => {
  const filteredQuick = useMemo(() => {
    const keyword = normalizeSearchText(searchKeyword);
    if (!keyword) return [];
    return activeProducts
      .filter((item) => hasSearchMatch(item, keyword))
      .slice(0, 5);
  }, [activeProducts, searchKeyword]);

  const handleQuickAdd = useCallback(async () => {
    if (await quickAddByCode(addByCode, searchKeyword)) {
      setSearchKeyword('');
      return;
    }
    if (!filteredQuick.length) {
      setSearchOpen(true);
      return;
    }

    openAddModal(filteredQuick[0]);
    setSearchKeyword('');
  }, [
    addByCode,
    filteredQuick,
    openAddModal,
    searchKeyword,
    setSearchKeyword,
    setSearchOpen,
  ]);

  return { filteredQuick, handleQuickAdd };
};

import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { resolveGroupKey } from './systemGroups.js';

const STORAGE_KEY = 'system_page_tab';
const TAB_PARAM = 'tab';

const readStoredTab = () => {
  try {
    return window.sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
};

const storeTab = (key) => {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, key);
  } catch {
    // storage unavailable: the URL still carries the tab
  }
};

// Selected group: `?tab=` first, then the last one this session, else `shop`.
export const useSystemTab = (visibleGroups) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const requested = searchParams.get(TAB_PARAM) || readStoredTab();
  const activeKey = resolveGroupKey(requested, visibleGroups);

  useEffect(() => {
    storeTab(activeKey);
  }, [activeKey]);

  const selectTab = (key) =>
    setSearchParams({ [TAB_PARAM]: key }, { replace: true });

  return [activeKey, selectTab];
};

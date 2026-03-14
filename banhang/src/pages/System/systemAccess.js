const SYSTEM_ACCESS_KEY = 'system_page_access_granted';

export const grantSystemAccess = () => {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(SYSTEM_ACCESS_KEY, '1');
};

export const consumeSystemAccess = () => {
  if (typeof window === 'undefined') return false;
  const granted = window.sessionStorage.getItem(SYSTEM_ACCESS_KEY) === '1';
  if (granted) window.sessionStorage.removeItem(SYSTEM_ACCESS_KEY);
  return granted;
};

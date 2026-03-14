export const DEFAULT_SYSTEM_PASSWORD = '123456';

export const getSystemPasswordFromSettings = (settings) =>
  (settings?.systemPassword || DEFAULT_SYSTEM_PASSWORD).trim();

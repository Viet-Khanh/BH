const getListPrinters = () =>
  typeof window !== 'undefined' ? window.electronAPI?.listPrinters : null;

// True in the desktop app, where a printer can be chosen for silent printing.
export const canListPrinters = () => typeof getListPrinters() === 'function';

// Installed printers from Electron ([{ name, displayName, isDefault }]), or null
// on the web where the browser print dialog chooses the printer.
export const listPrinters = async () => {
  const list = getListPrinters();
  if (typeof list !== 'function') return null;
  try {
    const printers = await list();
    return Array.isArray(printers) ? printers : [];
  } catch (error) {
    return [];
  }
};

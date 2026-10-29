import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Electron's smallest custom page side, in microns.
const MIN_PAGE_MICRONS = 353;

const NAMED_PAGE_SIZES = {
  ...Object.fromEntries(
    ['A0', 'A1', 'A2', 'A3', 'A4', 'A5', 'A6'].map((size) => [size, size])
  ),
  LEGAL: 'Legal',
  LETTER: 'Letter',
  TABLOID: 'Tabloid',
};

// The main process stays self-contained: no imports from src/.
const toMicrons = (mm) => Math.round(Number(mm) * 1000);

// Named size ('A5', …) or custom { widthMm, heightMm } → { width, height } microns.
const normalizePageSize = (value) => {
  if (value && typeof value === 'object') {
    const width = toMicrons(value.widthMm);
    const height = toMicrons(value.heightMm);
    if (!(width >= MIN_PAGE_MICRONS) || !(height >= MIN_PAGE_MICRONS)) {
      return '';
    }
    return { width, height };
  }
  const normalized = String(value || '')
    .trim()
    .toUpperCase();
  return NAMED_PAGE_SIZES[normalized] || '';
};

const createMainWindow = async () => {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const devServerUrl = process.env.VITE_DEV_SERVER_URL;
  if (devServerUrl) {
    await win.loadURL(devServerUrl);
  } else {
    await win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  return win;
};

// Print jobs load from a temp file: large label batches exceed data: URL limits.
const createPrintFilePath = () => {
  const random = Math.random().toString(36).slice(2, 10);
  const name = `banhang-print-${Date.now()}-${random}.html`;
  return path.join(app.getPath('temp'), name);
};

const createPrintWindow = (showWindow) =>
  new BrowserWindow({
    show: showWindow,
    webPreferences: { contextIsolation: true, nodeIntegration: false },
  });

const listPrinters = async (webContents) => {
  const printers = await webContents.getPrintersAsync();
  return printers.map(({ name, displayName, isDefault }) => ({
    name,
    displayName: displayName || name,
    isDefault: Boolean(isDefault),
  }));
};

// A missing printer (settings restored on another machine) falls back to the
// default printer; the renderer warns the user.
const resolveDeviceName = async (webContents, value) => {
  const deviceName = String(value || '').trim();
  if (!deviceName) return { deviceName: '', fallback: false };
  try {
    const printers = await webContents.getPrintersAsync();
    if (printers.some((printer) => printer.name === deviceName)) {
      return { deviceName, fallback: false };
    }
    return { deviceName: '', fallback: true };
  } catch (error) {
    return { deviceName, fallback: false };
  }
};

ipcMain.handle('list-printers', (event) => listPrinters(event.sender));

ipcMain.handle('print-html', async (event, payload = {}) => {
  const { html = '', options = {} } = payload || {};
  if (!html) {
    return { ok: false, error: 'missing_html' };
  }

  const copies = Math.max(1, Math.round(Number(options.copies) || 1));
  const silent = options.silent !== false;
  const pageSize = normalizePageSize(options.pageSize);
  const { deviceName, fallback } = await resolveDeviceName(
    event.sender,
    options.deviceName
  );
  const filePath = createPrintFilePath();
  let printWindow = null;

  try {
    await fs.writeFile(filePath, html, 'utf8');
    printWindow = createPrintWindow(!silent);
    await printWindow.loadFile(filePath);
    const printOptions = {
      silent,
      printBackground: true,
      copies,
    };
    if (pageSize) {
      printOptions.pageSize = pageSize;
    }
    if (typeof pageSize === 'object') {
      // Custom sizes (receipt roll, label row) are laid out edge to edge.
      printOptions.margins = { marginType: 'none' };
    }
    if (deviceName) {
      printOptions.deviceName = deviceName;
    }

    await new Promise((resolve, reject) => {
      printWindow.webContents.print(printOptions, (success, failureReason) => {
        if (!success) {
          reject(new Error(failureReason || 'Print failed'));
          return;
        }
        resolve();
      });
    });
    return fallback ? { ok: true, fallback: true } : { ok: true };
  } finally {
    if (printWindow && !printWindow.isDestroyed()) {
      printWindow.close();
    }
    await fs.unlink(filePath).catch(() => {});
  }
});

ipcMain.handle('save-file', async (event, payload = {}) => {
  const { data, options = {} } = payload || {};
  const { defaultPath, filters } = options;
  if (!data) return { canceled: true, error: 'missing_data' };

  const { canceled, filePath } = await dialog.showSaveDialog({
    defaultPath,
    filters,
  });
  if (canceled || !filePath) return { canceled: true };

  const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
  await fs.writeFile(filePath, buffer);
  return { canceled: false, filePath };
});

app.whenReady().then(async () => {
  await createMainWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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

const createPrintWindow = async (html, showWindow) => {
  const printWindow = new BrowserWindow({
    show: showWindow,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
  return printWindow;
};

const waitForLoad = (webContents) =>
  new Promise((resolve) => {
    if (!webContents || !webContents.isLoading()) {
      resolve();
      return;
    }
    webContents.once('did-finish-load', () => resolve());
  });

const resolveDefaultPrinter = async (webContents) => {
  try {
    const printers = await webContents.getPrintersAsync();
    if (!printers || printers.length === 0) return null;
    const preferred = printers.find((printer) => printer.isDefault) || printers[0];
    return preferred?.name || null;
  } catch (error) {
    return null;
  }
};

ipcMain.handle('print-html', async (event, payload = {}) => {
  const { html = '', options = {} } = payload || {};
  if (!html) {
    return { ok: false, error: 'missing_html' };
  }

  const copies = Math.max(1, Math.round(Number(options.copies) || 1));
  const silent = options.silent !== false;
  const printWindow = await createPrintWindow(html, !silent);
  const requestedDevice =
    typeof options.deviceName === 'string' && options.deviceName.trim()
      ? options.deviceName.trim()
      : null;
  const defaultDevice = await resolveDefaultPrinter(printWindow.webContents);
  const deviceName = requestedDevice || defaultDevice || undefined;

  try {
    await waitForLoad(printWindow.webContents);
    await new Promise((resolve, reject) => {
      printWindow.webContents.print(
        {
          silent,
          printBackground: true,
          copies,
          ...(deviceName ? { deviceName } : {}),
        },
        (success, failureReason) => {
          if (!success) {
            reject(new Error(failureReason || 'Print failed'));
            return;
          }
          resolve();
        }
      );
    });
return { ok: true, deviceName };
  } catch (error) {
    return { ok: false, error: error?.message || 'print_failed', deviceName };
  } finally {
    if (!printWindow.isDestroyed()) {
      printWindow.close();
    }
  }
});

ipcMain.handle('save-file', async (event, payload = {}) => {
  const { data, options = {} } = payload || {};
  const { defaultPath, filters } = options;
  if (!data) return { canceled: true, error: 'missing_data' };

  const { canceled, filePath } = await dialog.showSaveDialog({ defaultPath, filters });
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

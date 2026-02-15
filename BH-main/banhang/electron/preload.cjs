const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  printHtml: (html, options = {}) => ipcRenderer.invoke('print-html', { html, options }),
  saveFile: (data, options = {}) => ipcRenderer.invoke('save-file', { data, options }),
});

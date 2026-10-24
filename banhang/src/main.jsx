import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, HashRouter } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import viVN from 'antd/locale/vi_VN';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import App from './App.jsx';
import './styles.css';
import 'antd/dist/reset.css';

dayjs.locale('vi');

const isElectron =
  typeof window !== 'undefined' &&
  (Boolean(window.electronAPI) ||
    window.location?.protocol === 'file:' ||
    navigator.userAgent.toLowerCase().includes(' electron/'));
const Router = isElectron ? HashRouter : BrowserRouter;

const renderApp = (wrap = (node) => node) => {
  ReactDOM.createRoot(document.getElementById('root')).render(
    // <React.StrictMode>
    <ConfigProvider locale={viVN}>
      <Router>{wrap(<App />)}</Router>
    </ConfigProvider>
    // </React.StrictMode>
  );
};

if (__DEMO__) {
  import('./demo/mountDemo.jsx').then(({ wrapWithDemo }) =>
    renderApp(wrapWithDemo)
  );
} else {
  renderApp();
}

if (
  import.meta.env.PROD &&
  !__DEMO__ &&
  'serviceWorker' in navigator &&
  !isElectron
) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.error('Service worker registration failed:', error);
    });
  });
}

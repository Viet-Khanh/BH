import { Tabs } from 'antd';
import { useEffect } from 'react';
import { useSettingsStore } from '../../../store/settingsStore.js';
import InvoicesTab from './InvoicesTab.jsx';

// Manual e-invoice workflow: export sales in the provider's format, track
// state, adjust changed sales, reports and export profiles.
const EinvoiceScreen = () => {
  const { settings, load: loadSettings } = useSettingsStore();

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const tabs = [
    {
      key: 'invoices',
      label: 'Hoá đơn',
      children: <InvoicesTab settings={settings} />,
    },
  ];

  return <Tabs items={tabs} destroyInactiveTabPane />;
};

export default EinvoiceScreen;

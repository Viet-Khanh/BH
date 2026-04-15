import { useEffect } from 'react';

export const useSalesBootstrap = ({
  loadCustomers,
  loadInvoices,
  loadSettings,
  ensureDefaultCustomer,
}) => {
  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      await Promise.all([loadCustomers(), loadSettings(), loadInvoices()]);
      if (cancelled) return;
      await ensureDefaultCustomer();
    };

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, [ensureDefaultCustomer, loadCustomers, loadInvoices, loadSettings]);
};

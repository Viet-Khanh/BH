import { useEffect } from 'react';

export const usePurchasesBootstrap = ({ loadSettings, loadSuppliers }) => {
  useEffect(() => {
    const bootstrap = async () => {
      await Promise.all([loadSuppliers(), loadSettings()]);
    };

    bootstrap();
  }, [loadSettings, loadSuppliers]);
};

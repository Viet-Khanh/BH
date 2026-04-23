import { useCallback, useEffect, useState } from 'react';
import { getTodayDashboard } from '../api/dashboardApi.js';

export const useTodayDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setError('');
    try {
      const result = await getTodayDashboard();
      setData(result);
    } catch (err) {
      setError(err?.message || 'Không thể tải dashboard hôm nay.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    const run = async () => {
      setLoading(true);
      setError('');
      try {
        const result = await getTodayDashboard();
        if (active) setData(result);
      } catch (err) {
        if (active)
          setError(err?.message || 'Không thể tải dashboard hôm nay.');
      } finally {
        if (active) setLoading(false);
      }
    };

    run();
    return () => {
      active = false;
    };
  }, []);

  return {
    data,
    loading,
    error,
    refresh: () => loadDashboard({ silent: true }),
  };
};

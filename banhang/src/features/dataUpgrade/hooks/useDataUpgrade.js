import { useCallback, useEffect, useState } from 'react';
import {
  commitDataUpgrade,
  getDataUpgradeStatus,
  previewDataUpgrade,
  reconcileDataUpgrade,
} from '../api/dataUpgradeApi.js';

export const useDataUpgrade = () => {
  const [status, setStatus] = useState(null);
  const [preview, setPreview] = useState(null);
  const [reconcile, setReconcile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [reconciling, setReconciling] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [error, setError] = useState('');

  const loadStatus = useCallback(async () => {
    setError('');
    try {
      const data = await getDataUpgradeStatus();
      setStatus(data);
      return data;
    } catch (err) {
      setError(err?.message || 'Không thể kiểm tra trạng thái dữ liệu.');
      return null;
    }
  }, []);

  const loadPreview = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await previewDataUpgrade();
      setPreview(data);
      setStatus(data.status);
      return data;
    } catch (err) {
      setError(err?.message || 'Không thể kiểm tra dữ liệu.');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const loadReconcile = useCallback(async () => {
    setReconciling(true);
    setError('');
    try {
      const data = await reconcileDataUpgrade();
      setReconcile(data);
      setStatus(data.status);
      return data;
    } catch (err) {
      setError(err?.message || 'Không thể đối soát số liệu.');
      return null;
    } finally {
      setReconciling(false);
    }
  }, []);

  const commit = useCallback(async () => {
    setCommitting(true);
    setError('');
    try {
      const data = await commitDataUpgrade();
      setPreview(data);
      setStatus(data.status);
      return data;
    } catch (err) {
      setError(err?.message || 'Không thể đồng bộ dữ liệu.');
      return null;
    } finally {
      setCommitting(false);
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  return {
    status,
    preview,
    reconcile,
    loading,
    reconciling,
    committing,
    error,
    loadStatus,
    loadPreview,
    loadReconcile,
    commit,
    clearPreview: () => setPreview(null),
    clearReconcile: () => setReconcile(null),
  };
};

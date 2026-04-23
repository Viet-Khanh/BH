import { apiRequest } from '../../../db/repository.js';

export const getDataUpgradeStatus = () => apiRequest('/data-upgrade/status');

export const reconcileDataUpgrade = () => apiRequest('/data-upgrade/reconcile');

export const previewDataUpgrade = () =>
  apiRequest('/data-upgrade/preview', { method: 'POST' });

export const commitDataUpgrade = () =>
  apiRequest('/data-upgrade/commit', { method: 'POST' });

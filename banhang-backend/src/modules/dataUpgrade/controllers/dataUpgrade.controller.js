import * as DataUpgradeService from '../services/dataUpgrade.service.js';

export const getStatus = async (req, res) => {
  const data = await DataUpgradeService.getDataUpgradeStatus();
  res.json(data);
};

export const preview = async (req, res) => {
  const data = await DataUpgradeService.previewDataUpgrade();
  res.json(data);
};

export const reconcile = async (req, res) => {
  const data = await DataUpgradeService.reconcileDataUpgrade();
  res.json(data);
};

export const commit = async (req, res) => {
  const data = await DataUpgradeService.commitDataUpgrade();
  res.json(data);
};

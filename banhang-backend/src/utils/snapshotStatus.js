export const SNAPSHOT_DATA_VERSION = 2;

export const getDataVersion = (settings) => {
  const value = Number(settings?.dataVersion || 0);
  return Number.isFinite(value) ? value : 0;
};

export const isSnapshotReady = (settings) =>
  getDataVersion(settings) >= SNAPSHOT_DATA_VERSION;

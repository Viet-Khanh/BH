import * as OpeningImportService from '../services/openingImport.service.js';

const respondKnownError = (res, err) => {
  if (!err?.status) return false;
  res.status(err.status).json({
    message: err.message,
    ...(err.payload || {}),
  });
  return true;
};

export const preview = async (req, res) => {
  try {
    const data = await OpeningImportService.previewOpeningImport(req.body);
    res.json(data);
  } catch (err) {
    if (respondKnownError(res, err)) return;
    throw err;
  }
};

export const commit = async (req, res) => {
  try {
    const data = await OpeningImportService.commitOpeningImport(req.body);
    res.json(data);
  } catch (err) {
    if (respondKnownError(res, err)) return;
    throw err;
  }
};

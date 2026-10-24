import { sendRequest } from '../../db/transport.js';

const requestOpeningImport = async (path, body) => {
  const { ok, data, text } = await sendRequest(path, {
    method: 'POST',
    body: body || {},
  });

  if (!ok) {
    const error = new Error(
      (data && data.message) || text || 'Yêu cầu import thất bại.'
    );
    error.details = data;
    throw error;
  }

  return data;
};

export const previewOpeningImport = (payload) =>
  requestOpeningImport('/opening-import/preview', payload);

export const commitOpeningImport = (payload) =>
  requestOpeningImport('/opening-import/commit', payload);

import { API_BASE } from '../../db/repository.js';

const parseBody = (text) => {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

const requestOpeningImport = async (path, body) => {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body || {}),
  });
  const text = await response.text();
  const data = parseBody(text);

  if (!response.ok) {
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

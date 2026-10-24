export const API_BASE =
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const parseBody = (text) => {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

const encodeBody = (body) =>
  body === undefined || typeof body === 'string' ? body : JSON.stringify(body);

const httpTransport = async (path, { headers, body, ...options } = {}) => {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(headers || {}) },
    body: encodeBody(body),
  });
  const text = await response.text();
  return {
    ok: response.ok,
    status: response.status,
    data: parseBody(text),
    text,
  };
};

// Demo builds answer requests in the browser (src/demo); the module is never bundled otherwise.
const demoTransport = async (path, { method = 'GET', body } = {}) => {
  const { dispatch } = await import('../demo/demoApp.js');
  const payload = typeof body === 'string' ? parseBody(body) : body;
  const { status, data } = await dispatch({
    method,
    path: `/api${path}`,
    body: payload,
  });
  const text = data == null ? '' : JSON.stringify(data);
  return { ok: status >= 200 && status < 300, status, data, text };
};

export const sendRequest = __DEMO__ ? demoTransport : httpTransport;

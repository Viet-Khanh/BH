// Thin client over dispatch() that fails loudly; used only while seeding.
export const createSeedApi = (dispatch) => {
  const call = async (method, path, body) => {
    const { status, data } = await dispatch({
      method,
      path: `/api${path}`,
      body,
    });
    if (status >= 400) {
      throw new Error(
        `Seed ${method} ${path} thất bại: ${data?.message || status}`
      );
    }
    return data;
  };
  return {
    get: (path) => call('GET', path),
    post: (path, body) => call('POST', path, body),
    put: (path, body) => call('PUT', path, body),
  };
};

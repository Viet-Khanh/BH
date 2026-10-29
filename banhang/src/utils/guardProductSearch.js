// Product search for sales/purchases screens. Typing searches report a failure via onError and
// return []; scans pass { throwOnError: true } to receive the real error instead.
export const guardProductSearch =
  (search, onError) =>
  async (keyword = '', { throwOnError = false } = {}) => {
    try {
      return await search(keyword);
    } catch (error) {
      if (throwOnError) throw error;
      onError?.(error);
      return [];
    }
  };

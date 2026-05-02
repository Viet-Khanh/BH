import {
  bulkFillMissingAvgCostFromRetail,
  bulkUpdateProductPricesByName,
} from '../db/repository.js';
import { createCrudStore } from './createCrudStore.js';

const TABLE = 'products';

export const useProductStore = createCrudStore(TABLE, {
  includeDeleted: true,
  extend: (set, get) => ({
    bulkUpdatePricesByName: async (items) => {
      const result = await bulkUpdateProductPricesByName(items);
      await get().load();
      return result;
    },
    bulkFillMissingAvgCostFromRetail: async (ids) => {
      const result = await bulkFillMissingAvgCostFromRetail(ids);
      await get().load();
      return result;
    },
  }),
});

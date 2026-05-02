import { beforeEach, describe, expect, it, vi } from 'vitest';

const Product = vi.hoisted(() => ({
  find: vi.fn(),
  bulkWrite: vi.fn(),
}));

vi.mock('../../models/Product.js', () => ({ default: Product }));

const { fillMissingAvgCostFromRetail } = await import(
  '../productTools.service.js'
);

const mockFindLean = (value) => {
  Product.find.mockReturnValueOnce({
    lean: vi.fn().mockResolvedValue(value),
  });
};

describe('productTools.service', () => {
  beforeEach(() => {
    Product.find.mockReset();
    Product.bulkWrite.mockReset();
  });

  it('fills missing average cost from retail price in one bulk write', async () => {
    const matchedProducts = [
      {
        id: 'p1',
        code: 'P1',
        name: 'Sản phẩm 1',
        avgCost: 0,
        sellPriceDefault: 100,
      },
      {
        id: 'p2',
        code: 'P2',
        name: 'Sản phẩm 2',
        avgCost: null,
        sellPriceDefault: 200,
      },
    ];
    mockFindLean(matchedProducts);
    Product.bulkWrite.mockResolvedValue({ matchedCount: 2, modifiedCount: 2 });

    const result = await fillMissingAvgCostFromRetail({
      ids: ['p1', 'p2', 'already-has-cost'],
    });

    expect(Product.find).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        id: { $in: ['p1', 'p2', 'already-has-cost'] },
        sellPriceDefault: { $gt: 0 },
      }),
      expect.any(Object)
    );
    expect(Product.bulkWrite).toHaveBeenCalledTimes(1);
    expect(Product.bulkWrite).toHaveBeenCalledWith(
      [
        {
          updateOne: {
            filter: { id: 'p1' },
            update: { $set: { avgCost: 100 } },
          },
        },
        {
          updateOne: {
            filter: { id: 'p2' },
            update: { $set: { avgCost: 200 } },
          },
        },
      ],
      { ordered: false }
    );
    expect(result).toMatchObject({
      updatedCount: 2,
      matchedCount: 2,
      skippedCount: 1,
    });
    expect(result.updatedIds).toEqual(['p1', 'p2']);
  });
});

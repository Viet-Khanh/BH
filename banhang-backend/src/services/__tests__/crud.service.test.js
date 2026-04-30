import { describe, expect, it, vi } from 'vitest';
import {
  bulkCreateItems,
  findDuplicateNamesInPayload,
  findExistingProductNameConflicts,
  normalizeProductName,
  updateItem,
} from '../crud.service.js';

const createQuery = (value) => ({
  lean: vi.fn().mockResolvedValue(value),
});

const createProductModel = ({
  existing,
  duplicateProducts = [],
  inserted = [],
  updated,
}) => ({
  modelName: 'Product',
  insertMany: vi.fn().mockResolvedValue(inserted),
  findOne: vi.fn().mockReturnValue(createQuery(existing)),
  find: vi.fn().mockReturnValue(createQuery(duplicateProducts)),
  findOneAndUpdate: vi.fn().mockReturnValue(createQuery(updated)),
});

describe('crud.service updateItem', () => {
  it('does not upsert a missing product on update', async () => {
    const ProductModel = createProductModel({ existing: null });

    await expect(
      updateItem(ProductModel, 'missing-product', { openingStock: 5 })
    ).rejects.toThrow('Không tìm thấy sản phẩm.');

    expect(ProductModel.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it('adjusts current stock when product opening stock changes', async () => {
    const ProductModel = createProductModel({
      existing: {
        id: 'p1',
        name: 'Hàng A',
        openingStock: 10,
        stock: 13,
      },
      updated: {
        id: 'p1',
        name: 'Hàng A',
        openingStock: 15,
        stock: 18,
      },
    });

    await updateItem(ProductModel, 'p1', {
      name: 'Hàng A',
      openingStock: 15,
    });

    expect(ProductModel.findOneAndUpdate).toHaveBeenCalledWith(
      { id: 'p1' },
      {
        $set: expect.objectContaining({
          id: 'p1',
          openingStock: 15,
          stock: 18,
          stockUpdatedAt: expect.any(String),
        }),
      },
      { new: true, upsert: false }
    );
  });
});

describe('crud.service product duplicate checks', () => {
  it('allows products whose names differ by a parenthetical pack size', async () => {
    const packName = 'Trần Nano MV 901-3A (12 Tấm)';
    const singleName = 'Trần Nano MV 901-3A';

    expect(normalizeProductName(packName)).not.toBe(
      normalizeProductName(singleName)
    );
    expect(
      findDuplicateNamesInPayload([{ name: packName }, { name: singleName }])
    ).toEqual([]);

    const ProductModel = createProductModel({
      duplicateProducts: [{ id: 'p1', name: packName }],
    });

    await expect(
      findExistingProductNameConflicts(ProductModel, [{ name: singleName }])
    ).resolves.toEqual([]);
  });

  it('skips existing products in bulk import without blocking new products', async () => {
    const existingProduct = {
      id: 'p1',
      name: 'Trần Nano MV 901-3A',
    };
    const newPackProduct = {
      id: 'p2',
      name: 'Trần Nano MV 901-3A (12 Tấm)',
    };
    const ProductModel = createProductModel({
      duplicateProducts: [existingProduct],
      inserted: [newPackProduct],
    });

    const result = await bulkCreateItems(ProductModel, [
      existingProduct,
      newPackProduct,
    ]);

    expect(ProductModel.insertMany).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          id: 'p2',
          name: 'Trần Nano MV 901-3A (12 Tấm)',
        }),
      ],
      { ordered: false }
    );
    expect(result).toEqual([newPackProduct]);
  });
});

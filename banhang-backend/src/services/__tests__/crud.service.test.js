import { describe, expect, it, vi } from 'vitest';
import { updateItem } from '../crud.service.js';

const createQuery = (value) => ({
  lean: vi.fn().mockResolvedValue(value),
});

const createProductModel = ({ existing, duplicateProducts = [], updated }) => ({
  modelName: 'Product',
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

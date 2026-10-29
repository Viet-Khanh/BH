import { describe, expect, it, vi } from 'vitest';

const productModel = vi.hoisted(() => ({ find: vi.fn() }));
vi.mock('../../models/Product.js', () => ({ default: productModel }));

const { resolveItemUnits } = await import('../itemUnits.service.js');

const mockProducts = (products) =>
  productModel.find.mockReturnValue({
    lean: vi.fn().mockResolvedValue(products),
  });

describe('resolveItemUnits', () => {
  it('does not query products when no line has a unit', async () => {
    productModel.find.mockReset();
    const items = [{ productId: 'p1', qty: 1 }];
    expect(await resolveItemUnits(items)).toBe(items);
    expect(productModel.find).not.toHaveBeenCalled();
  });

  it('fills the factor of packaging-unit lines', async () => {
    mockProducts([
      {
        id: 'p1',
        name: 'Coca',
        unit: 'lon',
        units: [{ name: 'thùng', factor: 24 }],
      },
    ]);
    expect(
      await resolveItemUnits([
        { productId: 'p1', qty: 1, unitName: 'thùng' },
        { productId: 'p1', qty: 2, unitName: 'lon', factor: 1 },
      ])
    ).toEqual([
      { productId: 'p1', qty: 1, unitName: 'thùng', factor: 24 },
      { productId: 'p1', qty: 2 },
    ]);
  });

  it('rejects unknown units', async () => {
    mockProducts([{ id: 'p1', name: 'Coca', unit: 'lon', units: [] }]);
    await expect(
      resolveItemUnits([{ productId: 'p1', qty: 1, unitName: 'két' }])
    ).rejects.toThrow('Đơn vị "két" không có trong hàng Coca.');
  });
});

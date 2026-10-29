import { beforeEach, describe, expect, it, vi } from 'vitest';

const productModel = vi.hoisted(() => ({ find: vi.fn(), bulkWrite: vi.fn() }));
const settingsModel = vi.hoisted(() => ({ findOne: vi.fn() }));
vi.mock('../../models/Product.js', () => ({ default: productModel }));
vi.mock('../../models/Settings.js', () => ({ default: settingsModel }));

const {
  bulkCreateItems,
  createItem,
  deleteItem,
  findDuplicateNamesInPayload,
  findExistingProductNameConflicts,
  normalizeProductName,
  updateItem,
} = await import('../crud.service.js');

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
  create: vi.fn().mockImplementation(async (doc) => doc),
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

describe('crud.service product units', () => {
  it('normalizes units on create', async () => {
    const ProductModel = createProductModel({ existing: null });
    const created = await createItem(ProductModel, {
      name: 'Coca',
      unit: 'lon',
      units: [{ name: ' thùng ', factor: '24', sellPrice: '' }],
    });
    expect(created.units).toEqual([
      { name: 'thùng', factor: 24, sellPrice: null },
    ]);
  });

  it('rejects invalid units on create and update', async () => {
    const ProductModel = createProductModel({
      existing: { id: 'p1', name: 'Coca', unit: 'lon' },
    });
    await expect(
      createItem(ProductModel, {
        name: 'Coca 2',
        unit: 'lon',
        units: [{ name: 'thùng', factor: 1 }],
      })
    ).rejects.toThrow('Hệ số quy đổi của "thùng" phải lớn hơn 1.');
    await expect(
      updateItem(ProductModel, 'p1', { units: [{ name: 'lon', factor: 6 }] })
    ).rejects.toThrow('Đơn vị quy đổi "lon" trùng đơn vị cơ bản.');
  });

  it('rejects unit errors with HTTP status 400', async () => {
    const ProductModel = createProductModel({ existing: null });
    await expect(
      createItem(ProductModel, {
        name: 'Coca',
        unit: 'lon',
        units: [{ name: '', factor: 24 }],
      })
    ).rejects.toMatchObject({
      message: 'Đơn vị quy đổi thiếu tên.',
      status: 400,
    });
  });

  it('validates the existing units when only the base unit changes', async () => {
    const ProductModel = createProductModel({
      existing: {
        id: 'p1',
        name: 'Coca',
        unit: 'lon',
        units: [{ name: 'thùng', factor: 24, sellPrice: null }],
      },
      updated: { id: 'p1' },
    });
    await expect(
      updateItem(ProductModel, 'p1', { unit: 'Thùng' })
    ).rejects.toThrow('Đơn vị quy đổi "thùng" trùng đơn vị cơ bản.');
    await updateItem(ProductModel, 'p1', { unit: 'chai' });
    expect(ProductModel.findOneAndUpdate).toHaveBeenCalledWith(
      { id: 'p1' },
      { $set: { unit: 'chai', id: 'p1' } },
      expect.any(Object)
    );
  });

  it('validates units against the new base unit when both change', async () => {
    const ProductModel = createProductModel({
      existing: { id: 'p1', name: 'Coca', unit: 'lon' },
      updated: { id: 'p1' },
    });
    await updateItem(ProductModel, 'p1', {
      unit: 'chai',
      units: [{ name: 'lon', factor: 2 }],
    });
    expect(ProductModel.findOneAndUpdate).toHaveBeenCalledWith(
      { id: 'p1' },
      {
        $set: expect.objectContaining({
          units: [{ name: 'lon', factor: 2, sellPrice: null }],
        }),
      },
      expect.any(Object)
    );
  });
});

describe('crud.service product barcodes', () => {
  const bia = { id: 'p9', name: 'Bia', barcode: 'A1' };

  it('trims the barcode and rejects one used by another product on create', async () => {
    const ProductModel = createProductModel({ existing: null });
    const created = await createItem(ProductModel, {
      name: 'Coca',
      barcode: ' 893 ',
    });
    expect(created.barcode).toBe('893');
    expect(created.id).toBeTruthy();
    const Taken = createProductModel({
      existing: null,
      duplicateProducts: [bia],
    });
    await expect(
      createItem(Taken, { name: 'Coca', barcode: 'A1' })
    ).rejects.toMatchObject({
      message: 'Mã vạch A1 đã dùng cho hàng Bia.',
      status: 400,
    });
    expect(Taken.create).not.toHaveBeenCalled();
  });

  it('rejects a barcode repeated inside a bulk payload', async () => {
    const ProductModel = createProductModel({ existing: null });
    await expect(
      bulkCreateItems(ProductModel, [
        { name: 'Coca', barcode: 'A1' },
        {
          name: 'Pepsi',
          units: [{ name: 'thùng', factor: 24, barcode: 'A1' }],
        },
      ])
    ).rejects.toThrow('Mã vạch A1 đã dùng cho hàng Coca.');
    expect(ProductModel.insertMany).not.toHaveBeenCalled();
  });

  it('keeps a cleared barcode and checks unit barcodes on update', async () => {
    const ProductModel = createProductModel({
      existing: { id: 'p1', name: 'Coca', unit: 'lon', barcode: 'OLD' },
      duplicateProducts: [bia],
      updated: { id: 'p1' },
    });
    await updateItem(ProductModel, 'p1', { barcode: '  ' });
    expect(ProductModel.findOneAndUpdate).toHaveBeenCalledWith(
      { id: 'p1' },
      { $set: { barcode: '', id: 'p1' } },
      expect.any(Object)
    );
    await expect(
      updateItem(ProductModel, 'p1', {
        units: [{ name: 'thùng', factor: 24, barcode: 'A1' }],
      })
    ).rejects.toThrow('Mã vạch A1 đã dùng cho hàng Bia.');
  });
});

describe('crud.service delete purchase with packaging units', () => {
  const purchase = {
    id: 'po1',
    appliedToStock: true,
    items: [
      { productId: 'p1', qty: 2, unitName: 'thùng', factor: 24 },
      { productId: 'p1', qty: 3 },
    ],
  };
  const createPurchaseModel = () => ({
    modelName: 'Purchase',
    findOne: vi.fn().mockReturnValue(createQuery(purchase)),
    findOneAndUpdate: vi.fn().mockReturnValue(createQuery({ id: 'po1' })),
  });
  const mockStock = (stock) =>
    productModel.find.mockReturnValue(
      createQuery([{ id: 'p1', name: 'Coca', stock }])
    );

  beforeEach(() => {
    productModel.find.mockReset();
    productModel.bulkWrite.mockReset().mockResolvedValue({});
    settingsModel.findOne.mockReturnValue(createQuery({ dataVersion: 2 }));
  });

  it('reverts stock and opening stock in base units', async () => {
    mockStock(100);
    const PurchaseModel = createPurchaseModel();
    await deleteItem(PurchaseModel, 'po1');
    expect(productModel.bulkWrite).toHaveBeenNthCalledWith(
      1,
      [
        {
          updateOne: {
            filter: { id: 'p1' },
            update: {
              $inc: { stock: -51 },
              $set: { stockUpdatedAt: expect.any(String) },
            },
          },
        },
      ],
      { ordered: true }
    );
    expect(productModel.bulkWrite).toHaveBeenNthCalledWith(
      2,
      [
        {
          updateOne: {
            filter: { id: 'p1' },
            update: { $inc: { openingStock: -51 } },
          },
        },
      ],
      { ordered: true }
    );
    expect(PurchaseModel.findOneAndUpdate).toHaveBeenCalled();
  });

  it('rejects when stock in base units would go negative', async () => {
    mockStock(50);
    const PurchaseModel = createPurchaseModel();
    await expect(deleteItem(PurchaseModel, 'po1')).rejects.toThrow(
      'Không đủ tồn kho cho sản phẩm Coca.'
    );
    expect(productModel.bulkWrite).not.toHaveBeenCalled();
    expect(PurchaseModel.findOneAndUpdate).not.toHaveBeenCalled();
  });
});

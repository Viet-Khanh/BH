import { describe, expect, it, vi } from 'vitest';
import {
  assertBarcodesAvailable,
  collectBarcodes,
  normalizeProductBarcode,
} from '../productBarcodes.service.js';

const modelWith = (records) => ({
  find: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue(records) }),
});

describe('product barcodes', () => {
  it('normalizes the product barcode', () => {
    expect(normalizeProductBarcode({ barcode: ' 893 ' })).toEqual({
      barcode: '893',
    });
    expect(normalizeProductBarcode({ barcode: '' })).toEqual({});
    expect(normalizeProductBarcode({ name: 'x' })).toEqual({ name: 'x' });
  });

  it('collects product and unit barcodes', () => {
    expect(
      collectBarcodes({
        barcode: 'A1',
        units: [{ barcode: 'B2' }, { name: 'lốc' }],
      })
    ).toEqual(['A1', 'B2']);
  });

  it('rejects duplicates inside one product', async () => {
    await expect(
      assertBarcodesAvailable(modelWith([]), [
        { id: 'p1', barcode: 'A1', units: [{ name: 'thùng', barcode: 'A1' }] },
      ])
    ).rejects.toMatchObject({
      message: 'Mã vạch A1 bị trùng trong cùng hàng.',
      status: 400,
    });
  });

  it('rejects duplicates inside a bulk payload', async () => {
    await expect(
      assertBarcodesAvailable(modelWith([]), [
        { id: 'p1', name: 'Coca', barcode: 'A1' },
        { id: 'p2', name: 'Pepsi', units: [{ name: 'thùng', barcode: 'A1' }] },
      ])
    ).rejects.toThrow('Mã vạch A1 đã dùng cho hàng Coca.');
  });

  it('rejects barcodes used by another product', async () => {
    const Model = modelWith([
      {
        id: 'p9',
        name: 'Bia',
        barcode: 'X',
        units: [{ name: 'thùng', barcode: 'A1' }],
      },
    ]);
    await expect(
      assertBarcodesAvailable(Model, [{ id: 'p1', barcode: 'A1' }])
    ).rejects.toThrow('Mã vạch A1 đã dùng cho hàng Bia.');
    expect(Model.find).toHaveBeenCalledWith({
      isDeleted: { $ne: true },
      $or: [{ barcode: { $in: ['A1'] } }, { 'units.barcode': { $in: ['A1'] } }],
    });
  });

  it('ignores the product being updated and skips the query without codes', async () => {
    const Model = modelWith([{ id: 'p1', name: 'Coca', barcode: 'A1' }]);
    await expect(
      assertBarcodesAvailable(Model, [{ id: 'p1', barcode: 'A1' }])
    ).resolves.toBeUndefined();
    const Empty = modelWith([]);
    await assertBarcodesAvailable(Empty, [{ id: 'p1' }]);
    expect(Empty.find).not.toHaveBeenCalled();
  });
});

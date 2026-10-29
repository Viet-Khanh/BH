import { describe, expect, it, vi } from 'vitest';
import {
  assertCodesAvailable,
  buildUpdateCodeCheck,
  getNextProductCode,
} from '../productCodes.service.js';

const modelWith = (records) => ({
  find: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue(records) }),
});

describe('getNextProductCode', () => {
  it('counts every product, deleted included', async () => {
    const Model = modelWith([
      { code: 'SP000007' },
      { code: 'SP000012', isDeleted: true },
      { code: 'CL3' },
    ]);
    await expect(getNextProductCode({}, Model)).resolves.toEqual({
      code: 'SP000013',
    });
    expect(Model.find).toHaveBeenCalledWith({}, { code: 1 });
  });

  it('accepts a prefix and digits from the query', async () => {
    const Model = modelWith([{ code: 'HH0009' }]);
    await expect(
      getNextProductCode({ prefix: 'HH', digits: '4' }, Model)
    ).resolves.toEqual({ code: 'HH0010' });
  });

  it('rejects an invalid prefix or digits with status 400', async () => {
    const Model = modelWith([]);
    for (const query of [
      { prefix: 'S1' },
      { prefix: 'ABCDEF' },
      { digits: '2' },
      { digits: '11' },
      { digits: 'x' },
    ]) {
      await expect(getNextProductCode(query, Model)).rejects.toMatchObject({
        status: 400,
      });
    }
    expect(Model.find).not.toHaveBeenCalled();
  });
});

describe('assertCodesAvailable', () => {
  const bia = {
    id: 'p9',
    name: 'Bia',
    code: 'BIA1',
    barcode: '893',
    units: [{ name: 'thùng', barcode: '894' }],
  };

  it('skips the query without codes or barcodes', async () => {
    const Model = modelWith([bia]);
    await assertCodesAvailable(Model, [{ id: 'p1', code: '  ' }]);
    expect(Model.find).not.toHaveBeenCalled();
  });

  it('rejects a code used by another active product, case-insensitively', async () => {
    const Model = modelWith([bia]);
    await expect(
      assertCodesAvailable(Model, [{ id: 'p1', name: 'Coca', code: ' bia1 ' }])
    ).rejects.toMatchObject({
      message: 'Mã hàng bia1 đã dùng cho hàng Bia.',
      status: 400,
    });
    expect(Model.find).toHaveBeenCalledWith(
      { isDeleted: { $ne: true } },
      { id: 1, name: 1, code: 1, barcode: 1, units: 1 }
    );
  });

  it('rejects a code equal to another product barcode or unit barcode', async () => {
    const Model = modelWith([bia]);
    await expect(
      assertCodesAvailable(Model, [{ id: 'p1', code: '893' }])
    ).rejects.toThrow('Mã hàng 893 đã dùng cho hàng Bia.');
    await expect(
      assertCodesAvailable(Model, [{ id: 'p1', code: '894' }])
    ).rejects.toThrow('Mã hàng 894 đã dùng cho hàng Bia.');
  });

  it('rejects a barcode equal to another product code', async () => {
    const Model = modelWith([bia]);
    await expect(
      assertCodesAvailable(Model, [
        { id: 'p1', units: [{ name: 'lốc', barcode: 'Bia1' }] },
      ])
    ).rejects.toMatchObject({
      message: 'Mã vạch Bia1 trùng mã hàng của Bia.',
      status: 400,
    });
  });

  it('ignores the product itself', async () => {
    const Model = modelWith([bia]);
    await expect(
      assertCodesAvailable(Model, [
        { id: 'p9', name: 'Bia', code: 'BIA1', barcode: 'BIA1' },
      ])
    ).resolves.toBeUndefined();
  });

  it('rejects codes repeated inside one payload', async () => {
    const Model = modelWith([]);
    await expect(
      assertCodesAvailable(Model, [
        { id: 'p1', name: 'Coca', code: 'CL3' },
        { id: 'p2', name: 'Cà lốc', code: 'cl3' },
      ])
    ).rejects.toThrow('Mã hàng cl3 đã dùng cho hàng Coca.');
    await expect(
      assertCodesAvailable(Model, [
        { id: 'p1', name: 'Coca', barcode: 'X1' },
        { id: 'p2', name: 'Pepsi', code: 'X1' },
      ])
    ).rejects.toThrow('Mã hàng X1 đã dùng cho hàng Coca.');
  });
});

describe('buildUpdateCodeCheck', () => {
  const existing = { name: 'Coca', code: 'CL3', barcode: 'A', units: [] };

  it('checks the code only when it changes', () => {
    expect(buildUpdateCodeCheck('p1', { code: 'cl3' }, existing)).toEqual({
      id: 'p1',
      name: 'Coca',
    });
    expect(buildUpdateCodeCheck('p1', { code: 'SP1' }, existing)).toEqual({
      id: 'p1',
      name: 'Coca',
      code: 'SP1',
    });
  });

  it('checks barcodes only when they are in the payload', () => {
    expect(
      buildUpdateCodeCheck('p1', { name: 'Coca 2', barcode: 'B' }, existing)
    ).toEqual({ id: 'p1', name: 'Coca 2', barcode: 'B', units: [] });
  });
});

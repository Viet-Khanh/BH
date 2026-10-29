import { beforeEach, describe, expect, it, vi } from 'vitest';

const repo = vi.hoisted(() => ({
  findProducts: vi.fn(),
  findMainSettings: vi.fn(),
  findPurchases: vi.fn(),
  findInvoices: vi.fn(),
}));
vi.mock('../../repositories/sales.repository.js', () => repo);

const { getProductsForSales } = await import('../sales.service.js');

const product = (id, extra = {}) => ({ id, name: id, stock: 1, ...extra });
const isExactQuery = (filter) => Array.isArray(filter.$or);

describe('getProductsForSales exact match priority', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repo.findMainSettings.mockResolvedValue({ dataVersion: 2 });
  });

  it('puts exact barcode/code matches first and dedupes them', async () => {
    const exact = product('p9', { barcode: '8934588012345' });
    repo.findProducts.mockImplementation(async (filter) =>
      isExactQuery(filter) ? [exact] : [product('p1'), exact, product('p2')]
    );
    const result = await getProductsForSales({
      search: ' 8934588012345 ',
      limit: 3,
    });
    expect(result.map((item) => item.id)).toEqual(['p9', 'p1', 'p2']);
    const exactCall = repo.findProducts.mock.calls.find(([filter]) =>
      isExactQuery(filter)
    );
    expect(exactCall[0]).toEqual({
      isDeleted: { $ne: true },
      $or: [
        { barcode: '8934588012345' },
        { 'units.barcode': '8934588012345' },
        { code: '8934588012345' },
      ],
    });
  });

  it('keeps the exact match when the regex page is full', async () => {
    const exact = product('p9', { code: 'COCA' });
    const page = Array.from({ length: 30 }, (_, index) => product(`r${index}`));
    repo.findProducts.mockImplementation(async (filter) =>
      isExactQuery(filter) ? [exact] : page
    );
    const result = await getProductsForSales({ search: 'COCA' });
    expect(result).toHaveLength(30);
    expect(result[0].id).toBe('p9');
  });

  it('skips the exact query for empty or multi-word searches', async () => {
    repo.findProducts.mockResolvedValue([product('p1')]);
    await getProductsForSales({ search: '' });
    await getProductsForSales({ search: 'coca lon' });
    expect(repo.findProducts).toHaveBeenCalledTimes(2);
    repo.findProducts.mock.calls.forEach(([filter]) =>
      expect(isExactQuery(filter)).toBe(false)
    );
  });
});

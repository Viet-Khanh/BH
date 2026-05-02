import { beforeEach, describe, expect, it, vi } from 'vitest';

const repository = vi.hoisted(() => ({
  createPurchaseDoc: vi.fn(),
  findInvoices: vi.fn(),
  findPayments: vi.fn(),
  findProductsByIds: vi.fn(),
  findPurchaseById: vi.fn(),
  findPurchases: vi.fn(),
  findSupplierById: vi.fn(),
  findSuppliersByIds: vi.fn(),
  updateProductById: vi.fn(),
  updatePurchaseDoc: vi.fn(),
}));

const settingsModel = vi.hoisted(() => ({
  findOne: vi.fn(),
}));

vi.mock('../../repositories/purchases.repository.js', () => repository);
vi.mock('../../../../models/Settings.js', () => ({ default: settingsModel }));

const { createPurchase, updatePurchase } =
  await import('../purchases.service.js');

const mockSnapshotReady = (settings = {}) => {
  settingsModel.findOne.mockReturnValue({
    lean: vi.fn().mockResolvedValue({ dataVersion: 2, ...settings }),
  });
};

const originalProduct = {
  id: 'p1',
  openingStock: 10,
  stock: 8,
  stockUpdatedAt: 'old-stock-time',
  avgCost: 7,
};

describe('purchases.service snapshot rollback', () => {
  beforeEach(() => {
    Object.values(repository).forEach((mock) => mock.mockReset());
    settingsModel.findOne.mockReset();
    mockSnapshotReady();
    repository.updateProductById.mockResolvedValue({ id: 'p1' });
    repository.findPurchases.mockResolvedValue([]);
    repository.findInvoices.mockResolvedValue([]);
  });

  it('restores product stock when updating a purchase fails after product update', async () => {
    repository.findPurchaseById.mockResolvedValue({
      id: 'po1',
      supplierId: 's1',
      appliedToStock: true,
      items: [{ productId: 'p1', qty: 2, unitCost: 5 }],
    });
    repository.findProductsByIds.mockResolvedValue([originalProduct]);
    repository.updatePurchaseDoc.mockRejectedValue(new Error('write failed'));

    await expect(
      updatePurchase('po1', {
        supplierId: 's1',
        items: [{ productId: 'p1', qty: 5, unitCost: 10 }],
      })
    ).rejects.toThrow('write failed');

    expect(repository.updateProductById).toHaveBeenNthCalledWith(
      1,
      'p1',
      expect.objectContaining({
        openingStock: 13,
        stock: 11,
        stockUpdatedAt: expect.any(String),
        avgCost: 8,
      })
    );
    expect(repository.updateProductById).toHaveBeenNthCalledWith(2, 'p1', {
      openingStock: 10,
      stock: 8,
      stockUpdatedAt: 'old-stock-time',
      avgCost: 7,
    });
  });

  it('recalculates product average cost when purchase unit cost changes', async () => {
    repository.findPurchaseById.mockResolvedValue({
      id: 'po1',
      supplierId: 's1',
      appliedToStock: true,
      items: [{ productId: 'p1', qty: 2, unitCost: 5 }],
    });
    repository.findProductsByIds.mockResolvedValue([originalProduct]);
    repository.updatePurchaseDoc.mockResolvedValue({
      id: 'po1',
      supplierId: 's1',
      items: [{ productId: 'p1', qty: 2, unitCost: 20 }],
    });

    await updatePurchase('po1', {
      supplierId: 's1',
      items: [{ productId: 'p1', qty: 2, unitCost: 20 }],
    });

    expect(repository.updateProductById).toHaveBeenCalledTimes(1);
    expect(repository.updateProductById).toHaveBeenCalledWith('p1', {
      avgCost: 10,
    });
  });

  it('does not update product average cost when purchase setting is disabled', async () => {
    mockSnapshotReady({ autoUpdateAvgCostOnPurchase: false });
    repository.findPurchaseById.mockResolvedValue({
      id: 'po1',
      supplierId: 's1',
      appliedToStock: true,
      items: [{ productId: 'p1', qty: 2, unitCost: 5 }],
    });
    repository.findProductsByIds.mockResolvedValue([originalProduct]);
    repository.updatePurchaseDoc.mockResolvedValue({
      id: 'po1',
      supplierId: 's1',
      items: [{ productId: 'p1', qty: 5, unitCost: 20 }],
    });

    await updatePurchase('po1', {
      supplierId: 's1',
      items: [{ productId: 'p1', qty: 5, unitCost: 20 }],
    });

    expect(repository.updateProductById).toHaveBeenCalledTimes(1);
    const [, fields] = repository.updateProductById.mock.calls[0];
    expect(fields).toEqual(
      expect.objectContaining({
        openingStock: 13,
        stock: 11,
        stockUpdatedAt: expect.any(String),
      })
    );
    expect(fields).not.toHaveProperty('avgCost');
  });

  it('restores product stock when creating a purchase fails after product update', async () => {
    repository.findProductsByIds.mockResolvedValue([originalProduct]);
    repository.findPurchases.mockResolvedValue([]);
    repository.findInvoices.mockResolvedValue([]);
    repository.createPurchaseDoc.mockRejectedValue(new Error('insert failed'));

    await expect(
      createPurchase({
        supplierId: 's1',
        items: [{ productId: 'p1', qty: 4, unitCost: 20 }],
      })
    ).rejects.toThrow('insert failed');

    expect(repository.updateProductById).toHaveBeenNthCalledWith(
      1,
      'p1',
      expect.objectContaining({
        openingStock: 14,
        stock: 12,
        stockUpdatedAt: expect.any(String),
      })
    );
    expect(repository.updateProductById).toHaveBeenNthCalledWith(2, 'p1', {
      openingStock: 10,
      stock: 8,
      stockUpdatedAt: 'old-stock-time',
      avgCost: 7,
    });
  });

  it('does not update product average cost on create when purchase setting is disabled', async () => {
    mockSnapshotReady({ autoUpdateAvgCostOnPurchase: false });
    repository.findProductsByIds.mockResolvedValue([originalProduct]);
    repository.createPurchaseDoc.mockResolvedValue({
      id: 'po1',
      supplierId: 's1',
      items: [{ productId: 'p1', qty: 4, unitCost: 20 }],
    });

    await createPurchase({
      supplierId: 's1',
      items: [{ productId: 'p1', qty: 4, unitCost: 20 }],
    });

    expect(repository.updateProductById).toHaveBeenCalledTimes(1);
    const [, fields] = repository.updateProductById.mock.calls[0];
    expect(fields).toEqual(
      expect.objectContaining({
        openingStock: 14,
        stock: 12,
        stockUpdatedAt: expect.any(String),
      })
    );
    expect(fields).not.toHaveProperty('avgCost');
  });
});

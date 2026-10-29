import request from 'supertest';
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
  findOne: () => ({ lean: async () => ({ dataVersion: 2 }) }),
}));

vi.mock('../../repositories/purchases.repository.js', () => repository);
vi.mock('../../../../models/Settings.js', () => ({ default: settingsModel }));

const { createApp } = await import('../../../../app.js');

const app = createApp({ shouldServeFrontend: false });
const product = { id: 'p1', name: 'Coca', unit: 'lon', units: [] };
const body = {
  supplierId: 's1',
  items: [{ productId: 'p1', qty: 1, unitCost: 5, unitName: 'két' }],
};

describe('purchases controller unit errors', () => {
  beforeEach(() => {
    Object.values(repository).forEach((mock) => mock.mockReset());
    repository.findProductsByIds.mockResolvedValue([product]);
    repository.findPurchaseById.mockResolvedValue({
      id: 'po1',
      supplierId: 's1',
      items: [],
    });
  });

  it('returns 400 for an unknown unit on create and update', async () => {
    const message = 'Đơn vị "két" không có trong hàng Coca.';
    const created = await request(app).post('/api/purchases-tools').send(body);
    expect(created.status).toBe(400);
    expect(created.body).toEqual({ message });

    const updated = await request(app)
      .put('/api/purchases-tools/po1')
      .send(body);
    expect(updated.status).toBe(400);
    expect(updated.body).toEqual({ message });
  });
});

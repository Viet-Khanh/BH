import { describe, expect, it } from 'vitest';
import { getTodayDashboard } from '../dashboard.service.js';

const createRepository = ({
  customers = [],
  invoices = [],
  payments = [],
  products = [],
  purchases = [],
  settings = { lowStockThreshold: 0 },
} = {}) => ({
  findActiveCustomers: async () => customers,
  findActiveInvoices: async () => invoices,
  findActivePayments: async () => payments,
  findActivePaymentsByInvoiceIds: async (invoiceIds) =>
    payments.filter((payment) => invoiceIds.includes(payment.invoiceId)),
  findActiveProducts: async () => products,
  findActivePurchases: async () => purchases,
  findMainSettings: async () => settings,
  findDebtorCustomers: async () =>
    customers.filter((customer) => Number(customer.currentDebt || 0) > 0),
  findLowStockProducts: async (threshold) =>
    products.filter((product) => Number(product.stock || 0) <= threshold),
});

const fixedNow = () => new Date('2026-04-21T10:00:00.000+07:00');

describe('dashboard.service', () => {
  it('returns empty dashboard values when there is no data', async () => {
    const result = await getTodayDashboard(
      { now: fixedNow },
      { repository: createRepository() }
    );

    expect(result.salesToday).toEqual({
      invoiceCount: 0,
      amount: 0,
      paid: 0,
      remain: 0,
    });
    expect(result.debt).toEqual({
      totalDebt: 0,
      debtorCount: 0,
      topCustomers: [],
    });
    expect(result.stock).toEqual({
      lowStockCount: 0,
      threshold: 0,
      topProducts: [],
    });
    expect(result.generatedAt).toBe('2026-04-21T03:00:00.000Z');
  });

  it('computes today sales, customer debt, and low stock correctly', async () => {
    const repository = createRepository({
      customers: [
        { id: 'c1', name: 'Khách A', phone: '0901' },
        { id: 'c2', name: 'Khách B', phone: '0902' },
      ],
      invoices: [
        {
          id: 'i1',
          customerId: 'c1',
          date: '2026-04-21T08:00:00.000+07:00',
          total: 1000,
          items: [{ productId: 'p1', qty: 2 }],
        },
        {
          id: 'i2',
          customerId: 'c2',
          date: '2026-04-21T12:00:00.000+07:00',
          total: 500,
          items: [],
        },
        {
          id: 'i3',
          customerId: 'c1',
          date: '2026-04-20T09:00:00.000+07:00',
          total: 2000,
          items: [{ productId: 'p2', qty: 1 }],
        },
        {
          id: 'deleted',
          customerId: 'c1',
          date: '2026-04-21T09:00:00.000+07:00',
          total: 999,
          isDeleted: true,
          items: [],
        },
      ],
      payments: [
        { id: 'pmt1', invoiceId: 'i1', amount: 400 },
        { id: 'pmt2', invoiceId: 'i2', amount: 500 },
        { id: 'pmt3', invoiceId: 'i3', amount: 1000 },
        {
          id: 'debt1',
          customerId: 'c1',
          paymentType: 'debt_receipt',
          amount: 300,
        },
        {
          id: 'debt2',
          customerId: 'c2',
          paymentType: 'debt_receipt',
          amount: 50,
        },
        {
          id: 'deleted-payment',
          invoiceId: 'i1',
          amount: 999,
          isDeleted: true,
        },
      ],
      products: [
        {
          id: 'p1',
          code: 'P1',
          name: 'Hàng thấp',
          unit: 'cái',
          openingStock: 3,
        },
        {
          id: 'p2',
          code: 'P2',
          name: 'Hàng đủ',
          unit: 'cái',
          openingStock: 10,
        },
        {
          id: 'p3',
          code: 'P3',
          name: 'Đã xóa',
          unit: 'cái',
          openingStock: 0,
          isDeleted: true,
        },
      ],
      purchases: [
        {
          id: 'pur1',
          appliedToStock: false,
          items: [{ productId: 'p1', qty: 1 }],
        },
        {
          id: 'pur2',
          appliedToStock: true,
          items: [{ productId: 'p1', qty: 5 }],
        },
      ],
      settings: { lowStockThreshold: 2 },
    });

    const result = await getTodayDashboard({ now: fixedNow }, { repository });

    expect(result.salesToday).toEqual({
      invoiceCount: 2,
      amount: 1500,
      paid: 900,
      remain: 600,
    });
    expect(result.debt.totalDebt).toBe(1300);
    expect(result.debt.debtorCount).toBe(1);
    expect(result.debt.topCustomers).toEqual([
      { customerId: 'c1', name: 'Khách A', phone: '0901', debt: 1300 },
    ]);
    expect(result.stock.lowStockCount).toBe(1);
    expect(result.stock.threshold).toBe(2);
    expect(result.stock.topProducts).toEqual([
      { productId: 'p1', code: 'P1', name: 'Hàng thấp', unit: 'cái', stock: 2 },
    ]);
  });

  it('uses debt and stock snapshots when data version is ready', async () => {
    const repository = createRepository({
      customers: [
        { id: 'c1', name: 'Khách snapshot', currentDebt: 900 },
        { id: 'c2', name: 'Không nợ', currentDebt: 0 },
      ],
      invoices: [
        {
          id: 'i1',
          customerId: 'c1',
          date: '2026-04-21T08:00:00.000+07:00',
          total: 100,
        },
      ],
      payments: [{ id: 'p1', invoiceId: 'i1', amount: 40 }],
      products: [
        { id: 'p1', code: 'P1', name: 'Tồn snapshot', stock: 1 },
        { id: 'p2', code: 'P2', name: 'Tồn cao', stock: 10 },
      ],
      settings: { dataVersion: 2, lowStockThreshold: 2 },
    });

    const result = await getTodayDashboard({ now: fixedNow }, { repository });

    expect(result.salesToday).toEqual({
      invoiceCount: 1,
      amount: 100,
      paid: 40,
      remain: 60,
    });
    expect(result.debt.topCustomers).toEqual([
      { customerId: 'c1', name: 'Khách snapshot', phone: '', debt: 900 },
    ]);
    expect(result.stock.topProducts).toEqual([
      { productId: 'p1', code: 'P1', name: 'Tồn snapshot', unit: '', stock: 1 },
    ]);
  });
});

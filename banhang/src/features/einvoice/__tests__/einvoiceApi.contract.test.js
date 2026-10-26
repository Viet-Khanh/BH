import { beforeAll, describe, expect, it } from 'vitest';
import { dispatch } from '../../../demo/demoApp.js';
import {
  configureStorage,
  setActiveNamespace,
} from '../../../demo/db/localStore.js';
import { seedEdition } from '../../../demo/seed/seedEdition.js';
import { createMemoryStorage } from '../../../demo/__tests__/helpers/memoryStorage.js';

const RANGE = 'from=2000-01-01T00:00:00.000Z&to=2100-01-01T00:00:00.000Z';

const call = async (method, path, body) => {
  const { status, data } = await dispatch({
    method,
    path: `/api${path}`,
    body,
  });
  expect(status, `${method} ${path} -> ${data?.message}`).toBeLessThan(300);
  return data;
};

const documents = (status) =>
  call('GET', `/einvoice/documents?${RANGE}&status=${status}`);

const statusOf = async (invoiceId) => {
  const { items } = await documents('all');
  return items.find((item) => item.invoiceId === invoiceId);
};

describe('e-invoice API (in-browser backend)', () => {
  let first;
  let second;

  beforeAll(async () => {
    configureStorage(createMemoryStorage());
    setActiveNamespace('minimart');
    await seedEdition('minimart', { dispatch });
  }, 30000);

  it('blocks export until the seller tax code is set', async () => {
    const before = await documents('pending');
    expect(before.blocking).toHaveLength(1);
    await call('PUT', '/settings/main', { sellerTaxCode: '8012345678' });
    const after = await documents('pending');
    expect(after.blocking).toEqual([]);
    expect(after.items.length).toBeGreaterThan(10);
    [first, second] = after.items;
    expect(first.document.lines.length).toBeGreaterThan(0);
    expect(first.document.seller.taxCode).toBe('8012345678');
  });

  it('marks invoices as exported', async () => {
    const result = await call('POST', '/einvoice/mark-exported', {
      invoiceIds: [first.invoiceId, second.invoiceId],
      profile: 'generic',
    });
    expect(result.batchId).toMatch(/^EI-/);
    expect((await statusOf(first.invoiceId)).status).toBe('exported');
  });

  it('flags content edits but not payment changes', async () => {
    const invoice = await call('GET', `/invoices/${first.invoiceId}`);
    const items = invoice.items.map((item, index) =>
      index === 0 ? { ...item, lineNote: 'sửa sau khi xuất' } : item
    );
    // Clients send the whole invoice back; their stale `einvoice` must be ignored.
    await call('PUT', `/invoices/${first.invoiceId}`, {
      ...invoice,
      items,
      einvoice: { exportedAt: null },
    });
    expect((await statusOf(first.invoiceId)).status).toBe('changed');

    await call('PUT', `/invoices/${second.invoiceId}`, {
      paymentStatus: 'DA THU',
    });
    await call('POST', '/payments', {
      invoiceId: second.invoiceId,
      paymentType: 'invoice_payment',
      method: 'cash',
      amount: 1000,
      date: second.date,
    });
    expect((await statusOf(second.invoiceId)).status).toBe('exported');
  });

  it('keeps deleted exported invoices visible as changed', async () => {
    await call('DELETE', `/invoices/${second.invoiceId}`);
    const item = await statusOf(second.invoiceId);
    expect(item).toMatchObject({ status: 'changed', deleted: true });
  });

  it('stores provider numbers and unmarks', async () => {
    const einvoice = await call('PUT', `/einvoice/${first.invoiceId}/number`, {
      number: '0000123',
    });
    expect(einvoice.number).toBe('0000123');
    await call('POST', '/einvoice/unmark', { invoiceIds: [first.invoiceId] });
    expect((await statusOf(first.invoiceId)).status).toBe('pending');
  });

  it('rejects bad input with 400', async () => {
    const { status } = await dispatch({
      method: 'POST',
      path: '/api/einvoice/mark-exported',
      body: { invoiceIds: [] },
    });
    expect(status).toBe(400);
  });
});

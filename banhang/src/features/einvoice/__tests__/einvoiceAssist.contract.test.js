import { beforeAll, describe, expect, it } from 'vitest';
import { dispatch } from '../../../demo/demoApp.js';
import {
  configureStorage,
  setActiveNamespace,
} from '../../../demo/db/localStore.js';
import { seedEdition } from '../../../demo/seed/seedEdition.js';
import { createMemoryStorage } from '../../../demo/__tests__/helpers/memoryStorage.js';

// Results import, adjustments and report through the in-browser backend.
const RANGE = 'from=2000-01-01T00:00:00.000Z&to=2100-01-01T00:00:00.000Z';
const VN_OFFSET = 420;

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

const localDay = (iso) =>
  new Date(Date.parse(iso) + VN_OFFSET * 60000).toISOString().slice(0, 10);

describe('e-invoice assist API (in-browser backend)', () => {
  let exported;

  beforeAll(async () => {
    configureStorage(createMemoryStorage());
    setActiveNamespace('vlxd');
    await seedEdition('vlxd', { dispatch });
    await call('PUT', '/settings/main', { sellerTaxCode: '8012345678' });
    exported = (await documents('pending')).items.slice(0, 3);
    await call('POST', '/einvoice/mark-exported', {
      invoiceIds: exported.map((item) => item.invoiceId),
      profile: 'generic',
    });
  }, 30000);

  it('imports provider numbers: dry run first, then apply', async () => {
    const [byCode, byDay] = exported;
    const rows = [
      { rowNumber: 2, ref: byCode.code, number: '0000101', series: '1C26TAA' },
      {
        rowNumber: 3,
        day: localDay(byDay.date),
        total: byDay.document.totals.total,
        number: '0000102',
      },
      { rowNumber: 4, ref: 'KHONG-CO', number: '0000103' },
      { rowNumber: 5, ref: byCode.code },
    ];
    const preview = await call('POST', '/einvoice/results', {
      rows,
      utcOffsetMinutes: VN_OFFSET,
      dryRun: true,
    });
    expect(preview.applied).toBe(false);
    expect(preview.withoutNumber).toBe(1);
    expect(preview.unmatched.map((row) => row.rowNumber)).toContain(4);
    const matchedIds = preview.matched.map((item) => item.invoiceId);
    expect(matchedIds).toContain(byCode.invoiceId);
    const unnumberedBefore = (await documents('unnumbered')).items.length;

    await call('POST', '/einvoice/results', {
      rows,
      utcOffsetMinutes: VN_OFFSET,
      dryRun: false,
    });
    const all = (await documents('all')).items;
    const saved = all.find((item) => item.invoiceId === byCode.invoiceId);
    expect(saved.einvoice).toMatchObject({
      number: '0000101',
      series: '1C26TAA',
    });
    expect((await documents('unnumbered')).items.length).toBe(
      unnumberedBefore - matchedIds.length
    );
  });

  const itemOf = async (invoiceId) =>
    (await documents('all')).items.find((item) => item.invoiceId === invoiceId);

  it('exports a replacement for an edited sale and keeps the history', async () => {
    const [sale] = exported;
    const invoice = await call('GET', `/invoices/${sale.invoiceId}`);
    await call('PUT', `/invoices/${sale.invoiceId}`, {
      ...invoice,
      items: invoice.items.map((item, index) =>
        index === 0 ? { ...item, lineNote: 'đổi quy cách' } : item
      ),
    });
    const changed = await itemOf(sale.invoiceId);
    expect(changed.adjustment).toMatchObject({ kind: 'replace', issues: [] });
    expect(changed.adjustment.document.adjustment.originalNumber).toBe(
      '0000101'
    );

    const result = await call('POST', '/einvoice/mark-adjusted', {
      invoiceIds: [sale.invoiceId],
      profile: 'generic-adjust',
    });
    expect(result.count).toBe(1);
    const after = await itemOf(sale.invoiceId);
    expect(after.status).toBe('exported');
    expect(after.einvoice.number).toBeNull();
    expect(after.einvoice.adjustments).toMatchObject([
      { kind: 'replace', originalNumber: '0000101', originalSeries: '1C26TAA' },
    ]);
  });

  it('exports an adjust-down for a deleted sale', async () => {
    const sale = exported[2];
    await call('PUT', `/einvoice/${sale.invoiceId}/number`, {
      number: '0000109',
    });
    await call('DELETE', `/invoices/${sale.invoiceId}`);
    const changed = await itemOf(sale.invoiceId);
    expect(changed.adjustment.kind).toBe('reduce');
    expect(changed.adjustment.document.lines.length).toBe(
      sale.document.lines.length
    );
    await call('POST', '/einvoice/mark-adjusted', {
      invoiceIds: [sale.invoiceId],
    });
    expect(await itemOf(sale.invoiceId)).toMatchObject({
      status: 'exported',
      deleted: true,
      einvoice: { number: '0000109' },
    });
  });
});

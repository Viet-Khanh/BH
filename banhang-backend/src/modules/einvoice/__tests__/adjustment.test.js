import { describe, expect, it } from 'vitest';
import { adjustmentEntry, buildAdjustment } from '../domain/adjustment.js';

const snapshot = { date: '2026-10-20T03:00:00.000Z', lines: [{ index: 1 }] };
const current = {
  date: '2026-10-20T03:00:00.000Z',
  lines: [{ index: 1 }, { index: 2 }],
};
const invoice = (overrides = {}) => ({
  date: '2026-10-20T03:00:00.000Z',
  einvoice: { number: '0000101', series: '1C26TAA', snapshot },
  ...overrides,
});

describe('buildAdjustment', () => {
  it('replaces an edited sale with its current content', () => {
    const adjustment = buildAdjustment(invoice(), current);
    expect(adjustment.kind).toBe('replace');
    expect(adjustment.issues).toEqual([]);
    expect(adjustment.document.lines).toHaveLength(2);
    expect(adjustment.document.adjustment).toEqual({
      kind: 'replace',
      originalNumber: '0000101',
      originalSeries: '1C26TAA',
      originalDate: snapshot.date,
    });
  });

  it('reduces a deleted sale with the exported content', () => {
    const adjustment = buildAdjustment(invoice({ isDeleted: true }), current);
    expect(adjustment.kind).toBe('reduce');
    expect(adjustment.document.lines).toHaveLength(1);
  });

  it('needs the original number and a snapshot', () => {
    const missing = buildAdjustment(
      invoice({ isDeleted: true, einvoice: {} }),
      current
    );
    expect(missing.document).toBeNull();
    expect(missing.issues.map((issue) => issue.message).join()).toMatch(
      'số hoá đơn gốc'
    );
  });

  it('records history entries', () => {
    const entry = adjustmentEntry(buildAdjustment(invoice(), current), {
      at: 'now',
      batchId: 'ED-1',
      profile: 'generic-adjust',
    });
    expect(entry).toMatchObject({
      kind: 'replace',
      originalNumber: '0000101',
      batchId: 'ED-1',
    });
  });
});

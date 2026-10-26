import { describe, expect, it } from 'vitest';
import { diffDocuments } from '../domain/documentDiff.js';

const line = (index, code, quantity, unitPrice) => ({
  index,
  code,
  name: `Hàng ${code}`,
  unit: 'cái',
  quantity,
  unitPrice,
  amount: quantity * unitPrice,
});
const doc = (lines, buyer = {}) => ({
  date: '2026-10-26T03:00:00.000Z',
  buyer: { name: 'An', taxCode: '', ...buyer },
  lines,
  totals: {
    beforeTax: lines.reduce((sum, item) => sum + item.amount, 0),
    tax: 0,
    total: lines.reduce((sum, item) => sum + item.amount, 0),
  },
});

describe('diffDocuments', () => {
  const before = doc([line(1, 'A', 2, 1000), line(2, 'B', 1, 5000)]);

  it('reports nothing for an identical document', () => {
    expect(diffDocuments(before, before)).toMatchObject({
      deleted: false,
      date: null,
      buyer: [],
      lines: [],
      totals: [],
    });
  });

  it('reports changed, removed and added lines and totals', () => {
    const after = doc([line(1, 'A', 3, 1000), line(2, 'C', 1, 700)]);
    const diff = diffDocuments(before, after);
    expect(diff.lines.map((change) => change.type)).toEqual([
      'changed',
      'removed',
      'added',
    ]);
    expect(diff.lines[0].fields.map((field) => field.field)).toEqual([
      'quantity',
      'amount',
    ]);
    expect(diff.totals.find((item) => item.field === 'total')).toEqual({
      field: 'total',
      before: 7000,
      after: 3700,
    });
  });

  it('pairs reordered lines instead of marking them all changed', () => {
    const after = doc([line(1, 'B', 1, 5000), line(2, 'A', 2, 1000)]);
    expect(diffDocuments(before, after).lines).toEqual([]);
  });

  it('reports buyer and date changes', () => {
    const after = {
      ...doc(before.lines, { taxCode: '0312345678' }),
      date: '2026-10-27T03:00:00.000Z',
    };
    const diff = diffDocuments(before, after);
    expect(diff.buyer).toEqual([
      { field: 'taxCode', before: '', after: '0312345678' },
    ]);
    expect(diff.date.after).toBe('2026-10-27T03:00:00.000Z');
  });

  it('lists every exported line as removed for a deleted sale', () => {
    const diff = diffDocuments(before, null);
    expect(diff.deleted).toBe(true);
    expect(diff.lines).toHaveLength(2);
  });

  it('returns null without a snapshot (exported before snapshots existed)', () => {
    expect(diffDocuments(undefined, before)).toBeNull();
  });
});

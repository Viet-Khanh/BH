import { describe, expect, it } from 'vitest';
import { matchResults } from '../domain/resultMatcher.js';

const exported = { exportedAt: '2026-10-26T10:00:00.000Z' };
const invoices = [
  {
    id: 'a',
    code: 'INV-A',
    date: '2026-10-25T18:00:00.000Z',
    total: 50000,
    einvoice: exported,
  },
  {
    id: 'b',
    code: 'INV-B',
    date: '2026-10-26T03:00:00.000Z',
    total: 70000,
    einvoice: exported,
  },
  {
    id: 'c',
    code: 'INV-C',
    date: '2026-10-26T04:00:00.000Z',
    total: 70000,
    einvoice: exported,
  },
  {
    id: 'd',
    code: 'INV-D',
    date: '2026-10-26T05:00:00.000Z',
    total: 90000,
    einvoice: { ...exported, number: '5' },
  },
];

describe('matchResults', () => {
  it('matches by app code first', () => {
    const { matched } = matchResults(
      [{ ref: ' INV-B ', number: '1' }],
      invoices
    );
    expect(matched.map((item) => item.invoiceId)).toEqual(['b']);
  });

  it('matches by local day + total when there is one candidate', () => {
    // 2026-10-25T18:00Z is 26/10 01:00 in Vietnam.
    const { matched } = matchResults(
      [{ day: '2026-10-26', total: '50000', number: '2' }],
      invoices
    );
    expect(matched[0].invoiceId).toBe('a');
  });

  it('reports ambiguous and unmatched rows, skipping numbered sales', () => {
    const result = matchResults(
      [
        { rowNumber: 2, day: '2026-10-26', total: 70000, number: '3' },
        { rowNumber: 3, day: '2026-10-26', total: 90000, number: '4' },
      ],
      invoices
    );
    expect(result.ambiguous[0].codes).toEqual(['INV-B', 'INV-C']);
    expect(result.unmatched.map((row) => row.rowNumber)).toEqual([3]);
  });
});

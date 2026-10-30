import { describe, expect, it } from 'vitest';
import {
  buildStockMovementExportRow,
  buildStockRangeLabels,
  buildStockTotalsByUnit,
  formatStockArea,
  formatStockSize,
} from '../reportStockMovementUtils.js';

describe('reportStockMovementUtils', () => {
  it('shows a dash for empty area and size', () => {
    expect(formatStockArea(0)).toBe('–');
    expect(formatStockSize(null, 1.2)).toBe('–');
    expect(formatStockSize(3, 1.2)).toBe('3 × 1,2');
  });

  it('builds range labels with fallbacks', () => {
    expect(buildStockRangeLabels([null, null])).toEqual({
      opening: 'từ đầu',
      period: 'toàn bộ',
      closing: 'hiện tại',
    });
    const labels = buildStockRangeLabels([
      '2026-10-01T05:00:00.000Z',
      '2026-10-30T05:00:00.000Z',
    ]);
    expect(labels.opening).toBe('đến 00:00 01/10/2026');
    expect(labels.period).toBe('01/10 – 30/10');
  });

  it('rounds area in export rows', () => {
    const row = buildStockMovementExportRow({
      name: 'Tôn',
      unit: 'm2',
      inArea: 7.2000000001,
      outArea: 0,
    });
    expect(row['Nhập m²']).toBe(7.2);
    expect(row['Xuất m²']).toBe(0);
  });

  it('totals quantities per unit only', () => {
    const totals = buildStockTotalsByUnit([
      { unit: 'cái', inQty: 2, closingStock: 1 },
      { unit: 'cái', inQty: 3, closingStock: -2 },
      { unit: '', inQty: 1 },
    ]);
    expect(totals).toHaveLength(2);
    expect(totals[0]).toMatchObject({
      unit: 'cái',
      inQty: 5,
      closingStock: -1,
    });
    expect(totals[1]).toMatchObject({ unit: 'không ĐVT', inQty: 1 });
  });
});

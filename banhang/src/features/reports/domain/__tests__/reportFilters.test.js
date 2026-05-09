import { describe, expect, it } from 'vitest';
import {
  buildSyncedSearch,
  readReportFiltersFromSearch,
} from '../reportFilters.js';

describe('reportFilters', () => {
  it('keeps existing pagination params when pagination sync is disabled', () => {
    const nextSearch = buildSyncedSearch('tab=stock-out&page=3&pageSize=50', {
      range: ['2026-04-14T00:00:00.000Z', '2026-04-14T23:59:59.999Z'],
      syncPagination: false,
    });

    const params = new URLSearchParams(nextSearch);

    expect(params.get('tab')).toBe('stock-out');
    expect(params.get('from')).toBe('2026-04-14T00:00:00.000Z');
    expect(params.get('to')).toBe('2026-04-14T23:59:59.999Z');
    expect(params.get('page')).toBe('3');
    expect(params.get('pageSize')).toBe('50');
  });

  it('overrides pagination params when pagination sync is enabled', () => {
    const nextSearch = buildSyncedSearch('tab=sales&page=3&pageSize=50', {
      range: ['2026-04-14T00:00:00.000Z', '2026-04-14T23:59:59.999Z'],
      page: 1,
      pageSize: 20,
      syncPagination: true,
    });

    const params = new URLSearchParams(nextSearch);

    expect(params.get('tab')).toBe('sales');
    expect(params.get('page')).toBe('1');
    expect(params.get('pageSize')).toBe('20');
  });

  it('uses the provided default page size when query omits pageSize', () => {
    const filters = readReportFiltersFromSearch('tab=sales', {
      defaultPageSize: 100,
    });

    expect(filters.pageSize).toBe(100);
  });

  it('syncs the provided default page size when pageSize is missing', () => {
    const nextSearch = buildSyncedSearch('tab=sales', {
      range: ['2026-04-14T00:00:00.000Z', '2026-04-14T23:59:59.999Z'],
      page: 1,
      defaultPageSize: 100,
    });

    const params = new URLSearchParams(nextSearch);

    expect(params.get('pageSize')).toBe('100');
  });
});

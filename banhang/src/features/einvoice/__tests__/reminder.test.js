import dayjs from 'dayjs';
import { describe, expect, it } from 'vitest';
import {
  isReminderEnabled,
  reminderParts,
  reminderRange,
} from '../domain/reminder.js';

describe('reminder', () => {
  it('is enabled only for shops with a seller tax code', () => {
    expect(isReminderEnabled({})).toBe(false);
    expect(isReminderEnabled({ sellerTaxCode: '8012345678' })).toBe(true);
    expect(
      isReminderEnabled({ sellerTaxCode: '801', einvoiceReminder: false })
    ).toBe(false);
  });

  it('counts from the start date, else the last 30 days', () => {
    const now = dayjs('2026-10-26T10:00:00');
    expect(reminderRange({}, now).since).toBe(
      dayjs('2026-09-26T00:00:00').toISOString()
    );
    expect(
      reminderRange({ einvoiceStartDate: '2026-10-01T00:00:00.000Z' }, now)
        .since
    ).toBe('2026-10-01T00:00:00.000Z');
  });

  it('builds short phrases and nothing when all is done', () => {
    expect(
      reminderParts({
        pendingToday: 2,
        pendingEarlier: 1,
        changed: 1,
        unnumbered: 0,
      })
    ).toEqual([
      '3 hoá đơn chưa xuất HĐĐT (1 của các ngày trước)',
      '1 hoá đơn sửa sau khi xuất',
    ]);
    expect(
      reminderParts({
        pendingToday: 0,
        pendingEarlier: 0,
        changed: 0,
        unnumbered: 0,
      })
    ).toEqual([]);
  });
});

import { useEffect, useState } from 'react';
import { getEinvoiceSummary } from '../api/einvoiceApi.js';
import { isReminderEnabled, reminderRange } from '../domain/reminder.js';

// Reminder counts; null while disabled, loading or on error (never blocks Home).
export const useEinvoiceSummary = (settings) => {
  const [summary, setSummary] = useState(null);
  const enabled = isReminderEnabled(settings);
  const startDate = settings?.einvoiceStartDate;

  useEffect(() => {
    if (!enabled) {
      setSummary(null);
      return undefined;
    }
    let active = true;
    getEinvoiceSummary(reminderRange({ einvoiceStartDate: startDate }))
      .then((data) => active && setSummary(data))
      .catch(() => active && setSummary(null));
    return () => {
      active = false;
    };
  }, [enabled, startDate]);

  return summary;
};

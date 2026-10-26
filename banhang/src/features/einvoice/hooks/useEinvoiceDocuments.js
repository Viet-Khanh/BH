import { message } from 'antd';
import dayjs from 'dayjs';
import { useCallback, useEffect, useState } from 'react';
import { getEinvoiceDocuments } from '../api/einvoiceApi.js';

const EMPTY_RESULT = { items: [], blocking: [] };

const initialFilters = () => ({
  range: [dayjs().startOf('day'), dayjs().endOf('day')],
  status: 'pending',
  search: '',
  requestedOnly: false,
});

// Loads e-invoice documents for the current filters (local-day range → ISO).
export const useEinvoiceDocuments = () => {
  const [filters, setFilters] = useState(initialFilters);
  const [result, setResult] = useState(EMPTY_RESULT);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    const [start, end] = filters.range;
    setLoading(true);
    try {
      const data = await getEinvoiceDocuments({
        from: start.startOf('day').toISOString(),
        to: end.endOf('day').toISOString(),
        status: filters.status,
        search: filters.search.trim(),
        requestedOnly: filters.requestedOnly,
      });
      setResult(data || EMPTY_RESULT);
    } catch (error) {
      message.error(`Không tải được hoá đơn: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    reload();
  }, [reload]);

  const updateFilters = useCallback(
    (patch) => setFilters((previous) => ({ ...previous, ...patch })),
    []
  );

  return { filters, updateFilters, ...result, loading, reload };
};

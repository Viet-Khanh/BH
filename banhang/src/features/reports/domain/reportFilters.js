import dayjs from 'dayjs';

export const buildDefaultRange = () => [
  dayjs().startOf('day').toISOString(),
  dayjs().endOf('day').toISOString(),
];

export const buildMonthToDateRange = () => [
  dayjs().startOf('month').toISOString(),
  dayjs().endOf('day').toISOString(),
];

export const buildRollingDaysRange = (days = 30) => {
  const end = dayjs().endOf('day');
  return [
    end.subtract(days, 'day').startOf('day').toISOString(),
    end.toISOString(),
  ];
};

export const parseDateParam = (value, fallback) => {
  if (value === null) return fallback;
  if (value === '') return null;
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.toISOString() : fallback;
};

export const parsePositiveInt = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
};

export const isSameRange = (left = [], right = []) =>
  left[0] === right[0] && left[1] === right[1];

export const readReportFiltersFromSearch = (
  search,
  { entityKey, defaultRange, defaultPageSize = 20 } = {}
) => {
  const params = new URLSearchParams(search);
  const [defaultFrom, defaultTo] = defaultRange || buildDefaultRange();
  const from = parseDateParam(params.get('from'), defaultFrom);
  const to = parseDateParam(params.get('to'), defaultTo);

  return {
    range: [from, to],
    entityId: entityKey ? params.get(entityKey) || '' : '',
    page: parsePositiveInt(params.get('page'), 1),
    pageSize: parsePositiveInt(params.get('pageSize'), defaultPageSize),
  };
};

export const buildSyncedSearch = (
  currentSearch,
  {
    range,
    entityKey,
    entityId,
    page,
    pageSize,
    syncPagination = true,
    defaultPageSize = 20,
  }
) => {
  const params = new URLSearchParams(currentSearch);

  const setDateParam = (key, value) => {
    params.set(key, value ? String(value) : '');
  };

  const setOptionalParam = (key, value) => {
    if (!key) return;
    if (!value) {
      params.delete(key);
      return;
    }
    params.set(key, value);
  };

  setDateParam('from', range?.[0]);
  setDateParam('to', range?.[1]);
  setOptionalParam(entityKey, entityId || '');
  if (syncPagination) {
    params.set('page', String(page || 1));
    params.set('pageSize', String(pageSize || defaultPageSize));
  }

  return params.toString();
};

export const buildReportQueryString = ({
  range,
  page,
  pageSize,
  entityKey,
  entityId,
  extras,
} = {}) => {
  const params = new URLSearchParams();

  if (range?.[0]) params.set('from', range[0]);
  if (range?.[1]) params.set('to', range[1]);
  if (entityKey && entityId) params.set(entityKey, entityId);
  if (page) params.set('page', String(page));
  if (pageSize) params.set('pageSize', String(pageSize));

  Object.entries(extras || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    params.set(key, String(value));
  });

  return params.toString();
};

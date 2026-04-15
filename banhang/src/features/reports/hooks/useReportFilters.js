import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  buildSyncedSearch,
  isSameRange,
  readReportFiltersFromSearch,
} from '../domain/reportFilters.js';

export const useReportFilters = ({
  entityKey,
  defaultRange,
  syncPagination = true,
} = {}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const initialFilters = useMemo(
    () =>
      readReportFiltersFromSearch(location.search, {
        entityKey,
        defaultRange,
      }),
    [defaultRange, entityKey, location.search]
  );

  const [range, setRange] = useState(() => initialFilters.range);
  const [entityId, setEntityId] = useState(() => initialFilters.entityId);
  const [page, setPage] = useState(() => initialFilters.page);
  const [pageSize, setPageSize] = useState(() => initialFilters.pageSize);

  useEffect(() => {
    const nextFilters = readReportFiltersFromSearch(location.search, {
      entityKey,
      defaultRange,
    });

    setRange((prev) =>
      isSameRange(prev, nextFilters.range) ? prev : nextFilters.range
    );
    setEntityId((prev) =>
      prev === nextFilters.entityId ? prev : nextFilters.entityId
    );
    setPage((prev) => (prev === nextFilters.page ? prev : nextFilters.page));
    setPageSize((prev) =>
      prev === nextFilters.pageSize ? prev : nextFilters.pageSize
    );
  }, [defaultRange, entityKey, location.search]);

  useEffect(() => {
    const nextSearch = buildSyncedSearch(location.search, {
      range,
      entityKey,
      entityId,
      page,
      pageSize,
      syncPagination,
    });
    const currentSearch = location.search.startsWith('?')
      ? location.search.slice(1)
      : location.search;

    if (currentSearch === nextSearch) return;

    navigate(
      {
        pathname: location.pathname,
        search: nextSearch ? `?${nextSearch}` : '',
      },
      { replace: true }
    );
  }, [
    entityId,
    entityKey,
    defaultRange,
    location.pathname,
    location.search,
    navigate,
    page,
    pageSize,
    range,
    syncPagination,
  ]);

  return {
    navigate,
    location,
    range,
    setRange,
    entityId,
    setEntityId,
    page,
    setPage,
    pageSize,
    setPageSize,
  };
};

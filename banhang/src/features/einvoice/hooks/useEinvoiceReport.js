import { message } from 'antd';
import dayjs from 'dayjs';
import { useCallback, useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import { saveWorkbook } from '../../../utils/excelExport.js';
import { getEinvoiceReport } from '../api/einvoiceApi.js';
import { reportSheetRows } from '../domain/reportExport.js';

const startOfQuarter = () => {
  const now = dayjs();
  return now.month(Math.floor(now.month() / 3) * 3).startOf('month');
};

// Declaration report: filters (default: this quarter by month), data, Excel.
export const useEinvoiceReport = () => {
  const [filters, setFilters] = useState(() => ({
    range: [startOfQuarter(), dayjs().endOf('day')],
    groupBy: 'month',
  }));
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    const [start, end] = filters.range;
    setLoading(true);
    try {
      setReport(
        await getEinvoiceReport({
          from: start.startOf('day').toISOString(),
          to: end.endOf('day').toISOString(),
          groupBy: filters.groupBy,
        })
      );
    } catch (error) {
      message.error(`Không tải được báo cáo: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    reload();
  }, [reload]);

  const exportExcel = async () => {
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.aoa_to_sheet(reportSheetRows(report)),
      'BaoCao'
    );
    const [start, end] = filters.range;
    await saveWorkbook(
      workbook,
      `BaoCao-HDDT-${start.format('YYYYMMDD')}-${end.format('YYYYMMDD')}`
    );
  };

  return {
    filters,
    updateFilters: (patch) =>
      setFilters((previous) => ({ ...previous, ...patch })),
    report,
    loading,
    exportExcel,
  };
};

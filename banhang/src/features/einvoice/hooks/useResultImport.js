import { message } from 'antd';
import { useMemo, useState } from 'react';
import { importEinvoiceResults } from '../api/einvoiceApi.js';
import { guessResultMapping, toResultRows } from '../domain/resultRows.js';
import { detectHeaderRow } from '../domain/templateReader.js';
import { pickMainSheet, readWorkbookRows } from '../domain/workbookRows.js';

// State of the "import provider results" dialog: file → mapping → preview → apply.
export const useResultImport = ({ onApplied }) => {
  const [sheet, setSheet] = useState(null);
  const [headerRow, setHeaderRow] = useState(1);
  const [mapping, setMapping] = useState({});
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);

  const headers = sheet?.rows[headerRow - 1] || [];
  const rows = useMemo(
    () => (sheet ? toResultRows(sheet.rows, headerRow - 1, mapping) : []),
    [sheet, headerRow, mapping]
  );

  const chooseHeaderRow = (row, target = sheet) => {
    setHeaderRow(row);
    setMapping(guessResultMapping(target?.rows[row - 1] || []));
    setPreview(null);
  };

  const load = async (file) => {
    try {
      const target = pickMainSheet(
        readWorkbookRows(await file.arrayBuffer(), { raw: true })
      );
      setSheet(target);
      chooseHeaderRow(detectHeaderRow(target.rows) + 1, target);
    } catch (error) {
      message.error(`Không đọc được file: ${error.message}`);
    }
    return false;
  };

  const run = async (dryRun) => {
    setBusy(true);
    try {
      const result = await importEinvoiceResults({ rows, dryRun });
      setPreview(result);
      if (!dryRun) {
        message.success(`Đã ghi số cho ${result.matched.length} hoá đơn.`);
        onApplied?.();
      }
    } catch (error) {
      message.error(error.message);
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    setSheet(null);
    setPreview(null);
  };

  return {
    sheet,
    headers,
    headerRow,
    chooseHeaderRow,
    mapping,
    setMappingKey: (key, index) => {
      setMapping((previous) => ({ ...previous, [key]: index }));
      setPreview(null);
    },
    rows,
    preview,
    busy,
    load,
    check: () => run(true),
    apply: () => run(false),
    reset,
  };
};

import { matchResults } from '../domain/resultMatcher.js';
import { EinvoiceInputError } from '../domain/status.js';
import {
  findInvoicesByCodes,
  setInvoiceEinvoiceFields,
} from '../repositories/einvoice.repository.js';
import { findRealSales } from './documents.service.js';
import { issuedFieldsPatch } from './exportState.service.js';

const DAY = 24 * 60 * 60 * 1000;
const ISSUED = ['number', 'series', 'taxAuthorityCode', 'lookupCode'];

const dayRange = (rows) => {
  const days = rows
    .map((row) => row.day)
    .filter(Boolean)
    .sort();
  if (!days.length) return null;
  return {
    from: new Date(Date.parse(days[0]) - DAY).toISOString(),
    to: new Date(Date.parse(days[days.length - 1]) + 2 * DAY).toISOString(),
  };
};

// Invoices that can match: by app code, plus all sales around the rows' days.
const loadCandidates = async (rows) => {
  const codes = [...new Set(rows.map((row) => String(row.ref || '').trim()))];
  const range = dayRange(rows);
  const [byCode, byDay] = await Promise.all([
    findInvoicesByCodes(codes.filter(Boolean)),
    range ? findRealSales(range) : [],
  ]);
  const byId = new Map(
    [...byDay, ...byCode].map((invoice) => [invoice.id, invoice])
  );
  return [...byId.values()];
};

// Only the provider fields the file actually has are written.
const patchOf = (row) =>
  issuedFieldsPatch(
    Object.fromEntries(
      ISSUED.filter((field) => String(row[field] ?? '').trim()).map((field) => [
        field,
        row[field],
      ])
    )
  );

export const importResults = async ({
  rows,
  utcOffsetMinutes,
  dryRun = true,
}) => {
  if (!Array.isArray(rows) || !rows.length)
    throw new EinvoiceInputError('File không có dòng nào.');
  const usable = rows.filter((row) => String(row.number || '').trim());
  const result = matchResults(usable, await loadCandidates(usable), {
    utcOffsetMinutes: Number(utcOffsetMinutes ?? 420),
  });
  if (!dryRun) {
    await Promise.all(
      result.matched.map(({ row, invoiceId }) =>
        setInvoiceEinvoiceFields(invoiceId, patchOf(row))
      )
    );
  }
  return {
    ...result,
    withoutNumber: rows.length - usable.length,
    applied: !dryRun,
  };
};

import {
  buildChangeFlagPatch,
  EinvoiceLockedError,
  lockViolation,
} from '../domain/contentChange.js';
import { loadSettings } from './documentItems.js';

// Single entry point for the invoices module: call before applying an
// update (`next` = merged invoice) or a delete (`next` = null). Throws when the
// lock setting refuses the change; otherwise returns the change-flag `$set` patch.
export const checkInvoiceChange = async (existing, next) => {
  if (!existing?.einvoice?.exportedAt) return {};
  const violation = lockViolation(existing, next, await loadSettings());
  if (violation) throw new EinvoiceLockedError(violation);
  return buildChangeFlagPatch(existing, next);
};

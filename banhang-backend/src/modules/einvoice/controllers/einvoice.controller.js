import { EinvoiceInputError } from '../domain/status.js';
import { listDocuments } from '../services/documents.service.js';
import { markAdjusted } from '../services/adjustments.service.js';
import { importResults } from '../services/results.service.js';
import { getSummary as buildSummary } from '../services/summary.service.js';
import {
  markExported,
  setNumber,
  unmarkExported,
} from '../services/exportState.service.js';

// Input errors → 400; anything else bubbles to the app error handler (500).
const respond = (handler) => async (req, res) => {
  try {
    res.json(await handler(req));
  } catch (error) {
    if (!(error instanceof EinvoiceInputError)) throw error;
    res.status(400).json({ message: error.message });
  }
};

export const getDocuments = respond((req) => listDocuments(req.query));

export const getSummary = respond((req) => buildSummary(req.query));

export const postMarkExported = respond((req) => markExported(req.body));

export const postUnmark = respond((req) => unmarkExported(req.body));

export const putNumber = respond((req) =>
  setNumber(req.params.invoiceId, req.body)
);

export const postResults = respond((req) => importResults(req.body || {}));

export const postMarkAdjusted = respond((req) => markAdjusted(req.body || {}));

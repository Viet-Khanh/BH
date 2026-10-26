// Mirrors banhang-backend/src/modules/einvoice/domain/reducedVat.js.
export const REDUCED_VAT_END_ISO = '2026-12-31T16:59:59.999Z';

// After 31/12/2026 a default rate of 8% is most likely outdated.
export const shouldWarnReducedVat = (settings = {}, now = new Date()) =>
  settings.taxMethod === 'deduction' &&
  String(settings.defaultVatRate ?? '8') === '8' &&
  now.toISOString() > REDUCED_VAT_END_ISO;

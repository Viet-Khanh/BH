// VAT reduced from 10% to 8% until 31/12/2026 (Nghị quyết 204/2025/QH15).
// End of that day in Vietnam (UTC+7), as an ISO instant.
export const REDUCED_VAT_END_ISO = '2026-12-31T16:59:59.999Z';
export const REDUCED_RATE = '8';

export const isAfterReducedVat = (dateIso) =>
  Boolean(dateIso) && String(dateIso) > REDUCED_VAT_END_ISO;

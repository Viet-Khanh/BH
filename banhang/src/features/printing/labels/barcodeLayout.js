// Barcode geometry for thermal label printers: whole-dot module widths and quiet zones.
export const DOTS_PER_MM = 8; // 203 dpi
export const LABEL_PADDING_MM = 1;
export const BARCODE_TOO_LONG_WARNING =
  'Mã quá dài cho khổ tem — có thể khó quét.';

// Quiet zones in modules [left, right].
const QUIET_ZONES = { EAN13: [11, 7], CODE128: [10, 10] };

export const getQuietZones = (format) =>
  QUIET_ZONES[format] || QUIET_ZONES.CODE128;

const EAN13_MODULES = 95;

// Modules of the symbol incl. quiet zones. Code128 is estimated as set B
// (11 per char + start + check + 13-module stop); digit-only data may encode
// shorter (set C), so this errs on the long side.
export const estimateBarcodeModules = (barcode, format) => {
  const [left, right] = getQuietZones(format);
  if (format === 'EAN13') return EAN13_MODULES + left + right;
  const chars = String(barcode ?? '').length;
  return 11 * (chars + 3) + 2 + left + right;
};

// Width the barcode may use inside a label.
export const getBarcodeAvailableMm = (labelWidthMm) =>
  Math.max(1, Number(labelWidthMm) - 2 * LABEL_PADDING_MM);

// Module = whole printer dots (never fractional), so bars print evenly.
export const computeBarcodeLayout = ({
  totalModules,
  availableMm,
  dotsPerMm = DOTS_PER_MM,
}) => {
  const modules = Math.max(1, Number(totalModules) || 1);
  const dots = Math.max(1, Math.floor((availableMm * dotsPerMm) / modules));
  const moduleMm = dots / dotsPerMm;
  return {
    moduleMm,
    widthMm: modules * moduleMm,
    tooSmall: moduleMm < 2 / dotsPerMm,
  };
};

// Confirm-list check: true when the estimated symbol needs modules under 2 dots.
export const isBarcodeTooLong = (barcode, format, labelWidthMm) =>
  computeBarcodeLayout({
    totalModules: estimateBarcodeModules(barcode, format),
    availableMm: getBarcodeAvailableMm(labelWidthMm),
  }).tooSmall;

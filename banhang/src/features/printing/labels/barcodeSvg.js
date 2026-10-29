import JsBarcode from 'jsbarcode';

const SVG_NS = 'http://www.w3.org/2000/svg';

const tryRender = (value, format, height) => {
  const svg = document.createElementNS(SVG_NS, 'svg');
  try {
    JsBarcode(svg, value, {
      format,
      displayValue: false,
      margin: 0,
      height,
      width: 1,
    });
  } catch {
    return '';
  }
  // Stretch to the label's barcode box (JsBarcode sets a viewBox).
  svg.setAttribute('preserveAspectRatio', 'none');
  return svg.outerHTML;
};

// Barcode SVG markup (browser only). Falls back to CODE128, then to ''.
export const renderBarcodeSvg = (
  value,
  format = 'CODE128',
  { heightMm } = {}
) => {
  if (!value || typeof document === 'undefined') return '';
  const height = Math.max(20, Math.round((Number(heightMm) || 10) * 8));
  const svg = tryRender(String(value), format, height);
  if (svg || format === 'CODE128') return svg;
  return tryRender(String(value), 'CODE128', height);
};

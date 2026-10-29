import { getQuietZones } from './barcodeLayout.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
// Bar height in symbol units; the label stretches it vertically to its box.
const SYMBOL_HEIGHT = 50;

// JsBarcode SVG (width 1 = 1 unit per module) → { viewBox, inner, totalModules }.
export const readBarcodeSymbol = (svg) => {
  const viewBox = svg?.getAttribute?.('viewBox') || '';
  const totalModules = Number(viewBox.split(/\s+/)[2]);
  if (!(totalModules > 0)) return null;
  return { viewBox, inner: svg.innerHTML || '', totalModules };
};

const tryRender = (JsBarcode, value, format) => {
  const [marginLeft, marginRight] = getQuietZones(format);
  const svg = document.createElementNS(SVG_NS, 'svg');
  try {
    JsBarcode(svg, value, {
      format,
      displayValue: false,
      flat: true,
      margin: 0,
      marginLeft,
      marginRight,
      height: SYMBOL_HEIGHT,
      width: 1,
      background: '',
    });
  } catch {
    return null;
  }
  return readBarcodeSymbol(svg);
};

// Loads JsBarcode on demand (keeps it out of the main bundle) and returns a
// synchronous renderer: (value, format) → symbol, falling back to CODE128, then null.
export const loadBarcodeRenderer = async () => {
  if (typeof document === 'undefined') return () => null;
  const { default: JsBarcode } = await import('jsbarcode');
  return (value, format = 'CODE128') => {
    if (!value) return null;
    const symbol = tryRender(JsBarcode, String(value), format);
    if (symbol || format === 'CODE128') return symbol;
    return tryRender(JsBarcode, String(value), 'CODE128');
  };
};

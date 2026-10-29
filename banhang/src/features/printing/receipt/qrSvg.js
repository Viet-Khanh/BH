// QR code → SVG string (qrcode-generator: no DOM, works offline and in tests).
import qrcode from 'qrcode-generator';

const QUIET_ZONE = 4; // modules on each side, as required by the QR standard

// One path: each run of dark modules in a row becomes a rectangle.
const buildPath = (qr) => {
  const count = qr.getModuleCount();
  const parts = [];
  for (let row = 0; row < count; row += 1) {
    let col = 0;
    while (col < count) {
      if (!qr.isDark(row, col)) {
        col += 1;
        continue;
      }
      const start = col;
      while (col < count && qr.isDark(row, col)) col += 1;
      const x = start + QUIET_ZONE;
      const y = row + QUIET_ZONE;
      parts.push(`M${x} ${y}h${col - start}v1h-${col - start}z`);
    }
  }
  return parts.join('');
};

// With `dotsPerMm` (thermal printer) the size shrinks so a module = whole dots.
const fitSize = (sizeMm, side, dotsPerMm) => {
  if (!(dotsPerMm > 0)) return sizeMm;
  const dots = Math.max(1, Math.floor((sizeMm * dotsPerMm) / side));
  return Math.round(((side * dots) / dotsPerMm) * 1000) / 1000;
};

// Square SVG of about `sizeMm` (quiet zone included); '' without text.
export const renderQrSvg = (text, { sizeMm = 30, dotsPerMm = 0 } = {}) => {
  if (!text) return '';
  const qr = qrcode(0, 'M');
  qr.addData(String(text), 'Byte');
  qr.make();
  const side = qr.getModuleCount() + 2 * QUIET_ZONE;
  const size = fitSize(sizeMm, side, dotsPerMm);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}mm" height="${size}mm" viewBox="0 0 ${side} ${side}" shape-rendering="crispEdges"><rect width="${side}" height="${side}" fill="#fff"/><path d="${buildPath(qr)}" fill="#000"/></svg>`;
};

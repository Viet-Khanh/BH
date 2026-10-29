// CSS of the roll receipt: body = printable width, side margins, layout font size.
export const buildReceiptStyles = (paper, layout) => `
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #fff; color: #000; }
  body { width: ${paper.printableMm}mm; margin: 0 ${paper.marginMm}mm; padding: 2mm 0;
    font: ${layout.fontSizePx}px/1.35 Arial, 'Helvetica Neue', sans-serif;
    font-variant-numeric: tabular-nums; }
  .center { text-align: center; }
  .shop { font-size: 1.17em; font-weight: 700; text-transform: uppercase; }
  .sep { border-top: 1px dashed #000; margin: 4px 0; }
  .row { display: flex; justify-content: space-between; gap: 4px; }
  .row > span:last-child { text-align: right; white-space: nowrap; }
  .name { font-weight: 700; overflow-wrap: anywhere; }
  .item b { overflow-wrap: anywhere; }
  .line-note { font-size: 0.92em; font-style: italic; }
  .total { font-size: 1.25em; font-weight: 700; }
  .small { font-size: 0.92em; }
  .qr svg, .barcode svg { display: block; margin: 0 auto; max-width: 100%; }
  img { display: block; margin: 0 auto; }
`;

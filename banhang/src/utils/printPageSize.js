// Print page sizes: named paper sizes (A5, A4, …) or custom { widthMm, heightMm }.
const NAMED_SIZES = {
  A0: 'A0',
  A1: 'A1',
  A2: 'A2',
  A3: 'A3',
  A4: 'A4',
  A5: 'A5',
  A6: 'A6',
  LEGAL: 'Legal',
  LETTER: 'Letter',
  TABLOID: 'Tabloid',
};

export const normalizePageSize = (value) => {
  if (typeof value !== 'string') return '';
  return NAMED_SIZES[value.trim().toUpperCase()] || '';
};

const roundMm = (value) => Math.round(value * 100) / 100;

const readMm = (value) => {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? roundMm(number) : 0;
};

// { widthMm, heightMm } with positive numbers, or null.
export const normalizeMmPageSize = (value) => {
  if (!value || typeof value !== 'object') return null;
  const widthMm = readMm(value.widthMm);
  const heightMm = readMm(value.heightMm);
  return widthMm && heightMm ? { widthMm, heightMm } : null;
};

export const buildPageSizeCss = ({ widthMm, heightMm }) =>
  `@page { size: ${widthMm}mm ${heightMm}mm; margin: 0 }`;

const buildCss = (pageSize) => {
  const mmSize = normalizeMmPageSize(pageSize);
  if (mmSize) return buildPageSizeCss(mmSize);
  const named = normalizePageSize(pageSize);
  return named ? `@page { size: ${named} portrait; }` : '';
};

// Adds an @page rule for a named size or { widthMm, heightMm }.
export const injectPageSizeCss = (htmlDocument, pageSize) => {
  const css = buildCss(pageSize);
  if (!css) return htmlDocument;
  const styleTag = `<style id="__print_page_size__">${css}</style>`;
  if (htmlDocument.includes('</body>')) {
    return htmlDocument.replace('</body>', `${styleTag}</body>`);
  }
  if (htmlDocument.includes('</head>')) {
    return htmlDocument.replace('</head>', `${styleTag}</head>`);
  }
  return `${styleTag}${htmlDocument}`;
};

// Measures print HTML in an off-screen iframe to choose a page size.
import { injectPageSizeCss, normalizeMmPageSize } from './printPageSize.js';

const PX_PER_MM = 96 / 25.4;
const A5_HEIGHT_MM = 210;
const A5_WIDTH_MM = 148;
const A4_HEIGHT_MM = 297;
const AUTO_HEIGHT_EXTRA_MM = 4;

const toPx = (mm) => mm * PX_PER_MM;

const waitForLayout = (iframeDocument) =>
  new Promise((resolve) => {
    const raf = iframeDocument.defaultView?.requestAnimationFrame;
    if (!raf) {
      setTimeout(resolve, 40);
      return;
    }
    raf(() => raf(() => setTimeout(resolve, 20)));
  });

// Content height of the document laid out at widthMm. The viewport height is a
// floor for the result (documentElement.scrollHeight never goes below it).
const estimateContentHeightPx = async (
  htmlDocument,
  widthMm,
  viewportHeightMm = A4_HEIGHT_MM
) => {
  if (typeof document === 'undefined') return Number.POSITIVE_INFINITY;

  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.position = 'fixed';
  iframe.style.left = '-10000px';
  iframe.style.top = '0';
  iframe.style.opacity = '0';
  iframe.style.pointerEvents = 'none';
  iframe.style.width = `${toPx(widthMm)}px`;
  iframe.style.height = `${toPx(viewportHeightMm)}px`;
  iframe.style.border = '0';
  iframe.style.background = 'transparent';
  document.body.appendChild(iframe);

  try {
    await new Promise((resolve, reject) => {
      let done = false;
      const timeout = setTimeout(() => {
        if (done) return;
        done = true;
        reject(new Error('print_measure_timeout'));
      }, 1200);

      iframe.onload = () => {
        if (done) return;
        done = true;
        clearTimeout(timeout);
        resolve();
      };

      iframe.srcdoc = htmlDocument;
    });

    const iframeDoc = iframe.contentDocument;
    if (!iframeDoc) return Number.POSITIVE_INFINITY;
    await waitForLayout(iframeDoc);
    const body = iframeDoc.body;
    const docEl = iframeDoc.documentElement;
    if (!body || !docEl) return Number.POSITIVE_INFINITY;
    return Math.max(
      body.scrollHeight,
      body.offsetHeight,
      docEl.scrollHeight,
      docEl.offsetHeight
    );
  } finally {
    iframe.remove();
  }
};

// A5 page height minus the template's 2 x 8 mm margins and a 6 mm safety allowance.
const A5_FIT_HEIGHT_MM = A5_HEIGHT_MM - 2 * 8 - 6;
// A5 width minus the template's 2 x 10 mm side margins.
const A5_PRINTABLE_WIDTH_MM = A5_WIDTH_MM - 2 * 10;

export const chooseAutoPageSize = (contentHeightPx) => {
  if (!Number.isFinite(contentHeightPx)) return 'A4';
  return contentHeightPx <= toPx(A5_FIT_HEIGHT_MM) ? 'A5' : 'A4';
};

export const resolveAutoPageSize = async (htmlDocument) => {
  const htmlForMeasure = injectPageSizeCss(htmlDocument, 'A5');
  // The viewport must be tiny: in standards mode documentElement.scrollHeight
  // is never below the viewport height, so a tall viewport always reads as A4.
  const contentHeightPx = await estimateContentHeightPx(
    htmlForMeasure,
    A5_PRINTABLE_WIDTH_MM,
    1
  );
  return chooseAutoPageSize(contentHeightPx);
};

// Page of widthMm by the measured content height (receipt rolls), or null.
export const resolveAutoHeightPageSize = async (htmlDocument, widthMm) => {
  const contentHeightPx = await estimateContentHeightPx(
    htmlDocument,
    widthMm,
    1
  );
  if (!Number.isFinite(contentHeightPx)) return null;
  return normalizeMmPageSize({
    widthMm,
    heightMm: contentHeightPx / PX_PER_MM + AUTO_HEIGHT_EXTRA_MM,
  });
};

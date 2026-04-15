import { message } from 'antd';

const PX_PER_MM = 96 / 25.4;
const A5_HEIGHT_MM = 210;
const A5_WIDTH_MM = 148;
const A4_HEIGHT_MM = 297;

const toPx = (mm) => mm * PX_PER_MM;

const normalizePageSize = (value) => {
  const normalized = String(value || '')
    .trim()
    .toUpperCase();
  if (!normalized) return '';
  const supported = [
    'A0',
    'A1',
    'A2',
    'A3',
    'A4',
    'A5',
    'A6',
    'LEGAL',
    'LETTER',
    'TABLOID',
  ];
  if (!supported.includes(normalized)) return '';
  if (normalized === 'LEGAL') return 'Legal';
  if (normalized === 'LETTER') return 'Letter';
  if (normalized === 'TABLOID') return 'Tabloid';
  return normalized;
};

const injectPageSizeCss = (htmlDocument, pageSize) => {
  const normalizedPageSize = normalizePageSize(pageSize);
  if (!normalizedPageSize) return htmlDocument;
  const styleTag = `<style id="__print_page_size__">@page { size: ${normalizedPageSize} portrait; }</style>`;
  if (htmlDocument.includes('</body>')) {
    return htmlDocument.replace('</body>', `${styleTag}</body>`);
  }
  if (htmlDocument.includes('</head>')) {
    return htmlDocument.replace('</head>', `${styleTag}</head>`);
  }
  return `${styleTag}${htmlDocument}`;
};

const waitForLayout = (iframeDocument) =>
  new Promise((resolve) => {
    const raf = iframeDocument.defaultView?.requestAnimationFrame;
    if (!raf) {
      setTimeout(resolve, 40);
      return;
    }
    raf(() => raf(() => setTimeout(resolve, 20)));
  });

const estimateContentHeightPx = async (htmlDocument, widthMm) => {
  if (typeof document === 'undefined') return Number.POSITIVE_INFINITY;

  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.position = 'fixed';
  iframe.style.left = '-10000px';
  iframe.style.top = '0';
  iframe.style.opacity = '0';
  iframe.style.pointerEvents = 'none';
  iframe.style.width = `${toPx(widthMm)}px`;
  iframe.style.height = `${toPx(A4_HEIGHT_MM)}px`;
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

const resolveAutoPageSize = async (htmlDocument) => {
  const htmlForMeasure = injectPageSizeCss(htmlDocument, 'A5');
  const contentHeightPx = await estimateContentHeightPx(
    htmlForMeasure,
    A5_WIDTH_MM
  );
  if (!Number.isFinite(contentHeightPx)) return 'A4';
  const safeA5HeightPx = toPx(A5_HEIGHT_MM) - 64;
  return contentHeightPx <= safeA5HeightPx ? 'A5' : 'A4';
};

const wrapHtmlDocument = (html) => {
  const content = String(html || '');
  if (!content.trim()) return '';
  if (/<html[\s>]/i.test(content)) return content;
  return `<!doctype html>
    <html lang="vi">
      <head>
        <meta charset="utf-8" />
        <title>In</title>
      </head>
      <body>${content}</body>
    </html>`;
};

export const printHtml = async (
  html,
  { copies = 1, forceDialog = false, pageSize = '', autoPageSize = false } = {}
) => {
  const documentHtml = wrapHtmlDocument(html);
  if (!documentHtml) {
    message.warning('Khong co du lieu de in.');
    return false;
  }

  const safeCopies = Math.max(1, Math.round(Number(copies) || 1));
  const explicitPageSize = normalizePageSize(pageSize);
  let resolvedPageSize = explicitPageSize;
  if (autoPageSize) {
    try {
      resolvedPageSize = await resolveAutoPageSize(documentHtml);
    } catch (error) {
      resolvedPageSize = explicitPageSize || 'A4';
    }
  }
  const htmlForPrint = injectPageSizeCss(documentHtml, resolvedPageSize);

  const hasElectronPrint =
    typeof window !== 'undefined' &&
    typeof window.electronAPI?.printHtml === 'function';

  if (hasElectronPrint) {
    try {
      const result = await window.electronAPI.printHtml(htmlForPrint, {
        copies: safeCopies,
        silent: !forceDialog,
        pageSize: resolvedPageSize,
      });
      if (result?.ok === false) {
        throw new Error(result.error || 'Print failed');
      }
      return true;
    } catch (error) {
      message.warning('Khong the in tu dong, dang mo hop thoai in.');
    }
  }

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    message.warning('Trinh duyet chan cua so in.');
    return false;
  }

  printWindow.document.write(htmlForPrint);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
  printWindow.onafterprint = () => printWindow.close();
  return true;
};

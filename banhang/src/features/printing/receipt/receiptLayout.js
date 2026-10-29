// Roll receipt layout (Settings.receiptLayout): block order, on/off, texts, font size.
export const ITEMS_STYLES = ['twoLine', 'compact'];
export const FONT_SIZE_RANGE = [9, 16];
// A receipt without lines or totals makes no sense: these stay on.
export const FORCED_BLOCKS = ['items', 'totals'];

export const DEFAULT_RECEIPT_LAYOUT = Object.freeze({
  fontSizePx: 12,
  blocks: Object.freeze(
    [
      { key: 'logo', on: false },
      { key: 'shop', on: true },
      { key: 'title', on: true, text: 'HOÁ ĐƠN BÁN HÀNG' },
      { key: 'meta', on: true },
      { key: 'customer', on: true },
      { key: 'items', on: true, style: 'twoLine' },
      { key: 'totals', on: true },
      { key: 'note', on: true },
      { key: 'qr', on: false },
      { key: 'barcode', on: false },
      { key: 'footer', on: true, text: 'Cảm ơn quý khách!' },
    ].map((block) => Object.freeze(block))
  ),
});

const DEFAULT_BLOCKS = new Map(
  DEFAULT_RECEIPT_LAYOUT.blocks.map((block) => [block.key, block])
);

const readFontSize = (value) => {
  const number = Math.round(Number(value));
  if (value === null || value === '' || !Number.isFinite(number)) {
    return DEFAULT_RECEIPT_LAYOUT.fontSizePx;
  }
  const [min, max] = FONT_SIZE_RANGE;
  return Math.min(max, Math.max(min, number));
};

// One stored block → a clean copy of its default shape (missing `on` = default).
const readBlock = (raw, fallback) => {
  const block = {
    key: fallback.key,
    on: FORCED_BLOCKS.includes(fallback.key)
      ? true
      : typeof raw?.on === 'boolean'
        ? raw.on
        : fallback.on,
  };
  if ('text' in fallback) {
    const text = typeof raw?.text === 'string' ? raw.text.trim() : '';
    block.text = text || fallback.text;
  }
  if ('style' in fallback) {
    block.style = ITEMS_STYLES.includes(raw?.style)
      ? raw.style
      : fallback.style;
  }
  return block;
};

// Stored layout → full layout: order kept, unknown/duplicate keys dropped,
// missing blocks appended with their default state.
export const normalizeReceiptLayout = (raw) => {
  const stored = Array.isArray(raw?.blocks) ? raw.blocks : [];
  const seen = new Set();
  const blocks = [];
  stored.forEach((item) => {
    const fallback = DEFAULT_BLOCKS.get(item?.key);
    if (!fallback || seen.has(fallback.key)) return;
    seen.add(fallback.key);
    blocks.push(readBlock(item, fallback));
  });
  DEFAULT_BLOCKS.forEach((fallback, key) => {
    if (!seen.has(key)) blocks.push(readBlock(null, fallback));
  });
  return { fontSizePx: readFontSize(raw?.fontSizePx), blocks };
};

export const getBlock = (layout, key) =>
  layout?.blocks?.find((block) => block.key === key) || null;

export const isBlockOn = (layout, key) => Boolean(getBlock(layout, key)?.on);

const updateBlock = (layout, key, patch) => ({
  ...layout,
  blocks: layout.blocks.map((block) =>
    block.key === key ? { ...block, ...patch } : block
  ),
});

// Designer editors: pure, return a new layout (or the same one when nothing changes).
export const moveBlock = (layout, key, delta) => {
  const from = layout.blocks.findIndex((block) => block.key === key);
  const to = from + delta;
  if (from < 0 || to < 0 || to >= layout.blocks.length) return layout;
  const blocks = [...layout.blocks];
  const [block] = blocks.splice(from, 1);
  blocks.splice(to, 0, block);
  return { ...layout, blocks };
};

export const toggleBlock = (layout, key, on) =>
  FORCED_BLOCKS.includes(key) || !getBlock(layout, key)
    ? layout
    : updateBlock(layout, key, { on: Boolean(on) });

// Raw text while typing; normalizeReceiptLayout trims it when read back.
export const setBlockText = (layout, key, text) =>
  getBlock(layout, key) && 'text' in getBlock(layout, key)
    ? updateBlock(layout, key, { text: String(text ?? '') })
    : layout;

export const setItemsStyle = (layout, style) =>
  ITEMS_STYLES.includes(style)
    ? updateBlock(layout, 'items', { style })
    : layout;

export const setFontSize = (layout, fontSizePx) => ({
  ...layout,
  fontSizePx: readFontSize(fontSizePx),
});

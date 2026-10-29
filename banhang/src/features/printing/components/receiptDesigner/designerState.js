// Receipt designer state (pure reducer): layout + logo on screen, `dirty` = unsaved.
import { readPrintSettings } from '../../domain/printSettings.js';
import {
  DEFAULT_RECEIPT_LAYOUT,
  moveBlock,
  normalizeReceiptLayout,
  setBlockText,
  setFontSize,
  setItemsStyle,
  toggleBlock,
} from '../../receipt/receiptLayout.js';

export const initDesignerState = (settings) => {
  const print = readPrintSettings(settings);
  return { layout: print.receiptLayout, logo: print.receiptLogo, dirty: false };
};

const LAYOUT_EDITS = {
  move: (layout, { key, delta }) => moveBlock(layout, key, delta),
  toggle: (layout, { key, on }) => toggleBlock(layout, key, on),
  text: (layout, { key, text }) => setBlockText(layout, key, text),
  itemsStyle: (layout, { style }) => setItemsStyle(layout, style),
  fontSize: (layout, { value }) => setFontSize(layout, value),
  reset: () => normalizeReceiptLayout(DEFAULT_RECEIPT_LAYOUT),
};

export const designerReducer = (state, action) => {
  switch (action.type) {
    case 'load': // stored settings changed: follow them unless there are edits
      return state.dirty ? state : initDesignerState(action.settings);
    case 'saved':
      return initDesignerState(action.settings);
    case 'logo':
      return action.logo === state.logo
        ? state
        : { ...state, logo: action.logo || '', dirty: true };
    default: {
      const edit = LAYOUT_EDITS[action.type];
      if (!edit) return state;
      const layout = edit(state.layout, action);
      return layout === state.layout
        ? state
        : { ...state, layout, dirty: true };
    }
  }
};

// Settings patch written by "Lưu" (texts trimmed, layout normalized).
export const toDesignerPatch = ({ layout, logo }) => ({
  receiptLayout: normalizeReceiptLayout(layout),
  receiptLogo: logo || '',
});

export const BLOCK_LABELS = {
  logo: 'Logo',
  shop: 'Thông tin cửa hàng',
  title: 'Tiêu đề',
  meta: 'Số hoá đơn & ngày giờ',
  customer: 'Khách hàng',
  items: 'Dòng hàng',
  totals: 'Tổng tiền',
  note: 'Ghi chú',
  qr: 'QR chuyển khoản',
  barcode: 'Mã vạch số hoá đơn',
  footer: 'Lời cảm ơn',
};

export const ITEMS_STYLE_OPTIONS = [
  { value: 'twoLine', label: '2 dòng' },
  { value: 'compact', label: 'Gọn' },
];

// VietQR needs a BIN and an account number (System → Cửa hàng).
export const hasBankInfo = (settings) =>
  Boolean(
    String(settings?.bankBin ?? '').trim() &&
    String(settings?.bankAccountNo ?? '').trim()
  );

import { describe, expect, it } from 'vitest';
import {
  BLOCK_LABELS,
  designerReducer,
  hasBankInfo,
  initDesignerState,
  toDesignerPatch,
} from '../components/receiptDesigner/designerState.js';
import {
  DEFAULT_RECEIPT_LAYOUT,
  getBlock,
  normalizeReceiptLayout,
} from '../receipt/receiptLayout.js';

const LOGO = 'data:image/png;base64,AAAA';
const keys = (state) => state.layout.blocks.map((block) => block.key);

describe('initDesignerState', () => {
  it('reads the stored layout and logo, not dirty', () => {
    const state = initDesignerState({
      receiptLayout: { fontSizePx: 14 },
      receiptLogo: LOGO,
    });
    expect(state.layout.fontSizePx).toBe(14);
    expect(state.logo).toBe(LOGO);
    expect(state.dirty).toBe(false);
    expect(initDesignerState({ receiptLogo: 'http://x' }).logo).toBe('');
  });
});

describe('designerReducer', () => {
  const start = initDesignerState({});

  it('applies layout edits and marks the state dirty', () => {
    let state = designerReducer(start, { type: 'move', key: 'qr', delta: -1 });
    expect(keys(state).indexOf('qr')).toBe(keys(start).indexOf('qr') - 1);
    expect(state.dirty).toBe(true);
    state = designerReducer(state, { type: 'toggle', key: 'qr', on: true });
    state = designerReducer(state, { type: 'text', key: 'title', text: 'HĐ' });
    state = designerReducer(state, { type: 'itemsStyle', style: 'compact' });
    state = designerReducer(state, { type: 'fontSize', value: 99 });
    expect(getBlock(state.layout, 'qr').on).toBe(true);
    expect(getBlock(state.layout, 'title').text).toBe('HĐ');
    expect(getBlock(state.layout, 'items').style).toBe('compact');
    expect(state.layout.fontSizePx).toBe(16);
  });

  it('ignores edits that change nothing (forced blocks, edges)', () => {
    expect(
      designerReducer(start, { type: 'toggle', key: 'items', on: false })
    ).toBe(start);
    expect(
      designerReducer(start, { type: 'move', key: 'logo', delta: -1 })
    ).toBe(start);
    expect(designerReducer(start, { type: 'unknown' })).toBe(start);
  });

  it('sets and removes the logo', () => {
    const withLogo = designerReducer(start, { type: 'logo', logo: LOGO });
    expect(withLogo).toMatchObject({ logo: LOGO, dirty: true });
    expect(designerReducer(withLogo, { type: 'logo', logo: '' }).logo).toBe('');
  });

  it('resets the layout to the default but keeps the logo', () => {
    let state = designerReducer(start, { type: 'logo', logo: LOGO });
    state = designerReducer(state, { type: 'fontSize', value: 9 });
    state = designerReducer(state, { type: 'reset' });
    expect(state.layout).toEqual(
      normalizeReceiptLayout(DEFAULT_RECEIPT_LAYOUT)
    );
    expect(state).toMatchObject({ logo: LOGO, dirty: true });
  });

  it('follows stored settings only while unedited; "saved" always reloads', () => {
    const stored = { receiptLayout: { fontSizePx: 10 } };
    expect(
      designerReducer(start, { type: 'load', settings: stored }).layout
        .fontSizePx
    ).toBe(10);
    const edited = designerReducer(start, { type: 'fontSize', value: 15 });
    expect(designerReducer(edited, { type: 'load', settings: stored })).toBe(
      edited
    );
    const saved = designerReducer(edited, { type: 'saved', settings: stored });
    expect(saved).toMatchObject({ dirty: false });
    expect(saved.layout.fontSizePx).toBe(10);
  });
});

describe('toDesignerPatch', () => {
  it('writes only the normalized layout and the logo', () => {
    const state = designerReducer(initDesignerState({}), {
      type: 'text',
      key: 'footer',
      text: '  Hẹn gặp lại  ',
    });
    const patch = toDesignerPatch(state);
    expect(Object.keys(patch).sort()).toEqual(['receiptLayout', 'receiptLogo']);
    expect(getBlock(patch.receiptLayout, 'footer').text).toBe('Hẹn gặp lại');
    expect(patch.receiptLogo).toBe('');
  });
});

describe('labels and bank info', () => {
  it('has a Vietnamese label for every block', () => {
    DEFAULT_RECEIPT_LAYOUT.blocks.forEach(({ key }) =>
      expect(BLOCK_LABELS[key]).toBeTruthy()
    );
  });

  it('needs a BIN and an account number', () => {
    expect(hasBankInfo({ bankBin: '970436', bankAccountNo: '1' })).toBe(true);
    expect(hasBankInfo({ bankBin: '970436', bankAccountNo: ' ' })).toBe(false);
    expect(hasBankInfo(undefined)).toBe(false);
  });
});

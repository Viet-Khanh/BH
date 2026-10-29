import { createScanBuffer } from '../../../utils/scanBuffer.js';

// wrapClassName of LabelPrintModal: tells its own controls from the screen behind it.
export const LABEL_PRINT_MODAL_CLASS = 'label-print-modal';

// Keys a scanner may send inside a code without breaking it (upper-case letters).
const PASSIVE_KEYS = new Set(['Shift', 'CapsLock', 'NumLock']);

const isModified = (event) => event.ctrlKey || event.altKey || event.metaKey;

const isInsideModal = (target) =>
  typeof target?.closest === 'function' &&
  Boolean(target.closest(`.${LABEL_PRINT_MODAL_CLASS}`));

// A focused button/switch of the modal clicks itself on Enter. Controls outside the
// modal (e.g. the button focus returned to) never block printing.
const isOwnControl = (target) =>
  (target?.tagName === 'BUTTON' ||
    target?.getAttribute?.('role') === 'switch') &&
  isInsideModal(target);

// Enter prints from anywhere in the label modal, except where Enter already means
// something: the modal's own button/switch or an open select (it prevents the default).
export const isPrintEnterKey = (event) =>
  event?.key === 'Enter' &&
  !event.defaultPrevented &&
  !event.repeat &&
  !event.isComposing &&
  !isModified(event) &&
  !isOwnControl(event.target);

// keydown → 'print', 'scan' (a scanner's closing Enter: swallow it, never print) or null.
// The scanner hook is off while a modal is open, so stray scans end up here.
export const createLabelKeyHandler =
  ({ buffer = createScanBuffer() } = {}) =>
  (event) => {
    const key = event?.key || '';
    const at = event?.timeStamp ?? 0;
    if (key === 'Enter') {
      if (buffer.end(at)) return 'scan';
      return isPrintEnterKey(event) ? 'print' : null;
    }
    if (isModified(event) || event.repeat || PASSIVE_KEYS.has(key)) return null;
    if (key.length === 1) buffer.push(key, at);
    else buffer.interrupt(at);
    return null;
  };

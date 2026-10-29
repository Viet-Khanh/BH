import { createScanBuffer } from '../../utils/scanBuffer.js';

// Keys a scanner may send inside a code without breaking it (upper-case letters).
const PASSIVE_KEYS = new Set(['Shift', 'CapsLock', 'NumLock']);

const isIgnored = (event) =>
  event.repeat ||
  event.isComposing ||
  event.keyCode === 229 ||
  event.ctrlKey ||
  event.altKey ||
  event.metaKey;

// DOM-free keydown handler for barcode scanners (keyboard wedge). Character keys are never
// blocked: the focused field's value is remembered when a burst starts and put back when the
// burst turns out to be a scan (fast keys + Enter). Only that closing Enter is swallowed.
export const createScanKeyHandler = ({
  onScan,
  isBlocked = () => false,
  getFocusedField = () => null,
  restoreField = () => {},
  buffer = createScanBuffer(),
}) => {
  let snapshot = null;

  const finish = (event) => {
    const code = buffer.end(event.timeStamp);
    const saved = snapshot;
    snapshot = null;
    if (!code) return;
    event.preventDefault();
    event.stopPropagation();
    if (saved) restoreField(saved);
    onScan(code);
  };

  return (event) => {
    if (isIgnored(event) || isBlocked()) return;
    const { key = '' } = event;
    if (key === 'Enter') {
      finish(event);
      return;
    }
    if (PASSIVE_KEYS.has(key)) return;
    if (key.length !== 1) {
      buffer.interrupt(event.timeStamp);
      return;
    }
    if (buffer.push(key, event.timeStamp)) snapshot = getFocusedField();
  };
};

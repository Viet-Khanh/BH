import { playBeep } from '../../utils/beep.js';

// Search-box Enter: a typed barcode/code adds its line directly. True when added;
// false (no match, no adder, a multi-word keyword or a failed search) → normal quick add.
export const quickAddByCode = async (addByCode, keyword) => {
  const code = String(keyword ?? '').trim();
  if (typeof addByCode !== 'function' || !code || /\s/.test(code)) {
    return false;
  }
  try {
    if (!(await addByCode(code))) return false;
  } catch {
    return false;
  }
  playBeep('ok');
  return true;
};

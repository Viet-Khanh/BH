// Scanner (keyboard wedge) input = keystrokes much faster than typing, ended by Enter.
export const SCAN_MAX_GAP_MS = 40;
export const SCAN_MIN_LENGTH = 4;

export const createScanBuffer = ({
  maxGap = SCAN_MAX_GAP_MS,
  minLength = SCAN_MIN_LENGTH,
} = {}) => {
  let chars = [];
  let lastAt = -Infinity;
  return {
    // 'first' = may be typing (let it through); 'scanning' = part of a scan (swallow it).
    push(char, at) {
      if (at - lastAt > maxGap) chars = [];
      chars.push(char);
      lastAt = at;
      return chars.length > 1 ? 'scanning' : 'first';
    },
    // On Enter: the scanned code, or null when this was not a scan.
    end(at) {
      const code = chars.join('');
      const isScan = chars.length >= minLength && at - lastAt <= maxGap * 2;
      chars = [];
      lastAt = -Infinity;
      return isScan ? code : null;
    },
  };
};

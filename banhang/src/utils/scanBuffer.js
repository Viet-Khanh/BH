// Scanner (keyboard wedge) input = keystrokes much faster than typing, ended by Enter.
export const SCAN_MAX_GAP_MS = 40;
export const SCAN_MIN_LENGTH = 4;

// Barcode scanners send printable ASCII; IME output (e.g. 'ễ') means typing.
const isScannerChar = (char) => /^[\x20-\x7e]$/.test(char);

export const createScanBuffer = ({
  maxGap = SCAN_MAX_GAP_MS,
  minLength = SCAN_MIN_LENGTH,
} = {}) => {
  let chars = [];
  let lastAt = -Infinity;
  let tainted = false;
  const startIfIdle = (at) => {
    if (at - lastAt <= maxGap) return false;
    chars = [];
    tainted = false;
    return true;
  };
  return {
    // Adds a character; true when it starts a new sequence (a possible scan).
    push(char, at) {
      const started = startIfIdle(at);
      chars.push(char);
      if (!isScannerChar(char)) tainted = true;
      lastAt = at;
      return started;
    },
    // An editing key (Backspace, arrows…): the current burst cannot be a scan.
    interrupt(at) {
      startIfIdle(at);
      tainted = true;
      lastAt = at;
    },
    // On Enter: the scanned code, or null when this was not a scan.
    end(at) {
      const code = chars.join('');
      const isScan =
        !tainted && chars.length >= minLength && at - lastAt <= maxGap * 2;
      chars = [];
      lastAt = -Infinity;
      tainted = false;
      return isScan ? code : null;
    },
  };
};

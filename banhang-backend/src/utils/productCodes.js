// Product codes: comparison key and sequential codes (`SP000001`, `SP000002`…).
export const DEFAULT_CODE_PREFIX = 'SP';
export const DEFAULT_CODE_DIGITS = 6;

// Codes are compared trimmed and case-insensitively.
export const toCodeKey = (value) =>
  String(value ?? '')
    .trim()
    .toLowerCase();

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Largest `<prefix><digits>` code + 1, zero-padded; longer numbers keep their length.
export const nextSequentialCode = (
  codes = [],
  { prefix = DEFAULT_CODE_PREFIX, digits = DEFAULT_CODE_DIGITS } = {}
) => {
  const pattern = new RegExp(`^${escapeRegExp(prefix)}(\\d+)$`, 'i');
  const largest = codes.reduce((max, code) => {
    const match = String(code ?? '')
      .trim()
      .match(pattern);
    if (!match) return max;
    const value = BigInt(match[1]);
    return value > max ? value : max;
  }, 0n);
  return `${prefix}${String(largest + 1n).padStart(digits, '0')}`;
};

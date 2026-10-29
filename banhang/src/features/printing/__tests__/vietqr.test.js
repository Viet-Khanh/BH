import { describe, expect, it } from 'vitest';
import {
  buildVietQrPayload,
  crc16ccitt,
  toQrDescription,
} from '../receipt/vietqr.js';

// Reads one TLV level: "0002AB..." → { '00': 'AB', ... } (order checked separately).
const parseTlv = (text) => {
  const fields = [];
  let index = 0;
  while (index < text.length) {
    const id = text.slice(index, index + 2);
    const length = Number(text.slice(index + 2, index + 4));
    fields.push([id, text.slice(index + 4, index + 4 + length)]);
    index += 4 + length;
  }
  expect(index).toBe(text.length);
  return fields;
};

const sample = {
  bin: '970436',
  accountNo: '0123456789',
  amount: 150000,
  description: 'HD0001',
};

describe('crc16ccitt', () => {
  it('matches the CCITT-FALSE check value', () => {
    expect(crc16ccitt('123456789')).toBe('29B1');
  });

  it('validates a published VietQR payload', () => {
    const published =
      '00020101021138530010A0000007270123000697041601092576788590208QRIBFTTA53037045802VN6304AE9F';
    expect(crc16ccitt(published.slice(0, -4))).toBe('AE9F');
  });

  it('pads to four uppercase hex digits', () => {
    expect(crc16ccitt('')).toBe('FFFF');
    expect(crc16ccitt('a')).toMatch(/^[0-9A-F]{4}$/);
  });
});

describe('buildVietQrPayload', () => {
  it('builds the EMVCo/VietQR fields in order', () => {
    const payload = buildVietQrPayload(sample);
    const fields = parseTlv(payload);
    expect(fields.map(([id]) => id)).toEqual([
      '00',
      '01',
      '38',
      '53',
      '54',
      '58',
      '62',
      '63',
    ]);
    const map = Object.fromEntries(fields);
    expect(map['00']).toBe('01');
    expect(map['01']).toBe('12');
    expect(map['53']).toBe('704');
    expect(map['54']).toBe('150000');
    expect(map['58']).toBe('VN');
    expect(parseTlv(map['38'])).toEqual([
      ['00', 'A000000727'],
      ['01', '00069704360110' + '0123456789'],
      ['02', 'QRIBFTTA'],
    ]);
    expect(parseTlv(parseTlv(map['38'])[1][1])).toEqual([
      ['00', '970436'],
      ['01', '0123456789'],
    ]);
    expect(parseTlv(map['62'])).toEqual([['08', 'HD0001']]);
  });

  it('appends the CRC over everything up to "6304"', () => {
    const payload = buildVietQrPayload(sample);
    expect(payload.slice(-8, -4)).toBe('6304');
    expect(payload.slice(-4)).toBe(crc16ccitt(payload.slice(0, -4)));
  });

  it('rounds the amount and needs at least 1 đồng', () => {
    const fields = (amount) =>
      Object.fromEntries(parseTlv(buildVietQrPayload({ ...sample, amount })));
    expect(fields(1234.6)['54']).toBe('1235');
    expect(buildVietQrPayload({ ...sample, amount: 0 })).toBe('');
    expect(buildVietQrPayload({ ...sample, amount: -5 })).toBe('');
    expect(buildVietQrPayload({ ...sample, amount: 'x' })).toBe('');
  });

  it('needs a 6-digit BIN and an account number', () => {
    expect(buildVietQrPayload({ ...sample, bin: '97043' })).toBe('');
    expect(buildVietQrPayload({ ...sample, bin: 'abcdef' })).toBe('');
    expect(buildVietQrPayload({ ...sample, accountNo: '  ' })).toBe('');
    const map = Object.fromEntries(
      parseTlv(buildVietQrPayload({ ...sample, accountNo: ' 0123 456 789 ' }))
    );
    expect(map['38']).toContain('01100123456789');
  });

  it('omits the additional data field without a description', () => {
    const payload = buildVietQrPayload({ ...sample, description: '---' });
    expect(parseTlv(payload).map(([id]) => id)).not.toContain('62');
  });
});

describe('toQrDescription', () => {
  it('strips diacritics and symbols and keeps 25 characters', () => {
    expect(toQrDescription('Thanh toán HĐ-0001 (Đức)')).toBe(
      'Thanh toan HD0001 Duc'
    );
    expect(toQrDescription('A'.repeat(40))).toHaveLength(25);
    expect(toQrDescription('  a   b  ')).toBe('a b');
    expect(toQrDescription(null)).toBe('');
  });
});

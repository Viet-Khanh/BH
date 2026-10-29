// VietQR (NAPAS 247 transfer to account) payload: EMVCo merchant-presented QR, TLV
// fields with 2-digit ids and lengths, ending with CRC16-CCITT-FALSE.
const NAPAS_GUID = 'A000000727';
const SERVICE_TO_ACCOUNT = 'QRIBFTTA';
const CURRENCY_VND = '704';
const MAX_DESCRIPTION = 25;

// CRC-16/CCITT-FALSE (poly 0x1021, init 0xFFFF) as 4 uppercase hex digits.
export const crc16ccitt = (text) => {
  let crc = 0xffff;
  new TextEncoder().encode(String(text)).forEach((byte) => {
    crc ^= byte << 8;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  });
  return crc.toString(16).toUpperCase().padStart(4, '0');
};

const tlv = (id, value) =>
  `${id}${String(value.length).padStart(2, '0')}${value}`;

// Transfer note: no diacritics (đ → d), only letters, digits and spaces, ≤ 25 chars.
export const toQrDescription = (text) =>
  String(text ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/[^A-Za-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_DESCRIPTION)
    .trim();

const readAccount = (accountNo) =>
  String(accountNo ?? '').replace(/[^A-Za-z0-9]/g, '');

// Dynamic QR with the amount; '' when BIN/account/amount cannot make a valid code.
export const buildVietQrPayload = ({ bin, accountNo, amount, description }) => {
  const bankBin = String(bin ?? '').trim();
  const account = readAccount(accountNo);
  const money = Math.round(Number(amount));
  if (!/^\d{6}$/.test(bankBin) || !account || !(money >= 1)) return '';
  const beneficiary = tlv('00', bankBin) + tlv('01', account);
  const merchant =
    tlv('00', NAPAS_GUID) +
    tlv('01', beneficiary) +
    tlv('02', SERVICE_TO_ACCOUNT);
  const note = toQrDescription(description);
  const body = [
    tlv('00', '01'),
    tlv('01', '12'),
    tlv('38', merchant),
    tlv('53', CURRENCY_VND),
    tlv('54', String(money)),
    tlv('58', 'VN'),
    note ? tlv('62', tlv('08', note)) : '',
    '6304',
  ].join('');
  return body + crc16ccitt(body);
};

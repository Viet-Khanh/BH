// Shop bank fields (System → Cửa hàng) ⇄ Settings.bankBin/bankAccountNo/bankAccountName.
// The bank select holds a listed BIN or OTHER_BANK (then the BIN is typed).
import { VIETQR_BANKS } from '../receipt/banks.js';

export const OTHER_BANK = 'other';
export const BIN_PATTERN = /^\d{6}$/;

const toSearchText = (value) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase();

export const BANK_OPTIONS = [
  ...VIETQR_BANKS.map(({ bin, code, name }) => ({
    value: bin,
    label: `${name} (${bin})`,
    search: toSearchText(`${name} ${code} ${bin}`),
  })),
  { value: OTHER_BANK, label: 'Khác', search: 'khac' },
];

// Select filterOption: name, code or BIN, without diacritics.
export const filterBankOption = (input, option) =>
  Boolean(option?.search?.includes(toSearchText(input).trim()));

const readText = (value) => String(value ?? '').trim();

export const toBankFormValues = (settings = {}) => {
  const bin = readText(settings?.bankBin);
  const listed = VIETQR_BANKS.some((bank) => bank.bin === bin);
  return {
    bankChoice: !bin ? undefined : listed ? bin : OTHER_BANK,
    bankOtherBin: bin && !listed ? bin : '',
    bankAccountNo: readText(settings?.bankAccountNo),
    bankAccountName: readText(settings?.bankAccountName),
  };
};

export const fromBankFormValues = (values = {}) => ({
  bankBin:
    values.bankChoice === OTHER_BANK
      ? readText(values.bankOtherBin)
      : readText(values.bankChoice),
  bankAccountNo: readText(values.bankAccountNo),
  bankAccountName: readText(values.bankAccountName),
});

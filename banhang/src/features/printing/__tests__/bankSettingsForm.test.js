import { describe, expect, it } from 'vitest';
import {
  BANK_OPTIONS,
  filterBankOption,
  fromBankFormValues,
  OTHER_BANK,
  toBankFormValues,
} from '../domain/bankSettingsForm.js';

const option = (value) => BANK_OPTIONS.find((item) => item.value === value);

describe('BANK_OPTIONS', () => {
  it('labels banks with their BIN and ends with "Khác"', () => {
    expect(option('970436').label).toBe('Vietcombank (970436)');
    expect(BANK_OPTIONS.at(-1)).toMatchObject({
      value: OTHER_BANK,
      label: 'Khác',
    });
  });
});

describe('filterBankOption', () => {
  it('matches name, code or BIN, ignoring case and diacritics', () => {
    expect(filterBankOption('vietcom', option('970436'))).toBe(true);
    expect(filterBankOption('VCB', option('970436'))).toBe(true);
    expect(filterBankOption('970436', option('970436'))).toBe(true);
    expect(filterBankOption('ban viet', option('970454'))).toBe(true);
    expect(filterBankOption('khác', option(OTHER_BANK))).toBe(true);
    expect(filterBankOption('techcom', option('970436'))).toBe(false);
  });
});

describe('toBankFormValues', () => {
  it('selects a listed BIN', () => {
    expect(
      toBankFormValues({
        bankBin: '970436',
        bankAccountNo: ' 0123 ',
        bankAccountName: 'NGUYEN VAN A',
      })
    ).toEqual({
      bankChoice: '970436',
      bankOtherBin: '',
      bankAccountNo: '0123',
      bankAccountName: 'NGUYEN VAN A',
    });
  });

  it('puts an unlisted BIN under "Khác"', () => {
    expect(toBankFormValues({ bankBin: '970999' })).toMatchObject({
      bankChoice: OTHER_BANK,
      bankOtherBin: '970999',
    });
  });

  it('leaves the select empty without a BIN', () => {
    expect(toBankFormValues({})).toMatchObject({
      bankChoice: undefined,
      bankOtherBin: '',
      bankAccountNo: '',
    });
  });
});

describe('fromBankFormValues', () => {
  it('saves the listed BIN, ignoring a leftover typed BIN', () => {
    expect(
      fromBankFormValues({
        bankChoice: '970418',
        bankOtherBin: '123456',
        bankAccountNo: '99 ',
      })
    ).toEqual({ bankBin: '970418', bankAccountNo: '99', bankAccountName: '' });
  });

  it('saves the typed BIN for "Khác" and clears on no choice', () => {
    expect(
      fromBankFormValues({ bankChoice: OTHER_BANK, bankOtherBin: ' 970999 ' })
        .bankBin
    ).toBe('970999');
    expect(fromBankFormValues({ bankChoice: undefined }).bankBin).toBe('');
  });

  it('round-trips with toBankFormValues', () => {
    const settings = {
      bankBin: '970999',
      bankAccountNo: '1',
      bankAccountName: 'A',
    };
    expect(fromBankFormValues(toBankFormValues(settings))).toEqual(settings);
  });
});

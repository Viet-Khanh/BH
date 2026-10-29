// Vietnamese banks for the VietQR block: { bin, code, name }. BINs come from the NAPAS
// list (as published by VietQR, api.vietqr.io/v2/banks); recheck when banks merge or
// rename. The settings UI also offers "Khác" to type a BIN that is not listed here.
export const VIETQR_BANKS = [
  { bin: '970436', code: 'VCB', name: 'Vietcombank' },
  { bin: '970415', code: 'ICB', name: 'VietinBank' },
  { bin: '970418', code: 'BIDV', name: 'BIDV' },
  { bin: '970405', code: 'VBA', name: 'Agribank' },
  { bin: '970407', code: 'TCB', name: 'Techcombank' },
  { bin: '970422', code: 'MB', name: 'MB' },
  { bin: '970416', code: 'ACB', name: 'ACB' },
  { bin: '970432', code: 'VPB', name: 'VPBank' },
  { bin: '970423', code: 'TPB', name: 'TPBank' },
  { bin: '970403', code: 'STB', name: 'Sacombank' },
  { bin: '970441', code: 'VIB', name: 'VIB' },
  { bin: '970437', code: 'HDB', name: 'HDBank' },
  { bin: '970443', code: 'SHB', name: 'SHB' },
  { bin: '970448', code: 'OCB', name: 'OCB' },
  { bin: '970426', code: 'MSB', name: 'MSB' },
  { bin: '970440', code: 'SEAB', name: 'SeABank' },
  { bin: '970431', code: 'EIB', name: 'Eximbank' },
  { bin: '970449', code: 'LPB', name: 'LPBank' },
  { bin: '970428', code: 'NAB', name: 'Nam A Bank' },
  { bin: '970425', code: 'ABB', name: 'ABBank' },
  { bin: '970454', code: 'VCCB', name: 'BVBank (Bản Việt)' },
  { bin: '970429', code: 'SCB', name: 'SCB' },
  { bin: '970409', code: 'BAB', name: 'Bac A Bank' },
  { bin: '970412', code: 'PVCB', name: 'PVcomBank' },
  { bin: '970419', code: 'NCB', name: 'NCB' },
  { bin: '970427', code: 'VAB', name: 'VietABank' },
  { bin: '970433', code: 'VIETBANK', name: 'Vietbank' },
  { bin: '970438', code: 'BVB', name: 'BaoViet Bank' },
  { bin: '970452', code: 'KLB', name: 'Kienlongbank' },
  { bin: '970430', code: 'PGB', name: 'PGBank' },
  { bin: '970400', code: 'SGICB', name: 'Saigonbank' },
  { bin: '970446', code: 'COOPBANK', name: 'Co-opBank' },
  { bin: '970424', code: 'SHBVN', name: 'Shinhan Bank' },
  { bin: '546034', code: 'CAKE', name: 'CAKE by VPBank' },
  { bin: '963388', code: 'TIMO', name: 'Timo' },
];

export const findBank = (bin) =>
  VIETQR_BANKS.find((bank) => bank.bin === String(bin ?? '').trim()) || null;

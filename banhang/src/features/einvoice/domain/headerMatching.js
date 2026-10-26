// Guesses the field of a provider template column from its header text.
// Headers are compared without accents, case, spaces and punctuation, so
// "Tên hàng hóa/dịch vụ (*)", "TenHangHoa" and "tên hàng hoá dịch vụ" match.
export const compactHeader = (text) =>
  String(text ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .replace(/\(\*\)/g, '')
    .replace(/[^a-z0-9%]/g, '');

// Checked in order; the first rule whose synonym equals the header wins, then
// the first (non-`exact`) rule whose synonym starts the header.
const RULES = [
  { synonyms: ['thuesuatkhac'], exact: true, column: { field: 'empty' } },
  {
    synonyms: ['kyhieu', 'kyhieuhoadon'],
    exact: true,
    column: {
      field: 'constant',
      constant: '',
      prompt: 'ký hiệu hoá đơn đang dùng, ví dụ 1C26TAA',
    },
  },
  {
    synonyms: ['sothutuhoadon', 'stthoadon', 'nhomhoadon'],
    column: { field: 'invoiceSeq' },
  },
  {
    synonyms: ['mahd', 'mahdapp', 'mahoadonapp', 'sodonhang', 'mathamchieu'],
    column: { field: 'appCode' },
  },
  { synonyms: ['sohoadongoc', 'sohdgoc'], column: { field: 'originalNumber' } },
  {
    synonyms: ['kyhieuhoadongoc', 'kyhieuhdgoc'],
    column: { field: 'originalSeries' },
  },
  {
    synonyms: ['ngayhoadongoc', 'ngayhdgoc'],
    column: { field: 'originalDate', format: 'dmy' },
  },
  {
    synonyms: ['loaidieuchinh', 'tinhchatdieuchinh'],
    column: { field: 'adjustKind' },
  },
  {
    synonyms: ['ngayhoadon', 'ngayhd', 'ngaylap'],
    column: { field: 'date', format: 'dmy' },
  },
  { synonyms: ['tenkhachhang'], column: { field: 'buyerDisplayName' } },
  {
    synonyms: ['nguoimuahang', 'tennguoimua', 'hoten', 'nguoimua'],
    column: { field: 'buyerName' },
  },
  {
    synonyms: ['tendonvi', 'tendonvimua', 'tencongty'],
    column: { field: 'companyName' },
  },
  {
    synonyms: ['masothue', 'mst', 'mstnguoimua'],
    column: { field: 'buyerTaxCode' },
  },
  {
    synonyms: ['diachi', 'diachikhachhang', 'diachinguoimua'],
    column: { field: 'buyerAddress' },
  },
  { synonyms: ['email', 'thudientu'], column: { field: 'buyerEmail' } },
  {
    synonyms: ['sodienthoai', 'dienthoai', 'sdt'],
    column: { field: 'buyerPhone' },
  },
  {
    synonyms: ['hinhthucthanhtoan', 'httt', 'hinhthuctt'],
    column: { field: 'paymentMethod', format: 'text' },
  },
  {
    synonyms: ['loaitien', 'tiente'],
    exact: true,
    column: { field: 'constant', constant: 'VND' },
  },
  {
    synonyms: ['tinhchat', 'loaihanghoa'],
    exact: true,
    column: { field: 'constant', constant: '1' },
  },
  {
    synonyms: ['stt', 'sott', 'sothutu', 'sttdong'],
    exact: true,
    column: { field: 'lineIndex' },
  },
  {
    synonyms: ['mahang', 'mahanghoa', 'mahanghoadichvu', 'mavattu'],
    column: { field: 'itemCode' },
  },
  {
    synonyms: ['tenhang', 'tenhanghoa', 'tenhanghoadichvu'],
    column: { field: 'itemName' },
  },
  { synonyms: ['dvt', 'donvitinh'], column: { field: 'unit' } },
  { synonyms: ['soluong'], column: { field: 'quantity' } },
  { synonyms: ['dongia'], column: { field: 'unitPriceBeforeTax' } },
  {
    synonyms: ['tongtien', 'tongthanhtoan', 'tongcongtienthanhtoan'],
    column: { field: 'invoiceTotal' },
  },
  {
    synonyms: ['thanhtientruocthue', 'thanhtienchuathue', 'thanhtien'],
    column: { field: 'amountBeforeTax' },
  },
  { synonyms: ['tienthue', 'tienthuegtgt'], column: { field: 'tax' } },
  {
    synonyms: ['thuesuat', 'thuesuatgtgt', 'thuegtgt', 'phantramthue', 'thue'],
    column: { field: 'vatRate', format: 'plain' },
  },
  {
    synonyms: ['tienchietkhau', 'tienck', 'chietkhau'],
    column: { field: 'discount' },
  },
  { synonyms: ['ghichu', 'diengiai'], column: { field: 'lineNote' } },
];

const findRule = (compact, test, rules = RULES) =>
  rules.find((rule) => rule.synonyms.some((synonym) => test(compact, synonym)));

const PREFIX_RULES = RULES.filter((rule) => !rule.exact);

export const guessColumn = (header) => {
  const text = String(header ?? '').trim();
  const compact = compactHeader(text);
  const rule = compact
    ? findRule(compact, (value, synonym) => value === synonym) ||
      findRule(
        compact,
        (value, synonym) => value.startsWith(synonym),
        PREFIX_RULES
      )
    : null;
  return { header: text, ...(rule ? rule.column : { field: 'empty' }) };
};

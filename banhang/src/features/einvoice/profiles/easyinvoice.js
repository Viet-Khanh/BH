// EasyInvoice (Softdreams) "Upload hóa đơn TT78" template (VERIFIED from a
// real template file; https://huongdan.hotrokekhai.com/upload-hoa-don-tt78/upload-1-hoa-don-nhieu-dong-hang-hoa).
// Rows with the same MaHD form one invoice; invoice fields on its first row.
const invoice = (header, field, extra = {}) => ({
  header,
  field,
  firstLineOnly: true,
  ...extra,
});
const empty = (header) => ({ header, field: 'empty' });

export default {
  id: 'easyinvoice',
  name: 'EasyInvoice (Softdreams)',
  purpose: 'issue',
  sheetName: 'Sheet1',
  source: {
    status: 'sample',
    url: 'https://huongdan.hotrokekhai.com/upload-hoa-don-tt78/upload-1-hoa-don-nhieu-dong-hang-hoa',
  },
  columns: [
    { header: 'MaHD', field: 'appCode' },
    invoice('NgayHoaDon', 'date', { format: 'dmy' }),
    empty('MaKhachHang'),
    invoice('TenNguoiMua', 'buyerName'),
    invoice('TenDonVi', 'companyName'),
    invoice('MaSoThue', 'buyerTaxCode'),
    invoice('DiaChiKhachHang', 'buyerAddress'),
    invoice('SoDienThoai', 'buyerPhone'),
    empty('SoBangKe'),
    empty('NgayBangKe'),
    empty('SOTKKHACH'),
    empty('TENNHKHACH'),
    invoice('HinhThucThanhToan', 'paymentMethod', { format: 'text' }),
    { header: 'ThueSuat', field: 'vatRate', format: 'easyinvoice' },
    empty('ThueSuatKhac'),
    { header: 'MaHang', field: 'itemCode' },
    { header: 'TenHangHoa', field: 'itemName' },
    { header: 'DVT', field: 'unit' },
    { header: 'SoLuong', field: 'quantity' },
    { header: 'DonGia', field: 'unitPriceBeforeTax' },
    { header: 'ThanhTien', field: 'amountBeforeTax' },
    invoice('TienTe', 'constant', { constant: 'VND' }),
    { header: 'SoTT', field: 'lineIndex' },
    { header: 'TinhChat', field: 'constant', constant: '1' },
    invoice('Email', 'buyerEmail'),
    { header: 'Ghichu', field: 'lineNote' },
    empty('TyGia'),
  ],
};

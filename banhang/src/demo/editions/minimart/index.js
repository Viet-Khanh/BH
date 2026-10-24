import products from './products.js';

export default {
  id: 'minimart',
  name: 'Tạp hoá / Minimart',
  tagline: 'Hàng tiêu dùng nhanh, nhiều mặt hàng, bán lẻ là chính.',
  appTitle: 'PHẦN MỀM BÁN HÀNG TẠP HOÁ - MINIMART',
  seed: 1101,
  codePrefix: 'TH',
  shop: {
    name: 'Tạp hoá Minh Anh',
    phone: '0901 234 567',
    address: '12 Nguyễn Trãi, P.2, Q.5, TP.HCM',
  },
  units: ['gói', 'chai', 'lon', 'hộp', 'thùng', 'kg', 'cái', 'bịch'],
  products,
  customers: [
    { name: 'Khách lẻ', phone: '', address: '', profile: 'walkin' },
    { name: 'Quán cà phê Gió Chiều', phone: '0903 111 222', address: '45 Trần Hưng Đạo, Q.5', profile: 'regular' },
    { name: 'Chị Lan (bán nước)', phone: '0904 222 333', address: 'Hẻm 18 Nguyễn Trãi', profile: 'regular' },
    { name: 'Chú Bảy xe ôm', phone: '0905 333 444', address: 'Ngã tư Nguyễn Trãi', profile: 'regular' },
    { name: 'Tiệm net Thành Đạt', phone: '0906 444 555', address: '102 An Dương Vương, Q.5', profile: 'regular' },
    { name: 'Anh Tuấn - bảo vệ chung cư', phone: '0907 555 666', address: 'Chung cư Hùng Vương', profile: 'debtor' },
    { name: 'Cô Hoa - tạp hoá đầu hẻm', phone: '0908 666 777', address: 'Hẻm 30 Nguyễn Trãi', profile: 'debtor' },
    { name: 'Bếp ăn công ty An Phát', phone: '028 3838 1234', address: 'KCN Tân Tạo', profile: 'debtor' },
  ],
  suppliers: [
    { name: 'NPP Vinamilk Quận 5', phone: '028 3855 0001', address: '10 Hùng Vương, Q.5' },
    { name: 'Đại lý nước giải khát Hưng Thịnh', phone: '0909 100 200', address: '77 Lê Hồng Phong, Q.10' },
    { name: 'Công ty TNHH Phân phối Masan', phone: '028 3822 0002', address: 'Q.1, TP.HCM' },
    { name: 'Tổng kho hoá phẩm Phú Thọ', phone: '0918 300 400', address: 'Chợ Bình Tây, Q.6' },
  ],
  expenses: [
    ['Chi vận chuyển', 'Phí ship hàng nhập', 30000, 150000],
    ['Điện nước', 'Tiền điện tủ mát', 200000, 600000],
    ['Chi khác', 'Túi ni lông, văn phòng phẩm', 20000, 100000],
  ],
  activity: {
    invoicesPerDay: [2, 4],
    maxQty: 6,
    purchaseQty: [12, 48],
    walkInRatio: 0.7,
  },
};

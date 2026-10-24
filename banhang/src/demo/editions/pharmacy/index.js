import products from './products.js';

export default {
  id: 'pharmacy',
  name: 'Nhà thuốc',
  tagline: 'Thuốc, vitamin, thiết bị y tế — bán lẻ và bán sỉ cho phòng khám.',
  appTitle: 'PHẦN MỀM BÁN HÀNG NHÀ THUỐC',
  seed: 4404,
  codePrefix: 'NT',
  shop: {
    name: 'Nhà thuốc An Khang Phúc',
    phone: '0977 567 890',
    address: '156 Phan Đăng Lưu, P.3, Q. Phú Nhuận, TP.HCM',
  },
  units: ['hộp', 'vỉ', 'viên', 'chai', 'tuýp', 'gói', 'cái'],
  products,
  customers: [
    { name: 'Khách lẻ', phone: '', address: '', profile: 'walkin' },
    {
      name: 'Cô Tư (khách quen)',
      phone: '0971 111 222',
      address: 'Q. Phú Nhuận',
      profile: 'regular',
    },
    {
      name: 'Anh Bình - huyết áp',
      phone: '0972 222 333',
      address: 'Q. Bình Thạnh',
      profile: 'regular',
    },
    {
      name: 'Chị Hạnh - mẹ bỉm',
      phone: '0973 333 444',
      address: 'Q.3, TP.HCM',
      profile: 'regular',
    },
    {
      name: 'Ông Năm - tiểu đường',
      phone: '0974 444 555',
      address: 'Q. Phú Nhuận',
      profile: 'regular',
    },
    {
      name: 'Phòng khám Đa khoa An Tâm',
      phone: '028 3995 1234',
      address: 'Q. Tân Bình',
      profile: 'debtor',
    },
    {
      name: 'Nhà thuốc Minh Châu (lấy sỉ)',
      phone: '0975 555 666',
      address: 'Q. Gò Vấp',
      profile: 'debtor',
    },
    {
      name: 'Trạm y tế phường 4',
      phone: '028 3995 5678',
      address: 'Q. Phú Nhuận',
      profile: 'debtor',
    },
  ],
  suppliers: [
    {
      name: 'Công ty Dược Hậu Giang - CN HCM',
      phone: '028 3990 0001',
      address: 'Q.10, TP.HCM',
    },
    {
      name: 'Phân phối Zuellig Pharma',
      phone: '028 3990 0002',
      address: 'Q.7, TP.HCM',
    },
    {
      name: 'Tổng kho dược phẩm Hapu',
      phone: '0976 100 200',
      address: 'Q. Tân Bình',
    },
  ],
  expenses: [
    ['Chi vận chuyển', 'Phí giao thuốc', 20000, 80000],
    ['Điện nước', 'Tiền điện tủ bảo quản', 150000, 400000],
    ['Chi khác', 'Túi, nhãn thuốc', 30000, 120000],
  ],
  activity: {
    invoicesPerDay: [2, 4],
    maxQty: 3,
    purchaseQty: [5, 20],
    walkInRatio: 0.75,
  },
};

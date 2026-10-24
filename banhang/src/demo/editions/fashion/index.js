import products from './products.js';

export default {
  id: 'fashion',
  name: 'Thời trang / Giày dép',
  tagline: 'Quần áo, giày dép, phụ kiện — bán lẻ tại quầy và bán sỉ cho shop.',
  appTitle: 'PHẦN MỀM BÁN HÀNG THỜI TRANG - GIÀY DÉP',
  seed: 3303,
  codePrefix: 'TT',
  shop: {
    name: 'Thời trang Mộc Lan',
    phone: '0938 456 789',
    address: '88 Lê Văn Sỹ, P.13, Q.3, TP.HCM',
  },
  units: ['cái', 'đôi', 'bộ', 'chiếc'],
  products,
  customers: [
    { name: 'Khách lẻ', phone: '', address: '', profile: 'walkin' },
    {
      name: 'Chị Ngọc (khách quen)',
      phone: '0931 111 222',
      address: 'Q.3, TP.HCM',
      profile: 'regular',
    },
    {
      name: 'Anh Phong',
      phone: '0932 222 333',
      address: 'Q. Phú Nhuận',
      profile: 'regular',
    },
    {
      name: 'Chị Thảo - shop online',
      phone: '0933 333 444',
      address: 'Q. Gò Vấp',
      profile: 'regular',
    },
    {
      name: 'Chị Trâm - nhân viên văn phòng',
      phone: '0934 444 555',
      address: 'Q.1, TP.HCM',
      profile: 'regular',
    },
    {
      name: 'Shop Hương Giang (lấy sỉ)',
      phone: '0935 555 666',
      address: 'Chợ Tân Bình',
      profile: 'debtor',
    },
    {
      name: 'Cửa hàng thời trang Bảo Anh',
      phone: '0936 666 777',
      address: 'Biên Hoà, Đồng Nai',
      profile: 'debtor',
    },
    {
      name: 'Chị Vy - đại lý Thủ Đức',
      phone: '0937 777 888',
      address: 'TP. Thủ Đức',
      profile: 'debtor',
    },
  ],
  suppliers: [
    {
      name: 'Xưởng may Thành Công',
      phone: '028 3815 0001',
      address: 'Q. Tân Phú, TP.HCM',
    },
    {
      name: 'Kho giày dép Chợ Lớn',
      phone: '0939 100 200',
      address: 'Q.5, TP.HCM',
    },
    {
      name: 'Nhà phân phối phụ kiện Kim Phát',
      phone: '0939 300 400',
      address: 'Q.10, TP.HCM',
    },
  ],
  expenses: [
    ['Chi vận chuyển', 'Phí giao hàng COD', 20000, 120000],
    ['Chi marketing', 'Chạy quảng cáo Facebook', 200000, 800000],
    ['Điện nước', 'Tiền điện, nước cửa hàng', 300000, 700000],
  ],
  activity: {
    invoicesPerDay: [1, 4],
    maxQty: 3,
    purchaseQty: [5, 20],
    walkInRatio: 0.65,
  },
};

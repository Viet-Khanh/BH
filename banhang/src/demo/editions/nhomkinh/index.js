import products from './products.js';

export default {
  id: 'nhomkinh',
  seed: 5505,
  codePrefix: 'NK',
  shop: {
    name: 'Nhôm kính Tân Phát',
    taxCode: '0316789012',
    phone: '0903 789 456',
    address: '68 Hồ Học Lãm, An Lạc, Bình Tân, TP.HCM',
  },
  units: ['cây', 'tấm', 'm2', 'kg', 'cái', 'bộ', 'hộp'],
  products,
  customers: [
    { name: 'Khách lẻ', phone: '', address: '', profile: 'walkin' },
    {
      name: 'Chị Hằng - chủ nhà Q.6',
      phone: '0903 121 212',
      address: 'Bình Phú, Q.6',
      profile: 'regular',
    },
    {
      name: 'Anh Long - thợ sắt',
      phone: '0904 232 323',
      address: 'Tân Tạo, Bình Tân',
      profile: 'regular',
    },
    {
      name: 'Xưởng cửa nhựa lõi thép Đại Phát',
      phone: '0905 343 434',
      address: 'Vĩnh Lộc A, Bình Chánh',
      profile: 'regular',
    },
    {
      name: 'Anh Tài - thầu nhôm kính',
      phone: '0906 454 545',
      address: 'An Lạc A, Bình Tân',
      profile: 'debtor',
    },
    {
      name: 'Công ty TNHH Nội thất Minh Khang',
      phone: '028 3762 1122',
      address: 'Q.8, TP.HCM',
      taxCode: '0312233445',
      profile: 'debtor',
    },
    {
      name: 'Chú Năm - cửa sắt Năm Hiệp',
      phone: '0907 565 656',
      address: 'Bình Hưng Hoà, Bình Tân',
      profile: 'debtor',
    },
    {
      name: 'Anh Sơn - thi công trần thả',
      phone: '0908 676 767',
      address: 'Tân Phú, TP.HCM',
      profile: 'regular',
    },
  ],
  suppliers: [
    {
      name: 'Tổng kho nhôm Xingfa Miền Nam',
      phone: '028 3750 0001',
      address: 'Q.12, TP.HCM',
    },
    {
      name: 'Kính cường lực Hải Long',
      phone: '0909 200 300',
      address: 'Hóc Môn, TP.HCM',
    },
    {
      name: 'Phụ kiện Kinlong Sài Gòn',
      phone: '028 3750 0002',
      address: 'Q.5, TP.HCM',
    },
  ],
  expenses: [
    ['Chi vận chuyển', 'Xe ba gác chở kính', 150000, 500000],
    ['Lương - công nhật', 'Thợ cắt nhôm', 300000, 700000],
    ['Điện nước', 'Tiền điện máy cắt nhôm', 200000, 600000],
  ],
  activity: {
    invoicesPerDay: [1, 3],
    maxQty: 8,
    purchaseQty: [10, 40],
    walkInRatio: 0.4,
  },
};

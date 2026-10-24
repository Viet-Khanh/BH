import products from './products.js';

export default {
  id: 'vlxd',
  name: 'Vật liệu xây dựng',
  tagline: 'Sắt thép, nhôm kính, xi măng — bán sỉ cho thầu thợ, công nợ nhiều.',
  appTitle: 'PHẦN MỀM BÁN HÀNG VẬT LIỆU XÂY DỰNG',
  seed: 2202,
  codePrefix: 'VL',
  shop: {
    name: 'VLXD Phúc Thành',
    phone: '0912 345 678',
    address: '245 Quốc lộ 1A, Bình Chánh, TP.HCM',
  },
  units: ['cây', 'tấm', 'bao', 'kg', 'm2', 'm3', 'cái', 'thùng', 'cuộn'],
  products,
  customers: [
    { name: 'Khách lẻ', phone: '', address: '', profile: 'walkin' },
    {
      name: 'Chị Mai - chủ nhà Q.7',
      phone: '0913 111 222',
      address: 'Phú Mỹ Hưng, Q.7',
      profile: 'regular',
    },
    {
      name: 'Anh Dũng - thợ điện',
      phone: '0914 222 333',
      address: 'Bình Hưng, Bình Chánh',
      profile: 'regular',
    },
    {
      name: 'Cửa hàng nhôm kính Tân Phú',
      phone: '0915 333 444',
      address: '12 Luỹ Bán Bích, Tân Phú',
      profile: 'regular',
    },
    {
      name: 'Anh Hùng - thầu xây dựng',
      phone: '0916 444 555',
      address: 'Tân Kiên, Bình Chánh',
      profile: 'debtor',
    },
    {
      name: 'Công ty TNHH Xây dựng Phúc Thịnh',
      phone: '028 3756 7890',
      address: 'KCN Lê Minh Xuân',
      profile: 'debtor',
    },
    {
      name: 'Chú Sáu - thợ hàn',
      phone: '0917 555 666',
      address: 'Vĩnh Lộc A, Bình Chánh',
      profile: 'debtor',
    },
    {
      name: 'Anh Khoa - nhôm kính Khoa Phát',
      phone: '0918 666 777',
      address: 'An Lạc, Bình Tân',
      profile: 'debtor',
    },
  ],
  suppliers: [
    {
      name: 'Tổng kho thép Hoà Phát Miền Nam',
      phone: '028 3765 0001',
      address: 'KCN Phú Mỹ, Bà Rịa',
    },
    {
      name: 'Nhà phân phối nhôm Xingfa Sài Gòn',
      phone: '0919 100 200',
      address: 'Q.12, TP.HCM',
    },
    {
      name: 'Đại lý xi măng Hà Tiên Bình Chánh',
      phone: '0919 300 400',
      address: 'Bình Chánh, TP.HCM',
    },
    {
      name: 'Công ty kính Việt Nhật',
      phone: '028 3766 0002',
      address: 'Thủ Đức, TP.HCM',
    },
  ],
  expenses: [
    ['Chi vận chuyển', 'Thuê xe tải giao hàng', 300000, 1200000],
    ['Lương - công nhật', 'Công bốc xếp', 200000, 600000],
    ['Điện nước', 'Tiền điện máy cắt', 300000, 900000],
  ],
  activity: {
    invoicesPerDay: [1, 3],
    maxQty: 10,
    purchaseQty: [10, 40],
    walkInRatio: 0.35,
  },
};

import { defineEdition } from '../../platform/defineModule.js';

export default defineEdition({
  id: 'fashion',
  config: {
    name: 'Thời trang / Giày dép',
    tagline:
      'Quần áo, giày dép, phụ kiện — bán lẻ tại quầy và bán sỉ cho shop.',
    appTitle: 'PHẦN MỀM BÁN HÀNG THỜI TRANG - GIÀY DÉP',
    defaultShopName: 'Shop thời trang',
    invoiceTagline: 'QUẦN ÁO - GIÀY DÉP - TÚI XÁCH - PHỤ KIỆN',
    features: { dimensions: false, sampleData: false },
    labels: { group: 'Danh mục', spec: 'Size / màu' },
  },
});

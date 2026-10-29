import { defineEdition } from '../../platform/defineModule.js';

export default defineEdition({
  id: 'pharmacy',
  config: {
    name: 'Nhà thuốc',
    tagline: 'Thuốc, vitamin, thiết bị y tế — bán lẻ và bán sỉ cho phòng khám.',
    appTitle: 'PHẦN MỀM BÁN HÀNG NHÀ THUỐC',
    defaultShopName: 'Nhà thuốc',
    invoiceTagline: 'THUỐC - VITAMIN - THIẾT BỊ Y TẾ',
    features: {
      dimensions: false,
      sampleData: false,
      units: false,
      barcode: false,
    },
    labels: { group: 'Nhóm thuốc', spec: 'Quy cách đóng gói' },
  },
});

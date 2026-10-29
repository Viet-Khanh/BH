import { defineEdition } from '../../platform/defineModule.js';

export default defineEdition({
  id: 'nhomkinh',
  config: {
    name: 'Nhôm kính / Sắt',
    tagline:
      'Nhôm Xingfa, kính, sắt hộp — bán theo dài × rộng, công nợ thợ thi công.',
    appTitle: 'PHẦN MỀM BÁN HÀNG NHÔM KÍNH/SẮT',
    defaultShopName: 'Cửa hàng nhôm kính',
    invoiceTagline:
      'CHUYÊN NHÔM - XINGFA - PMA - SHALUMI - KÍNH - TRẦN THẢ - ALU CÁC LOẠI',
    features: {
      dimensions: true,
      sampleData: true,
      units: false,
      barcode: false,
      labels: false,
    },
    labels: { group: 'Nhóm hàng', spec: 'Quy cách' },
  },
});

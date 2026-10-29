import { defineEdition } from '../../platform/defineModule.js';

export default defineEdition({
  id: 'vlxd',
  config: {
    name: 'Vật liệu xây dựng',
    tagline:
      'Sắt thép, xi măng, gạch, tôn — bán sỉ cho thầu thợ, công nợ nhiều.',
    appTitle: 'PHẦN MỀM BÁN HÀNG VẬT LIỆU XÂY DỰNG',
    defaultShopName: 'Cửa hàng vật liệu xây dựng',
    invoiceTagline:
      'SẮT THÉP - XI MĂNG - GẠCH - CÁT ĐÁ - TÔN - ỐNG NHỰA - ĐIỆN NƯỚC',
    features: {
      dimensions: true,
      sampleData: false,
      units: false,
      barcode: false,
      labels: false,
      sequentialCodes: false,
    },
    labels: { group: 'Nhóm hàng', spec: 'Quy cách' },
  },
});

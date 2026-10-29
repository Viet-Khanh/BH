import { defineEdition } from '../../platform/defineModule.js';

export default defineEdition({
  id: 'minimart',
  config: {
    name: 'Tạp hoá / Minimart',
    tagline: 'Hàng tiêu dùng nhanh, nhiều mặt hàng, bán lẻ là chính.',
    appTitle: 'PHẦN MỀM BÁN HÀNG TẠP HOÁ - MINIMART',
    defaultShopName: 'Cửa hàng tạp hoá',
    invoiceTagline: 'HÀNG TIÊU DÙNG - ĐỒ UỐNG - THỰC PHẨM - HOÁ PHẨM',
    features: {
      dimensions: false,
      sampleData: false,
      units: true,
      barcode: true,
      labels: true,
      sequentialCodes: true,
    },
    labels: { group: 'Ngành hàng', spec: 'Quy cách' },
  },
});

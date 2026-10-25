import { ALL_MODULES } from './modules.js';

export default {
  id: 'vlxd',
  name: 'Vật liệu xây dựng',
  tagline: 'Sắt thép, xi măng, gạch, tôn — bán sỉ cho thầu thợ, công nợ nhiều.',
  appTitle: 'PHẦN MỀM BÁN HÀNG VẬT LIỆU XÂY DỰNG',
  defaultShopName: 'Cửa hàng vật liệu xây dựng',
  invoiceTagline:
    'SẮT THÉP - XI MĂNG - GẠCH - CÁT ĐÁ - TÔN - ỐNG NHỰA - ĐIỆN NƯỚC',
  features: { dimensions: true, sampleData: false },
  modules: ALL_MODULES,
  labels: { group: 'Nhóm hàng', spec: 'Quy cách' },
};

import { GENERIC_COLUMNS } from './generic.js';

// Adjustment / replacement data: original invoice + new content.
export default {
  id: 'generic-adjust',
  name: 'Chuẩn BanHang – điều chỉnh/thay thế',
  purpose: 'adjust',
  sheetName: 'DieuChinh',
  columns: [
    { header: 'Loại', field: 'adjustKind' },
    { header: 'Số HĐ gốc', field: 'originalNumber' },
    { header: 'Ký hiệu HĐ gốc', field: 'originalSeries' },
    { header: 'Ngày HĐ gốc', field: 'originalDate', format: 'dmy' },
    ...GENERIC_COLUMNS,
  ],
};

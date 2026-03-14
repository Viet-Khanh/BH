import dayjs from 'dayjs';
import { v4 as uuid } from 'uuid';

export const buildSeedData = () => {
  const now = dayjs();

  const markActive = (items) =>
    items.map((item) => ({
      ...item,
      isDeleted: false,
      deletedAt: null,
    }));

  const units = markActive(
    ['cây', 'kg', 'tấm', 'm2', 'cái', 'hộp', 'm3'].map((name) => ({
      id: uuid(),
      name,
      note: '',
      createdAt: now.toISOString(),
    }))
  );

  const baseProducts = [
    {
      id: uuid(),
      group: 'Nhôm',
      code: 'NHOM-2525',
      name: 'Nhôm hộp 25x25',
      unit: 'cây',
      spec: '2 ly',
      avgCost: 42000,
      sellPriceDefault: 52000,
      sellPriceWholesale: 50000,
      openingStock: 40,
      note: '',
      createdAt: now.toISOString(),
    },
    {
      id: uuid(),
      group: 'Sắt',
      code: 'SAT-4040',
      name: 'Sắt hộp 40x40',
      unit: 'cây',
      spec: '2 ly',
      avgCost: 48000,
      sellPriceDefault: 62000,
      sellPriceWholesale: 60000,
      openingStock: 30,
      note: '',
      createdAt: now.toISOString(),
    },
    {
      id: uuid(),
      group: 'Kính',
      code: 'KINH-8MM',
      name: 'Kính cường lực 8mm',
      unit: 'm2',
      spec: 'Trong suốt',
      avgCost: 160000,
      sellPriceDefault: 220000,
      sellPriceWholesale: 210000,
      openingStock: 20,
      note: '',
      createdAt: now.toISOString(),
    },
    {
      id: uuid(),
      group: 'Nhôm',
      code: 'NHOM-U40',
      name: 'Nhôm U 40',
      unit: 'cây',
      spec: '1.4 ly',
      avgCost: 38000,
      sellPriceDefault: 48000,
      sellPriceWholesale: 46000,
      openingStock: 25,
      note: '',
      createdAt: now.toISOString(),
    },
    {
      id: uuid(),
      group: 'Sắt',
      code: 'SAT-V50',
      name: 'Sắt V 50',
      unit: 'cây',
      spec: '2.5 ly',
      avgCost: 52000,
      sellPriceDefault: 68000,
      sellPriceWholesale: 65000,
      openingStock: 18,
      note: '',
      createdAt: now.toISOString(),
    },
    {
      id: uuid(),
      group: 'Kính',
      code: 'KINH-638',
      name: 'Kính dán 6.38',
      unit: 'm2',
      spec: 'Xanh nhạt',
      avgCost: 180000,
      sellPriceDefault: 250000,
      sellPriceWholesale: 240000,
      openingStock: 12,
      note: '',
      createdAt: now.toISOString(),
    },
  ];

  const groupDefs = [
    { group: 'Nhôm', unit: 'cây', prefix: 'NHOM', baseCost: 36000, baseSell: 47000 },
    { group: 'Sắt', unit: 'cây', prefix: 'SAT', baseCost: 42000, baseSell: 56000 },
    { group: 'Kính', unit: 'm2', prefix: 'KINH', baseCost: 140000, baseSell: 200000 },
  ];

  const extraProducts = [];
  for (let i = baseProducts.length + 1; i <= 30; i += 1) {
    const def = groupDefs[i % groupDefs.length];
    const suffix = String(i).padStart(3, '0');
    const avgCost = def.baseCost + (i % 5) * 2000;
    const sellPriceDefault = def.baseSell + (i % 5) * 3000;
    const sellPriceWholesale = Math.max(sellPriceDefault - 2000, 0);
    extraProducts.push({
      id: uuid(),
      group: def.group,
      code: `${def.prefix}-${suffix}`,
      name: `${def.group} mẫu ${i}`,
      unit: def.unit,
      spec: '',
      avgCost,
      sellPriceDefault,
      sellPriceWholesale,
      openingStock: 10 + (i % 6) * 5,
      note: '',
      createdAt: now.toISOString(),
    });
  }

  const products = markActive([...baseProducts, ...extraProducts]);

  const customers = markActive([
    { id: uuid(), name: 'Khách lẻ', phone: '', address: '' },
    { id: uuid(), name: 'Công ty An Phát', phone: '0909 111 222', address: 'Quận 7' },
    { id: uuid(), name: 'Anh Bình', phone: '0903 456 789', address: 'Thủ Đức' },
    { id: uuid(), name: 'Chị Lan', phone: '0912 888 999', address: 'Gò Vấp' },
    { id: uuid(), name: 'Đại lý Minh Đức', phone: '0988 222 333', address: 'Bình Tân' },
    { id: uuid(), name: 'Anh Nam', phone: '0901 111 111', address: 'Quận 2' },
    { id: uuid(), name: 'Chị Hương', phone: '0913 222 333', address: 'Quận 12' },
    { id: uuid(), name: 'Cửa hàng Minh Tâm', phone: '0977 444 555', address: 'Bình Thạnh' },
    { id: uuid(), name: 'Đại lý Hoàng Long', phone: '0982 666 777', address: 'Bình Chánh' },
    { id: uuid(), name: 'Công ty Phú An', phone: '0908 555 999', address: 'Quận 9' },
  ]);

  const suppliers = markActive([
    { id: uuid(), name: 'Nhà cung cấp A', phone: '0901 222 333', address: 'Bình Dương' },
  ]);

  const purchaseId = uuid();
  const purchase = {
    id: purchaseId,
    code: `PO-${now.format('YYYYMMDD')}-101`,
    supplierId: suppliers[0].id,
    date: now.subtract(2, 'day').toISOString(),
    items: [
      {
        productId: products[0].id,
        qty: 50,
        unitCost: 42000,
        lineTotal: 2100000,
      },
      {
        productId: products[2].id,
        qty: 20,
        unitCost: 160000,
        lineTotal: 3200000,
      },
    ],
    total: 5300000,
    note: 'Nhap lo hang dau',
    isDeleted: false,
    deletedAt: null,
  };

  const invoiceId = uuid();
  const invoice = {
    id: invoiceId,
    code: `INV-${now.format('YYYYMMDD')}-201`,
    customerId: customers[1].id,
    date: now.subtract(1, 'day').toISOString(),
    items: [
      {
        productId: products[0].id,
        qty: 10,
        unitPrice: 52000,
        lineTotal: 520000,
        costPriceSnapshot: products[0].avgCost,
      },
      {
        productId: products[2].id,
        qty: 5,
        unitPrice: 220000,
        lineTotal: 1100000,
        costPriceSnapshot: products[2].avgCost,
      },
    ],
    subTotal: 1620000,
    discountTotal: 0,
    total: 1620000,
    paymentStatus: 'THU 1 PHAN',
    note: 'Giao trong tuan',
    changeLog: [],
    isDeleted: false,
    deletedAt: null,
  };

  const payment = {
    id: uuid(),
    invoiceId,
    date: now.subtract(1, 'day').toISOString(),
    method: 'cash',
    amount: 800000,
    note: 'Thu lan 1',
    isDeleted: false,
    deletedAt: null,
  };

  const cashbook = markActive([
    {
      id: uuid(),
      date: now.subtract(1, 'day').toISOString(),
      type: 'in',
      amount: 800000,
      category: 'Thu hoa don',
      note: 'INV demo',
      invoiceId,
    },
    {
      id: uuid(),
      date: now.toISOString(),
      type: 'out',
      amount: 300000,
      category: 'Chi van chuyen',
      note: 'Xang xe',
    },
  ]);

  const settings = {
    id: 'main',
    shopName: 'Cua hang nhom kinh',
    shopPhone: '0900 000 000',
    shopAddress: '123 Duong ABC, Quan 1',
    allowNegativeStock: true,
    showSensitiveInfo: false,
    lowStockThreshold: 5,
    printCopies: 1,
    invoiceTemplateHtml: '',
    isDeleted: false,
    deletedAt: null,
  };

  return {
    units,
    products,
    customers,
    suppliers,
    purchases: [purchase],
    invoices: [invoice],
    payments: [payment],
    cashbook,
    settings: [settings],
  };
};

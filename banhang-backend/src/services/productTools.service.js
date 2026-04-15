import Product from '../models/Product.js';

const normalizeProductName = (value) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

const uniqueStrings = (items = []) => [...new Set(items.filter(Boolean))];

const toOptionalNumber = (value) => {
  if (value === '' || value === null || value === undefined) return null;
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) return Number.NaN;
  return numeric;
};

export const updatePriceByName = async (rows) => {
  if (!Array.isArray(rows) || !rows.length) {
    throw new Error('Không có dữ liệu cập nhật.');
  }

  const duplicateNamesInFile = [];
  const invalidRows = [];
  const seenNames = new Map();
  const normalizedRows = [];

  rows.forEach((item, index) => {
    const rowNumber = index + 2;
    const name = String(item?.name ?? '').trim();
    const normalizedName = normalizeProductName(name);
    const avgCost = toOptionalNumber(item?.avgCost);
    const sellPriceDefault = toOptionalNumber(item?.sellPriceDefault);
    const hasInvalidNumber =
      Number.isNaN(avgCost) || Number.isNaN(sellPriceDefault);
    const changes = {};

    if (avgCost !== null && !Number.isNaN(avgCost)) changes.avgCost = avgCost;
    if (sellPriceDefault !== null && !Number.isNaN(sellPriceDefault)) {
      changes.sellPriceDefault = sellPriceDefault;
    }

    if (!normalizedName) {
      invalidRows.push({ rowNumber, reason: 'Thiếu tên sản phẩm.' });
      return;
    }
    if (hasInvalidNumber) {
      invalidRows.push({ rowNumber, name, reason: 'Giá phải là số không âm.' });
      return;
    }
    if (!Object.keys(changes).length) {
      invalidRows.push({
        rowNumber,
        name,
        reason: 'Thiếu giá vốn hoặc đơn giá lẻ.',
      });
      return;
    }
    if (seenNames.has(normalizedName)) {
      duplicateNamesInFile.push(name || seenNames.get(normalizedName));
      return;
    }

    seenNames.set(normalizedName, name);
    normalizedRows.push({ rowNumber, name, normalizedName, changes });
  });

  const products = await Product.find(
    { isDeleted: { $ne: true } },
    { id: 1, name: 1, avgCost: 1, sellPriceDefault: 1 }
  ).lean();

  const productMap = new Map();
  products.forEach((product) => {
    const normalizedName = normalizeProductName(product?.name);
    if (!normalizedName) return;
    const bucket = productMap.get(normalizedName) || [];
    bucket.push(product);
    productMap.set(normalizedName, bucket);
  });

  const missingNames = [];
  const ambiguousNames = [];
  const updates = [];

  normalizedRows.forEach((row) => {
    const matches = productMap.get(row.normalizedName) || [];
    if (!matches.length) {
      missingNames.push(row.name);
      return;
    }
    if (matches.length > 1) {
      ambiguousNames.push(row.name);
      return;
    }
    updates.push({ name: row.name, product: matches[0], changes: row.changes });
  });

  const updatedProducts = await Promise.all(
    updates.map(({ product, changes }) =>
      Product.findOneAndUpdate(
        { id: product.id },
        { $set: changes },
        { new: true }
      ).lean()
    )
  );

  return {
    updatedCount: updatedProducts.filter(Boolean).length,
    updatedNames: updates.map((item) => item.name),
    missingNames: uniqueStrings(missingNames),
    duplicateNamesInFile: uniqueStrings(duplicateNamesInFile),
    ambiguousNames: uniqueStrings(ambiguousNames),
    invalidRows,
  };
};

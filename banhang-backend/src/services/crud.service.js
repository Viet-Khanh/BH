import { v4 as uuid } from 'uuid';

export const sanitizePayload = (payload) => {
  if (!payload || typeof payload !== 'object') return {};
  const { _id, __v, ...rest } = payload;
  return rest;
};

export const ensureActive = (payload) => {
  if (payload.isDeleted === undefined) payload.isDeleted = false;
  if (payload.deletedAt === undefined) payload.deletedAt = null;
  return payload;
};

export const normalizeProductName = (value) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

export const uniqueNames = (items = []) => [...new Set(items.filter(Boolean))];

export const formatDuplicateProductMessage = (names = []) => {
  const deduped = uniqueNames(names.map((name) => String(name ?? '').trim()));
  if (!deduped.length) return 'Trùng sản phẩm.';
  const preview = deduped.slice(0, 5).join(', ');
  const suffix =
    deduped.length > 5 ? ` và ${deduped.length - 5} sản phẩm khác` : '';
  return `Trùng sản phẩm: ${preview}${suffix}.`;
};

export const findDuplicateNamesInPayload = (items = []) => {
  const seen = new Map();
  const duplicates = [];

  items.forEach((item) => {
    const rawName = String(item?.name ?? '').trim();
    const normalized = normalizeProductName(rawName);
    if (!normalized) return;
    if (seen.has(normalized)) {
      duplicates.push(rawName || seen.get(normalized));
      return;
    }
    seen.set(normalized, rawName);
  });

  return uniqueNames(duplicates);
};

export const findExistingProductNameConflicts = async (
  Model,
  items = [],
  { excludeId } = {}
) => {
  const candidates = items
    .map((item) => ({
      rawName: String(item?.name ?? '').trim(),
      normalized: normalizeProductName(item?.name),
    }))
    .filter((item) => item.normalized);

  if (!candidates.length) return [];

  const filter = { isDeleted: { $ne: true } };
  if (excludeId) filter.id = { $ne: excludeId };

  const existingProducts = await Model.find(filter, { id: 1, name: 1 }).lean();
  const existingNameSet = new Set(
    existingProducts
      .map((item) => normalizeProductName(item?.name))
      .filter(Boolean)
  );

  return uniqueNames(
    candidates
      .filter((item) => existingNameSet.has(item.normalized))
      .map((item) => item.rawName)
  );
};

export const getAllItems = async (Model, includeDeleted) => {
  const filter = includeDeleted ? {} : { isDeleted: { $ne: true } };
  return await Model.find(filter).lean();
};

export const getItemById = async (Model, id) => {
  return await Model.findOne({ id }).lean();
};

export const createItem = async (Model, payload) => {
  const cleanPayload = ensureActive(sanitizePayload(payload));
  if (Model.modelName === 'Product') {
    const duplicateNames = await findExistingProductNameConflicts(Model, [
      cleanPayload,
    ]);
    if (duplicateNames.length) {
      throw new Error(formatDuplicateProductMessage(duplicateNames));
    }
  }
  if (!cleanPayload.id) cleanPayload.id = uuid();
  return await Model.create(cleanPayload);
};

export const bulkCreateItems = async (Model, items) => {
  const payload = items.map((item) => {
    const clean = ensureActive(sanitizePayload(item));
    return { ...clean, id: clean.id || uuid() };
  });

  if (Model.modelName === 'Product') {
    const duplicateNamesInPayload = findDuplicateNamesInPayload(payload);
    if (duplicateNamesInPayload.length) {
      throw new Error(formatDuplicateProductMessage(duplicateNamesInPayload));
    }

    const duplicateNames = await findExistingProductNameConflicts(
      Model,
      payload
    );
    if (duplicateNames.length) {
      throw new Error(formatDuplicateProductMessage(duplicateNames));
    }
  }

  return await Model.insertMany(payload, { ordered: false });
};

export const updateItem = async (Model, id, payload) => {
  const cleanPayload = sanitizePayload(payload);

  if (Model.modelName === 'Product') {
    const duplicateNames = await findExistingProductNameConflicts(
      Model,
      [cleanPayload],
      { excludeId: id }
    );
    if (duplicateNames.length) {
      throw new Error(formatDuplicateProductMessage(duplicateNames));
    }
  }

  cleanPayload.id = id;
  return await Model.findOneAndUpdate(
    { id },
    { $set: cleanPayload },
    { new: true, upsert: true }
  ).lean();
};

export const deleteItem = async (Model, id) => {
  const deletedAt = new Date().toISOString();
  return await Model.findOneAndUpdate(
    { id },
    { $set: { isDeleted: true, deletedAt } },
    { new: true }
  ).lean();
};

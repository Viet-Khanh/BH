import { v4 as uuid } from 'uuid';
import Customer from '../../../models/Customer.js';
import Supplier from '../../../models/Supplier.js';
import Invoice from '../../../models/Invoice.js';
import Purchase from '../../../models/Purchase.js';
import Payment from '../../../models/Payment.js';

const DEFAULT_CUSTOMER_NAMES = ['Khách lẻ', 'Khach le'];

const TARGET_CONFIGS = {
  customers: {
    label: 'khách hàng',
    nameLabel: 'Tên khách hàng',
    requiredFields: ['name', 'openingBalance'],
    fieldLabels: {
      name: 'Tên khách hàng',
      openingBalance: 'Công nợ đầu kỳ',
    },
  },
  suppliers: {
    label: 'nhà cung cấp',
    nameLabel: 'Tên nhà cung cấp',
    requiredFields: ['name', 'openingBalance'],
    fieldLabels: {
      name: 'Tên nhà cung cấp',
      openingBalance: 'Công nợ đầu kỳ',
    },
  },
};

const createImportError = (message, payload = {}, status = 400) =>
  Object.assign(new Error(message), { status, payload });

const createGlobalIssue = (code, message) => ({
  rowNumber: null,
  field: null,
  code,
  message,
});

const createRowIssue = (rowNumber, field, code, message) => ({
  rowNumber,
  field,
  code,
  message,
});

const normalizeComparableText = (value) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const normalizeNumberString = (value) => {
  if (value === null || value === undefined || value === '') return '';

  const sanitized = String(value)
    .trim()
    .replace(/\s+/g, '')
    .replace(/[^\d.,-]/g, '');
  if (!sanitized) return '';

  const hasDot = sanitized.includes('.');
  const hasComma = sanitized.includes(',');

  if (hasDot && hasComma) {
    return sanitized.lastIndexOf(',') > sanitized.lastIndexOf('.')
      ? sanitized.replace(/\./g, '').replace(',', '.')
      : sanitized.replace(/,/g, '');
  }

  if (hasDot) {
    return /^\d{1,3}(\.\d{3})+$/.test(sanitized)
      ? sanitized.replace(/\./g, '')
      : sanitized;
  }

  if (hasComma) {
    return /^\d{1,3}(,\d{3})+$/.test(sanitized)
      ? sanitized.replace(/,/g, '')
      : sanitized.replace(',', '.');
  }

  return sanitized;
};

const parseOpeningBalanceValue = (value) => {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return { error: 'Số tiền không hợp lệ.' };
    return { value };
  }

  const raw = String(value ?? '').trim();
  if (!raw) return { value: 0 };

  const normalized = normalizeNumberString(raw);
  if (!normalized) return { error: 'Số tiền không hợp lệ.' };

  const numeric = Number(normalized);
  if (!Number.isFinite(numeric)) return { error: 'Số tiền không hợp lệ.' };

  return { value: numeric };
};

const getTargetConfig = (target) => {
  const config = TARGET_CONFIGS[target];
  if (!config) {
    throw createImportError('Target import không hợp lệ.', {}, 400);
  }
  return config;
};

const getModels = (deps = {}) =>
  deps.models || {
    Customer,
    Supplier,
    Invoice,
    Purchase,
    Payment,
  };

const getNow = (deps = {}) => deps.now?.() || new Date().toISOString();

const getId = (deps = {}) => deps.generateId?.() || uuid();

const hasOwn = (value, key) =>
  Object.prototype.hasOwnProperty.call(value || {}, key);

const buildCompositeKey = (row) =>
  [
    normalizeComparableText(row?.name),
    normalizeComparableText(row?.phone),
    normalizeComparableText(row?.address),
  ].join('|');

const buildSummary = ({
  totalRows = 0,
  validRows = [],
  errors = [],
  warnings = [],
}) => {
  const totalPositiveBalance = validRows
    .filter((row) => row.openingBalance > 0)
    .reduce((sum, row) => sum + Number(row.openingBalance || 0), 0);
  const totalNegativeBalance = validRows
    .filter((row) => row.openingBalance < 0)
    .reduce((sum, row) => sum + Number(row.openingBalance || 0), 0);

  return {
    totalRows,
    validRows: validRows.length,
    errorCount: errors.length,
    warningCount: warnings.length,
    positiveCount: validRows.filter((row) => row.openingBalance > 0).length,
    negativeCount: validRows.filter((row) => row.openingBalance < 0).length,
    zeroCount: validRows.filter((row) => row.openingBalance === 0).length,
    totalPositiveBalance,
    totalNegativeBalance,
    netBalance: totalPositiveBalance + totalNegativeBalance,
  };
};

const getMasterModel = (target, models) =>
  target === 'customers' ? models.Customer : models.Supplier;

const getMasterFilter = (target) =>
  target === 'customers'
    ? {
        isDeleted: { $ne: true },
        name: { $nin: DEFAULT_CUSTOMER_NAMES },
      }
    : {
        isDeleted: { $ne: true },
      };

const buildExistingNameErrors = async ({
  target,
  rows,
  config,
  rowErrors,
  models,
}) => {
  const validRows = rows.filter((row) => !rowErrors.has(row.rowNumber));
  if (!validRows.length) return [];

  const masterDocs = await getMasterModel(target, models).find(
    getMasterFilter(target)
  );
  const existingNames = masterDocs.reduce((map, doc) => {
    const normalizedName = normalizeComparableText(doc?.name);
    if (!normalizedName || map.has(normalizedName)) return map;
    map.set(normalizedName, String(doc.name || '').trim());
    return map;
  }, new Map());

  if (!existingNames.size) return [];

  return validRows.reduce((issues, row) => {
    const normalizedName = normalizeComparableText(row.name);
    const existingName = existingNames.get(normalizedName);
    if (!existingName) return issues;

    issues.push(
      createRowIssue(
        row.rowNumber,
        'name',
        'EXISTING_NAME',
        `${config.nameLabel} đã tồn tại trong hệ thống: ${existingName}.`
      )
    );
    rowErrors.add(row.rowNumber);
    return issues;
  }, []);
};

const normalizeRows = ({ rows, config }) => {
  const errors = [];
  const rowErrors = new Set();
  const normalizedRows = rows.map((row, index) => {
    const rowNumber =
      Number(row?.rowNumber) > 0 ? Number(row.rowNumber) : index + 2;
    const normalizedRow = {
      rowNumber,
      phone: hasOwn(row, 'phone') ? String(row.phone ?? '').trim() : '',
      address: hasOwn(row, 'address') ? String(row.address ?? '').trim() : '',
    };

    if (hasOwn(row, 'name')) {
      normalizedRow.name = String(row.name ?? '').trim();
    }

    if (hasOwn(row, 'openingBalance')) {
      const parsed = parseOpeningBalanceValue(row.openingBalance);
      if (parsed.error) {
        errors.push(
          createRowIssue(
            rowNumber,
            'openingBalance',
            'INVALID_OPENING_BALANCE',
            `${config.fieldLabels.openingBalance} không hợp lệ.`
          )
        );
        rowErrors.add(rowNumber);
        normalizedRow.openingBalance = 0;
      } else {
        normalizedRow.openingBalance = parsed.value;
      }
    }

    if (hasOwn(row, 'name') && !normalizedRow.name) {
      errors.push(
        createRowIssue(
          rowNumber,
          'name',
          'NAME_REQUIRED',
          `${config.nameLabel} không được để trống.`
        )
      );
      rowErrors.add(rowNumber);
    }

    return normalizedRow;
  });

  const seenCompositeKeys = new Map();
  normalizedRows.forEach((row) => {
    if (!row.name) return;
    const compositeKey = buildCompositeKey(row);
    const firstRowNumber = seenCompositeKeys.get(compositeKey);
    if (firstRowNumber) {
      errors.push(
        createRowIssue(
          row.rowNumber,
          'name',
          'DUPLICATE_ROW',
          `Dòng bị trùng với dòng ${firstRowNumber}.`
        )
      );
      rowErrors.add(row.rowNumber);
      return;
    }
    seenCompositeKeys.set(compositeKey, row.rowNumber);
  });

  return {
    normalizedRows,
    errors,
    rowErrors,
  };
};

const buildWarnings = ({ rows, config, rowErrors }) => {
  const warnings = [];
  const validRows = rows.filter((row) => !rowErrors.has(row.rowNumber));
  const nameGroups = new Map();

  validRows.forEach((row) => {
    const key = normalizeComparableText(row.name);
    if (!key) return;
    const current = nameGroups.get(key) || {
      rows: [],
      compositeKeys: new Set(),
    };
    current.rows.push(row);
    current.compositeKeys.add(buildCompositeKey(row));
    nameGroups.set(key, current);
  });

  nameGroups.forEach((group) => {
    if (group.compositeKeys.size <= 1) return;
    group.rows.forEach((row) => {
      warnings.push(
        createRowIssue(
          row.rowNumber,
          'name',
          'DUPLICATE_NAME',
          `${config.nameLabel} bị trùng tên với dòng khác trong file.`
        )
      );
    });
  });

  validRows.forEach((row) => {
    if (row.phone || row.address) return;
    warnings.push(
      createRowIssue(
        row.rowNumber,
        'phone',
        'MISSING_CONTACT',
        `${config.nameLabel} chưa có số điện thoại và địa chỉ.`
      )
    );
  });

  return warnings;
};

const buildValidationResult = async ({ target, rows }, deps = {}) => {
  const config = getTargetConfig(target);
  if (!Array.isArray(rows)) {
    throw createImportError('Danh sách dòng import không hợp lệ.', {}, 400);
  }

  if (!rows.length) {
    const errors = [
      createGlobalIssue('EMPTY_FILE', 'File không có dữ liệu để nhập.'),
    ];
    return {
      target,
      summary: buildSummary({
        totalRows: 0,
        validRows: [],
        errors,
        warnings: [],
      }),
      errors,
      warnings: [],
      normalizedRows: [],
    };
  }

  const fieldsPresent = new Set();
  rows.forEach((row) => {
    Object.keys(row || {}).forEach((key) => fieldsPresent.add(key));
  });

  const errors = [];
  config.requiredFields.forEach((field) => {
    if (fieldsPresent.has(field)) return;
    errors.push(
      createGlobalIssue(
        'MISSING_COLUMN',
        `Thiếu cột bắt buộc: ${config.fieldLabels[field]}.`
      )
    );
  });

  const normalized = normalizeRows({ rows, config });
  errors.push(...normalized.errors);

  const warnings = buildWarnings({
    rows: normalized.normalizedRows,
    config,
    rowErrors: normalized.rowErrors,
  });

  errors.push(
    ...(await buildExistingNameErrors({
      target,
      rows: normalized.normalizedRows,
      config,
      rowErrors: normalized.rowErrors,
      models: getModels(deps),
    }))
  );

  const hasGlobalErrors = errors.some((issue) => issue.rowNumber === null);
  const rowsForSummary = hasGlobalErrors
    ? []
    : normalized.normalizedRows.filter(
        (row) => !normalized.rowErrors.has(row.rowNumber)
      );

  return {
    target,
    summary: buildSummary({
      totalRows: rows.length,
      validRows: rowsForSummary,
      errors,
      warnings,
    }),
    errors,
    warnings,
    normalizedRows: rowsForSummary.map((row) => ({
      rowNumber: row.rowNumber,
      name: row.name,
      phone: row.phone || '',
      address: row.address || '',
      openingBalance: Number(row.openingBalance || 0),
    })),
  };
};

const buildImportDocuments = ({ target, rows, importBatchId, deps = {} }) => {
  const now = getNow(deps);
  const batchCode = importBatchId.split('-')[0].toUpperCase();
  const masters = [];
  const positiveDocs = [];
  const negativeDocs = [];

  rows.forEach((row) => {
    const masterId = getId(deps);
    const codeSuffix = String(row.rowNumber).padStart(4, '0');

    const master = {
      id: masterId,
      name: row.name,
      phone: row.phone || '',
      address: row.address || '',
      importBatchId,
    };

    if (target === 'customers') {
      master.currentDebt = Number(row.openingBalance || 0);
      master.debtUpdatedAt = now;
    }

    masters.push(master);

    if (target === 'customers') {
      if (row.openingBalance > 0) {
        positiveDocs.push({
          id: getId(deps),
          code: `ODK-KH-${batchCode}-${codeSuffix}`,
          customerId: masterId,
          date: now,
          items: [],
          subTotal: row.openingBalance,
          discountTotal: 0,
          total: row.openingBalance,
          paymentStatus: 'CHUA THU',
          note: 'Cong no dau ky import',
          importBatchId,
        });
      }

      if (row.openingBalance < 0) {
        negativeDocs.push({
          id: getId(deps),
          code: `ODK-PT-${batchCode}-${codeSuffix}`,
          customerId: masterId,
          paymentType: 'debt_receipt',
          date: now,
          method: 'migration',
          amount: Math.abs(row.openingBalance),
          note: 'So du am dau ky import',
          importBatchId,
        });
      }

      return;
    }

    if (row.openingBalance > 0) {
      positiveDocs.push({
        id: getId(deps),
        code: `ODK-NCC-${batchCode}-${codeSuffix}`,
        supplierId: masterId,
        date: now,
        items: [],
        total: row.openingBalance,
        appliedToStock: false,
        note: 'Cong no dau ky import',
        importBatchId,
      });
    }

    if (row.openingBalance < 0) {
      negativeDocs.push({
        id: getId(deps),
        code: `ODK-PC-${batchCode}-${codeSuffix}`,
        supplierId: masterId,
        paymentType: 'supplier_debt_payment',
        date: now,
        method: 'migration',
        amount: Math.abs(row.openingBalance),
        note: 'So du am dau ky import',
        importBatchId,
      });
    }
  });

  return {
    masters,
    positiveDocs,
    negativeDocs,
  };
};

const rollbackImportBatch = async (importBatchId, deps = {}) => {
  const models = getModels(deps);
  await Promise.all([
    models.Customer.deleteMany({ importBatchId }),
    models.Supplier.deleteMany({ importBatchId }),
    models.Invoice.deleteMany({ importBatchId }),
    models.Purchase.deleteMany({ importBatchId }),
    models.Payment.deleteMany({ importBatchId }),
  ]);
};

export const previewOpeningImport = async (payload, deps = {}) =>
  buildValidationResult(payload || {}, deps);

export const commitOpeningImport = async (payload, deps = {}) => {
  const validation = await buildValidationResult(payload || {}, deps);
  if (validation.errors.length) {
    throw createImportError('Dữ liệu import không hợp lệ.', validation, 400);
  }

  const models = getModels(deps);
  const importBatchId = getId(deps);
  const docs = buildImportDocuments({
    target: validation.target,
    rows: validation.normalizedRows,
    importBatchId,
    deps,
  });

  try {
    if (validation.target === 'customers') {
      await models.Customer.insertMany(docs.masters, { ordered: true });
      if (docs.positiveDocs.length) {
        await models.Invoice.insertMany(docs.positiveDocs, { ordered: true });
      }
      if (docs.negativeDocs.length) {
        await models.Payment.insertMany(docs.negativeDocs, { ordered: true });
      }
    } else {
      await models.Supplier.insertMany(docs.masters, { ordered: true });
      if (docs.positiveDocs.length) {
        await models.Purchase.insertMany(docs.positiveDocs, { ordered: true });
      }
      if (docs.negativeDocs.length) {
        await models.Payment.insertMany(docs.negativeDocs, { ordered: true });
      }
    }
  } catch (error) {
    try {
      await rollbackImportBatch(importBatchId, deps);
    } catch (rollbackError) {
      throw createImportError(
        'Import thất bại và rollback không hoàn tất. Cần kiểm tra dữ liệu ngay.',
        {
          target: validation.target,
          importBatchId,
          rollbackError: rollbackError.message,
        },
        500
      );
    }

    throw createImportError(
      'Import thất bại. Dữ liệu vừa tạo đã được rollback.',
      {
        target: validation.target,
        importBatchId,
        cause: error.message,
      },
      500
    );
  }

  return {
    target: validation.target,
    importBatchId,
    created: {
      masters: docs.masters.length,
      debtDocs: docs.positiveDocs.length + docs.negativeDocs.length,
    },
    summary: {
      ...validation.summary,
      createdMasters: docs.masters.length,
      createdDebtDocs: docs.positiveDocs.length + docs.negativeDocs.length,
    },
  };
};

import Product from '../models/Product.js';
import {
  DEFAULT_CODE_DIGITS,
  DEFAULT_CODE_PREFIX,
  nextSequentialCode,
  toCodeKey,
} from '../utils/productCodes.js';
import { unitError } from '../utils/productUnits.js';
import { collectBarcodes } from './productBarcodes.service.js';

const isBlank = (value) => value === undefined || String(value).trim() === '';

const parseNextCodeOptions = (query = {}) => {
  const prefix = isBlank(query.prefix)
    ? DEFAULT_CODE_PREFIX
    : String(query.prefix).trim();
  if (!/^[A-Za-z]{1,5}$/.test(prefix)) {
    throw unitError('Tiền tố mã hàng chỉ gồm 1–5 chữ cái.');
  }
  const digits = isBlank(query.digits)
    ? DEFAULT_CODE_DIGITS
    : Number(query.digits);
  if (!Number.isInteger(digits) || digits < 3 || digits > 10) {
    throw unitError('Số chữ số của mã hàng phải từ 3 đến 10.');
  }
  return { prefix, digits };
};

// Next sequential code over all products, deleted included, so codes are never reused.
export const getNextProductCode = async (query = {}, Model = Product) => {
  const options = parseNextCodeOptions(query);
  const products = await Model.find({}, { code: 1 }).lean();
  return {
    code: nextSequentialCode(
      products.map((product) => product.code),
      options
    ),
  };
};

export const normalizeProductCode = (payload) =>
  typeof payload.code === 'string'
    ? { ...payload, code: payload.code.trim() }
    : payload;

const codeTaken = (code, owner) =>
  unitError(`Mã hàng ${code} đã dùng cho hàng ${owner.name || ''}.`);

const barcodeIsCode = (barcode, owner) =>
  unitError(`Mã vạch ${barcode} trùng mã hàng của ${owner.name || ''}.`);

const ownersBy = (products, keysOf) => {
  const owners = new Map();
  products.forEach((product) =>
    keysOf(product).forEach((key) => {
      if (!owners.has(key)) owners.set(key, product);
    })
  );
  return owners;
};

const codeKeys = (product) => {
  const key = toCodeKey(product.code);
  return key ? [key] : [];
};
const barcodeKeys = (product) => collectBarcodes(product).map(toCodeKey);

// Codes repeated inside one payload (another row's code or barcode).
const assertNoPayloadDuplicates = (payloads) => {
  payloads.forEach((product, index) => {
    const key = toCodeKey(product.code);
    if (!key) return;
    const owner = payloads.find(
      (other, otherIndex) =>
        otherIndex !== index &&
        ((otherIndex < index && codeKeys(other).includes(key)) ||
          barcodeKeys(other).includes(key))
    );
    if (owner) throw codeTaken(String(product.code).trim(), owner);
  });
};

// Throws a 400 error when a code is used by another active product (as code
// or barcode) or a barcode equals another active product's code.
export const assertCodesAvailable = async (Model, payloads = []) => {
  const checks = payloads.filter(
    (product) => codeKeys(product).length || barcodeKeys(product).length
  );
  if (!checks.length) return;
  assertNoPayloadDuplicates(payloads);
  const ids = new Set(payloads.map((product) => product.id).filter(Boolean));
  const others = (
    await Model.find(
      { isDeleted: { $ne: true } },
      { id: 1, name: 1, code: 1, barcode: 1, units: 1 }
    ).lean()
  ).filter((product) => !ids.has(product.id));
  const codeOwners = ownersBy(others, codeKeys);
  const barcodeOwners = ownersBy(others, barcodeKeys);
  checks.forEach((product) => {
    const key = toCodeKey(product.code);
    const owner = key && (codeOwners.get(key) || barcodeOwners.get(key));
    if (owner) throw codeTaken(String(product.code).trim(), owner);
    collectBarcodes(product).forEach((barcode) => {
      const codeOwner = codeOwners.get(toCodeKey(barcode));
      if (codeOwner) throw barcodeIsCode(barcode, codeOwner);
    });
  });
};

// What an update must check: the code only when it changes, barcodes only when sent.
export const buildUpdateCodeCheck = (id, payload, existing) => {
  const check = { id, name: payload.name ?? existing.name };
  if (
    payload.code !== undefined &&
    toCodeKey(payload.code) !== toCodeKey(existing.code)
  ) {
    check.code = payload.code;
  }
  if (payload.barcode !== undefined || payload.units !== undefined) {
    check.barcode = payload.barcode ?? existing.barcode;
    check.units = payload.units ?? existing.units;
  }
  return check;
};

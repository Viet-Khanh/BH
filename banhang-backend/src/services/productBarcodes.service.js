import { unitError } from '../utils/productUnits.js';

// Barcodes of products and their packaging units are unique across active products.
export const normalizeProductBarcode = (payload) => {
  if (payload.barcode === undefined) return payload;
  const { barcode, ...rest } = payload;
  const code = String(barcode ?? '').trim();
  return code ? { ...rest, barcode: code } : rest;
};

export const collectBarcodes = (product = {}) =>
  [product.barcode, ...(product.units || []).map((unit) => unit?.barcode)]
    .map((code) => String(code ?? '').trim())
    .filter(Boolean);

const assertNoDuplicates = (payloads) => {
  const owners = new Map();
  payloads.forEach((product) => {
    const codes = collectBarcodes(product);
    codes.forEach((code, index) => {
      if (codes.indexOf(code) !== index) {
        throw unitError(`Mã vạch ${code} bị trùng trong cùng hàng.`);
      }
      const owner = owners.get(code);
      if (owner) {
        throw unitError(
          `Mã vạch ${code} đã dùng cho hàng ${owner.name || ''}.`
        );
      }
      owners.set(code, product);
    });
  });
};

// Throws a 400 error when a barcode is repeated or used by another active product.
export const assertBarcodesAvailable = async (Model, payloads = []) => {
  assertNoDuplicates(payloads);
  const codes = payloads.flatMap(collectBarcodes);
  if (!codes.length) return;
  const ids = new Set(payloads.map((product) => product.id).filter(Boolean));
  const others = await Model.find({
    isDeleted: { $ne: true },
    $or: [{ barcode: { $in: codes } }, { 'units.barcode': { $in: codes } }],
  }).lean();
  const wanted = new Set(codes);
  others
    .filter((product) => !ids.has(product.id))
    .forEach((product) => {
      const code = collectBarcodes(product).find((value) => wanted.has(value));
      if (code) {
        throw unitError(
          `Mã vạch ${code} đã dùng cho hàng ${product.name || ''}.`
        );
      }
    });
};

// What changed in a sale since its e-invoice document was exported, so the
// shop knows what the adjustment/replacement invoice must contain.
const BUYER_FIELDS = ['name', 'companyName', 'taxCode', 'address', 'email'];
const LINE_FIELDS = [
  'name',
  'unit',
  'quantity',
  'unitPrice',
  'amount',
  'vatRate',
  'note',
];
const TOTAL_FIELDS = ['beforeTax', 'tax', 'total'];

const same = (a, b) => String(a ?? '') === String(b ?? '');

const fieldChanges = (before = {}, after = {}, fields) =>
  fields
    .filter((field) => !same(before[field], after[field]))
    .map((field) => ({ field, before: before[field], after: after[field] }));

// Lines are paired by product code + name, in order of appearance, so a
// reordered or inserted line does not mark every following line as changed.
const lineKey = (line) => `${line.code || ''}|${line.name || ''}`;

const keyed = (lines = []) => {
  const seen = new Map();
  return lines.map((line) => {
    const key = lineKey(line);
    const occurrence = seen.get(key) || 0;
    seen.set(key, occurrence + 1);
    return { key: `${key}#${occurrence}`, line };
  });
};

const diffLines = (beforeLines, afterLines) => {
  const before = keyed(beforeLines);
  const after = keyed(afterLines);
  const afterByKey = new Map(after.map((entry) => [entry.key, entry.line]));
  const beforeKeys = new Set(before.map((entry) => entry.key));
  const changes = [];
  before.forEach(({ key, line }) => {
    const next = afterByKey.get(key);
    if (!next) {
      changes.push({ type: 'removed', before: line });
      return;
    }
    const fields = fieldChanges(line, next, LINE_FIELDS);
    if (fields.length)
      changes.push({ type: 'changed', before: line, after: next, fields });
  });
  after
    .filter(({ key }) => !beforeKeys.has(key))
    .forEach(({ line }) => changes.push({ type: 'added', after: line }));
  return changes;
};

// `after === null` means the sale was deleted.
export const diffDocuments = (before, after) => {
  if (!before) return null;
  if (!after) {
    return {
      deleted: true,
      date: null,
      buyer: [],
      lines: (before.lines || []).map((line) => ({
        type: 'removed',
        before: line,
      })),
      totals: fieldChanges(before.totals, {}, TOTAL_FIELDS),
    };
  }
  return {
    deleted: false,
    date: same(before.date, after.date)
      ? null
      : { before: before.date, after: after.date },
    buyer: fieldChanges(before.buyer, after.buyer, BUYER_FIELDS),
    lines: diffLines(before.lines, after.lines),
    totals: fieldChanges(before.totals, after.totals, TOTAL_FIELDS),
  };
};

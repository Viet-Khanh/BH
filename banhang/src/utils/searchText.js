export const normalizeSearchText = (value) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

export const buildSearchText = (record) =>
  Object.values(record ?? {})
    .filter((value) => value !== null && value !== undefined)
    .join(' ');

export const hasSearchMatch = (record, keyword) => {
  const normalizedKeyword = normalizeSearchText(keyword);
  if (!normalizedKeyword) return true;
  const haystack = normalizeSearchText(buildSearchText(record));
  return normalizedKeyword.split(' ').every((term) => haystack.includes(term));
};

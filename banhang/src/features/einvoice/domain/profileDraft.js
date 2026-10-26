// Pure edits of a custom profile draft (used by the profile editor).
export const moveColumn = (columns, index, offset) => {
  const target = index + offset;
  if (target < 0 || target >= columns.length) return columns;
  const next = [...columns];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
};

export const updateColumn = (columns, index, patch) =>
  columns.map((column, position) => {
    if (position !== index) return column;
    const next = { ...column, ...patch };
    // A new field starts with its default format and no stale constant.
    if (patch.field && patch.field !== column.field) {
      delete next.format;
      if (patch.field !== 'constant') delete next.constant;
    }
    return next;
  });

export const removeColumn = (columns, index) =>
  columns.filter((_, position) => position !== index);

export const addColumn = (columns) => [
  ...columns,
  { header: `Cột ${columns.length + 1}`, field: 'empty' },
];

// Copy of any profile (built-in or custom) as a new custom profile.
export const copyProfile = (profile) => ({
  ...structuredClone({ ...profile, custom: undefined, source: undefined }),
  id: `custom-${Date.now().toString(36)}`,
  name: `${profile.name} (bản sao)`,
});

export const validateDraft = (draft) => {
  if (!String(draft.name || '').trim()) return 'Nhập tên mẫu.';
  if (!draft.columns.length) return 'Mẫu cần ít nhất một cột.';
  if (draft.columns.some((column) => !String(column.header || '').trim()))
    return 'Cột nào cũng cần tiêu đề.';
  return null;
};

export const saveDraft = (profiles = [], draft) => {
  const clean = { ...draft, name: draft.name.trim() };
  delete clean.custom;
  return profiles.some((profile) => profile.id === clean.id)
    ? profiles.map((profile) => (profile.id === clean.id ? clean : profile))
    : [...profiles, clean];
};

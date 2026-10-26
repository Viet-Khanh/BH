// Export status shown in the e-invoice screen (see backend domain/status.js).
export const STATUS_OPTIONS = [
  { value: 'pending', label: 'Chưa xuất', color: 'default' },
  { value: 'exported', label: 'Đã xuất', color: 'green' },
  { value: 'changed', label: 'Sửa sau khi xuất', color: 'red' },
];

// List filters: statuses + reconciliation view + everything.
export const FILTER_OPTIONS = [
  ...STATUS_OPTIONS,
  { value: 'unnumbered', label: 'Đã xuất, chưa có số HĐĐT' },
  { value: 'all', label: 'Tất cả' },
];

export const getStatusOption = (status) =>
  STATUS_OPTIONS.find((option) => option.value === status) || STATUS_OPTIONS[0];

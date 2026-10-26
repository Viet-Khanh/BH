// Export status shown in the e-invoice screen (see backend domain/status.js).
export const STATUS_OPTIONS = [
  { value: 'pending', label: 'Chưa xuất', color: 'default' },
  { value: 'exported', label: 'Đã xuất', color: 'green' },
  { value: 'changed', label: 'Sửa sau khi xuất', color: 'red' },
  { value: 'all', label: 'Tất cả' },
];

export const getStatusOption = (status) =>
  STATUS_OPTIONS.find((option) => option.value === status) || STATUS_OPTIONS[0];

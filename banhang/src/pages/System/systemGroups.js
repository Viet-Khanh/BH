// Groups of the System page (left menu), in display order.
// `flag` (optional) hides a group unless that edition feature is on.
export const DEFAULT_GROUP_KEY = 'shop';

export const SYSTEM_GROUPS = [
  { key: 'shop', label: 'Cửa hàng' },
  { key: 'sales', label: 'Bán hàng & kho' },
  { key: 'printing', label: 'In ấn' },
  { key: 'einvoice', label: 'Hoá đơn điện tử' },
  { key: 'security', label: 'Bảo mật' },
  { key: 'data', label: 'Dữ liệu' },
];

const toPredicate = (flags) =>
  typeof flags === 'function' ? flags : (name) => Boolean(flags?.[name]);

// `flags`: `{ name: boolean }` or a `(name) => boolean` predicate.
export const getVisibleGroups = (flags = {}, groups = SYSTEM_GROUPS) => {
  const hasFlag = toPredicate(flags);
  return groups.filter((group) => !group.flag || hasFlag(group.flag));
};

// Key to show for a requested key; unknown or hidden keys fall back to `shop`.
export const resolveGroupKey = (key, visibleGroups) =>
  visibleGroups.some((group) => group.key === key) ? key : DEFAULT_GROUP_KEY;

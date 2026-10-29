// Values loaded into the catalog form when editing. The form is reset first,
// so a product without `units` must get [] or it would keep the previous one's.
export const buildEditFormValues = (record, activeKey) =>
  activeKey === 'products'
    ? { ...record, units: record?.units || [] }
    : { ...record };

// Every extension point core exposes. Modules may only fill these names.
// Add a slot: name it here, render/resolve it in core with a fallback,
// document it in ./README.md.
export const SLOTS = {
  salesItemsTable: 'sales.itemsTable',
  purchasesItemsTable: 'purchases.itemsTable',
  catalogProductFields: 'catalog.productFields',
  printItemColumns: 'print.itemColumns',
};

export const SLOT_NAMES = Object.values(SLOTS);

// Module override for an extension point, or core's fallback.
export const resolveSlotIn = (activeModule, name, fallback) => {
  if (!SLOT_NAMES.includes(name)) throw new Error(`Unknown slot "${name}"`);
  return activeModule.slots[name] ?? fallback;
};

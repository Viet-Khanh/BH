const isPlainObject = (value) =>
  Boolean(value) && Object.getPrototypeOf(value) === Object.prototype;

// Plain objects merge key by key; arrays, functions and scalars are replaced.
export const deepMerge = (base, override) => {
  if (override === undefined) return base;
  if (!isPlainObject(base) || !isPlainObject(override)) return override;
  const keys = new Set([...Object.keys(base), ...Object.keys(override)]);
  return Object.fromEntries(
    [...keys].map((key) => [key, deepMerge(base[key], override[key])])
  );
};

// Active app definition: edition, then customer on top (later wins).
export const composeModules = (edition, customer = null) => {
  if (customer && customer.extends !== edition.id) {
    throw new Error(
      `Customer "${customer.id}" extends "${customer.extends}", not "${edition.id}"`
    );
  }
  const layers = customer ? [edition, customer] : [edition];
  const hiddenModules = [
    ...new Set(layers.flatMap((layer) => layer.hideModules)),
  ];
  const visible = (entry) => !hiddenModules.includes(entry.module);
  return Object.freeze({
    editionId: edition.id,
    customerId: customer?.id || null,
    config: layers.reduce(
      (config, layer) => deepMerge(config, layer.config),
      {}
    ),
    routes: layers.flatMap((layer) => layer.routes).filter(visible),
    homeTiles: layers.flatMap((layer) => layer.homeTiles).filter(visible),
    hiddenModules,
    slots: Object.assign({}, ...layers.map((layer) => layer.slots)),
  });
};

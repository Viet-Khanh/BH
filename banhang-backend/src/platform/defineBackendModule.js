// Backend part of an edition/customer module (see banhang/src/platform/README.md).
// Routers are mounted after core routes; models/services live in the module folder.
export const defineBackendModule = (module) => {
  if (!module?.id) throw new Error('Backend module: missing id');
  const routers = module.routers || [];
  routers.forEach(([prefix, router]) => {
    if (!String(prefix).startsWith('/api/')) {
      throw new Error(
        `Backend module "${module.id}": prefix "${prefix}" must start with /api/`
      );
    }
    if (typeof router?.handle !== 'function') {
      throw new Error(
        `Backend module "${module.id}": "${prefix}" is not a router`
      );
    }
  });
  return Object.freeze({ id: module.id, routers });
};

import { existsSync } from 'node:fs';

const DEFAULT_EDITION = 'nhomkinh';
const MODULE_ID_PATTERN = /^[a-z0-9-]+$/;

// The installer writes BANHANG_EDITION / BANHANG_CUSTOMER into .env.
export const readModuleSelection = (env = process.env) => ({
  edition: env.BANHANG_EDITION || DEFAULT_EDITION,
  customer: env.BANHANG_CUSTOMER || null,
});

const moduleUrl = (kind, id) => {
  if (!MODULE_ID_PATTERN.test(id)) {
    throw new Error(`Invalid ${kind} id "${id}"`);
  }
  return new URL(`../${kind}/${id}/index.js`, import.meta.url);
};

// Most editions only change the frontend, so a missing folder is not an error.
// Installers also delete the folders of modules they do not ship.
const importModule = async (kind, id) => {
  const url = moduleUrl(kind, id);
  if (!existsSync(url)) return null;
  return (await import(/* @vite-ignore */ url.href)).default;
};

export const loadBackendModules = async ({
  edition = DEFAULT_EDITION,
  customer = null,
} = {}) => {
  const modules = [await importModule('editions', edition)];
  if (customer) modules.push(await importModule('customers', customer));
  return modules.filter(Boolean);
};

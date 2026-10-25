import { EDITION_IDS } from '../src/editions/catalog.js';
import { resolveBuildTarget } from '../src/platform/buildTarget.js';

const VIRTUAL_ID = 'virtual:banhang-modules';
const RESOLVED_ID = `\0${VIRTUAL_ID}`;

const editionPath = (id) => `/src/editions/${id}/index.js`;
const customerPath = (id) => `/src/customers/${id}/index.js`;

const allEditionsSource = () => {
  const imports = EDITION_IDS.map(
    (id, index) => `import edition${index} from '${editionPath(id)}';`
  );
  const list = EDITION_IDS.map((_, index) => `edition${index}`).join(', ');
  return [
    ...imports,
    `export const editions = [${list}];`,
    'export const customer = null;',
    'export const selectable = true;',
  ].join('\n');
};

// Source of `virtual:banhang-modules`: the edition/customer modules a bundle contains.
// Real builds: one edition (+ customer). Demo/test: every edition, never customers.
export const buildModulesSource = ({
  allEditions = false,
  edition,
  customer,
} = {}) => {
  if (allEditions) return allEditionsSource();
  const target = resolveBuildTarget({ edition, customer });
  return [
    `import edition from '${editionPath(target.edition)}';`,
    target.customer
      ? `import customerModule from '${customerPath(target.customer)}';`
      : 'const customerModule = null;',
    'export const editions = [edition];',
    'export const customer = customerModule;',
    'export const selectable = false;',
  ].join('\n');
};

export const banhangModules = (options) => {
  const source = buildModulesSource(options); // invalid ids fail before the build starts
  return {
    name: 'banhang-modules',
    resolveId: (id) => (id === VIRTUAL_ID ? RESOLVED_ID : null),
    load: (id) => (id === RESOLVED_ID ? source : null),
  };
};

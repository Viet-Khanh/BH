import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, it } from 'vitest';
import { CUSTOMER_CATALOG } from '../../customers/catalog.js';

const SRC = fileURLToPath(new URL('../..', import.meta.url));
const CATALOGS = new Set(['editions/catalog.js', 'customers/catalog.js']);
const DEMO_ENTRY_POINTS = new Set(['main.jsx', 'db/transport.js']);
const IMPORT_PATTERN =
  /(?:from\s*|import\s*\(\s*|import\s+)['"](\.{1,2}\/[^'"]+)['"]/g;

const listSources = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      return name === '__tests__' ? [] : listSources(path);
    }
    return /\.(js|jsx)$/.test(name) ? [path] : [];
  });

// Which architectural layer a src-relative path belongs to.
const classify = (file) => {
  if (CATALOGS.has(file)) return { layer: 'catalog' };
  const [top, id] = file.split('/');
  if (top === 'editions') return { layer: 'edition', id };
  if (top === 'customers') return { layer: 'customer', id };
  if (top === 'platform' || top === 'demo') return { layer: top };
  return { layer: 'core' };
};

const isAllowed = (from, to, file) => {
  if (to.layer === 'catalog') return true;
  switch (from.layer) {
    case 'core':
      if (to.layer === 'demo') return DEMO_ENTRY_POINTS.has(file);
      return to.layer === 'core' || to.layer === 'platform';
    case 'platform':
      return to.layer === 'core' || to.layer === 'platform';
    case 'demo':
      return to.layer !== 'customer' && to.layer !== 'edition';
    case 'edition':
      return (
        ['core', 'platform'].includes(to.layer) ||
        (to.layer === 'edition' && to.id === from.id)
      );
    case 'customer':
      return (
        ['core', 'platform'].includes(to.layer) ||
        (to.layer === 'customer' && to.id === from.id) ||
        (to.layer === 'edition' && to.id === CUSTOMER_CATALOG[from.id]?.edition)
      );
    default:
      return false;
  }
};

const findViolations = () =>
  listSources(SRC).flatMap((path) => {
    const file = relative(SRC, path);
    const from = classify(file);
    return [...readFileSync(path, 'utf8').matchAll(IMPORT_PATTERN)]
      .map((match) => relative(SRC, resolve(dirname(path), match[1])))
      .filter((target) => !target.startsWith('..'))
      .filter((target) => !isAllowed(from, classify(target), file))
      .map((target) => `${file} -> ${target}`);
  });

it('keeps core, platform, editions and customers within their boundaries', () => {
  expect(findViolations()).toEqual([]);
});

it('detects violations (self-check)', () => {
  const core = classify('pages/Home.jsx');
  expect(isAllowed(core, classify('editions/pharmacy/index.js'), 'x')).toBe(
    false
  );
  expect(
    isAllowed(
      classify('customers/example/index.js'),
      classify('editions/pharmacy/x.js'),
      'x'
    )
  ).toBe(false);
  expect(
    isAllowed(
      classify('customers/example/index.js'),
      classify('editions/nhomkinh/x.js'),
      'x'
    )
  ).toBe(true);
});

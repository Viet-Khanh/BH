import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, it } from 'vitest';

const SRC = fileURLToPath(new URL('..', import.meta.url));
const IMPORT_PATTERN =
  /(?:from\s*|import\s*\(\s*|import\s+)['"](\.{1,2}\/[^'"]+)['"]/g;

const listSources = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      return name === '__tests__' ? [] : listSources(path);
    }
    return name.endsWith('.js') ? [path] : [];
  });

const classify = (file) => {
  const [top, id] = file.split('/');
  if (top === 'editions' || top === 'customers') return { layer: top, id };
  if (top === 'platform') return { layer: 'platform' };
  return { layer: 'core' };
};

// Core and platform never depend on modules; a module may use core, platform and itself.
const isAllowed = (from, to) => {
  if (to.layer === 'core' || to.layer === 'platform') return true;
  if (from.layer === 'core' || from.layer === 'platform') return false;
  return to.layer === from.layer && to.id === from.id;
};

const findViolations = () =>
  listSources(SRC).flatMap((path) => {
    const file = relative(SRC, path);
    const from = classify(file);
    return [...readFileSync(path, 'utf8').matchAll(IMPORT_PATTERN)]
      .map((match) => relative(SRC, resolve(dirname(path), match[1])))
      .filter((target) => !isAllowed(from, classify(target)))
      .map((target) => `${file} -> ${target}`);
  });

it('keeps backend core, platform and modules within their boundaries', () => {
  expect(findViolations()).toEqual([]);
});

it('detects violations (self-check)', () => {
  expect(
    isAllowed(classify('routes/index.js'), classify('customers/x/a.js'))
  ).toBe(false);
  expect(
    isAllowed(classify('editions/a/x.js'), classify('editions/b/y.js'))
  ).toBe(false);
  expect(
    isAllowed(classify('customers/x/a.js'), classify('services/s.js'))
  ).toBe(true);
});

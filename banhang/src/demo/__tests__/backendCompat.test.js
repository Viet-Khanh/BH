import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { SUPPORTED_UPDATE_OPERATORS } from '../db/applyUpdate.js';
import { SUPPORTED_MODEL_METHODS } from '../db/DemoModel.js';
import { SUPPORTED_QUERY_OPERATORS } from '../db/queryTools.js';

const BACKEND_SRC = fileURLToPath(
  new URL('../../../../banhang-backend/src', import.meta.url)
);
// app.js, index.js and seedData.js only run in the real server.
const SERVER_ONLY = new Set(['app.js', 'index.js', 'seedData.js']);
const MODEL_NAMES =
  'Model|Product|Customer|Supplier|Purchase|Invoice|Payment|Cashbook|Settings|Unit';
const QUERY_ONLY_METHODS = [
  'select',
  'populate',
  'skip',
  'exec',
  'distinct',
  'countDocuments',
  'aggregate',
  'session',
  'cursor',
];

const listSources = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      return name === '__tests__' ? [] : listSources(path);
    }
    return name.endsWith('.js') && !SERVER_ONLY.has(name) ? [path] : [];
  });

const sources = listSources(BACKEND_SRC).map((path) => ({
  path,
  code: readFileSync(path, 'utf8'),
}));

const collect = (regex) => [
  ...new Set(
    sources.flatMap(({ code }) =>
      [...code.matchAll(regex)].map((match) => match[1])
    )
  ),
];

describe('backend compatibility with demo shims', () => {
  it('only uses supported model methods', () => {
    const used = collect(
      new RegExp(`\\b(?:${MODEL_NAMES})\\.([a-zA-Z]+)\\(`, 'g')
    );
    expect(
      used.filter((name) => !SUPPORTED_MODEL_METHODS.includes(name))
    ).toEqual([]);
  });

  it('only uses supported query/update operators', () => {
    const supported = [
      ...SUPPORTED_QUERY_OPERATORS,
      ...SUPPORTED_UPDATE_OPERATORS,
    ];
    const used = collect(/(?<![\w$])(\$[a-zA-Z]+)\b/g);
    expect(used.filter((operator) => !supported.includes(operator))).toEqual(
      []
    );
  });

  it('never calls mongoose-only query helpers', () => {
    const used = collect(
      new RegExp(`\\.(${QUERY_ONLY_METHODS.join('|')})\\(`, 'g')
    );
    expect(used).toEqual([]);
  });

  it('services and modules never import mongoose directly', () => {
    const offenders = sources
      .filter(({ path }) => !path.includes('/models/'))
      .filter(({ code }) => /from ['"]mongoose['"]/.test(code))
      .map(({ path }) => path);
    expect(offenders).toEqual([]);
  });
});

// Builds several targets and checks each bundle contains only the modules it should.
//   npm run verify:bundles
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const TITLES = {
  nhomkinh: 'PHẦN MỀM BÁN HÀNG NHÔM KÍNH/SẮT',
  pharmacy: 'PHẦN MỀM BÁN HÀNG NHÀ THUỐC',
  fashion: 'PHẦN MỀM BÁN HÀNG THỜI TRANG - GIÀY DÉP',
  example: 'KHÁCH HÀNG MẪU',
  demo: 'bh-demo',
};

const TARGETS = [
  {
    name: 'default (nhomkinh)',
    env: {},
    include: [TITLES.nhomkinh],
    exclude: [TITLES.pharmacy, TITLES.example, TITLES.demo],
  },
  {
    name: 'edition pharmacy',
    env: { VITE_EDITION: 'pharmacy' },
    include: [TITLES.pharmacy],
    exclude: [TITLES.nhomkinh, TITLES.fashion, TITLES.example, TITLES.demo],
  },
  {
    name: 'customer example',
    env: { VITE_CUSTOMER: 'example' },
    include: [TITLES.example, TITLES.nhomkinh],
    exclude: [TITLES.pharmacy, TITLES.demo],
  },
  {
    name: 'web demo',
    env: { VITE_DEMO: 'true' },
    include: [TITLES.nhomkinh, TITLES.pharmacy, TITLES.fashion, TITLES.demo],
    exclude: [TITLES.example, '/api/example'],
  },
];

const readBundle = (dir) =>
  readdirSync(join(dir, 'assets'))
    .filter((name) => name.endsWith('.js'))
    .map((name) => readFileSync(join(dir, 'assets', name), 'utf8'))
    .join('\n');

const verify = (target) => {
  const outDir = mkdtempSync(join(tmpdir(), 'banhang-bundle-'));
  try {
    execFileSync(
      'npx',
      [
        'vite',
        'build',
        '--outDir',
        outDir,
        '--emptyOutDir',
        '--logLevel',
        'error',
      ],
      {
        stdio: 'inherit',
        shell: process.platform === 'win32', // npx is npx.cmd on Windows
        env: {
          ...process.env,
          VITE_EDITION: '',
          VITE_CUSTOMER: '',
          VITE_DEMO: '',
          ...target.env,
        },
      }
    );
    const bundle = readBundle(outDir);
    const missing = target.include.filter((text) => !bundle.includes(text));
    const leaked = target.exclude.filter((text) => bundle.includes(text));
    return { ...target, missing, leaked };
  } finally {
    rmSync(outDir, { recursive: true, force: true });
  }
};

const results = TARGETS.map(verify);
results.forEach(({ name, missing, leaked }) => {
  const ok = !missing.length && !leaked.length;
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}`);
  if (missing.length) console.log(`     missing: ${missing.join(' | ')}`);
  if (leaked.length) console.log(`     leaked:  ${leaked.join(' | ')}`);
});

if (results.some(({ missing, leaked }) => missing.length || leaked.length)) {
  process.exit(1);
}

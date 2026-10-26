# BanHang — repo guide

Retail sales software (sales, purchases, stock, customer/supplier debt, cashbook, reports).

## Map

| Path | What |
| --- | --- |
| `banhang/` | Frontend: React 18 + Vite + Ant Design + Zustand; also packaged with Electron |
| `banhang/src/platform/` | Module system: core + edition + customer modules, slots, build-time selection |
| `banhang/src/editions/` | Edition modules (nhomkinh default, vlxd, minimart, fashion, pharmacy) + `catalog.js` |
| `banhang/src/customers/` | Customer modules (template: `example`) + `catalog.js` |
| `banhang/src/features/einvoice/` + `banhang-backend/src/modules/einvoice/` | Manual e-invoice export (Excel per provider profile, export tracking) |
| `banhang/src/demo/` | Browser demo mode: backend runs in the browser on localStorage (Vercel) |
| `banhang-backend/` | Express + Mongoose API |
| `packaging/`, `*.command`, `*.ps1`, `docker-compose.yml` | Local install / Docker / backup scripts |
| `docs/superpowers/specs`, `docs/superpowers/plans` | Design specs and implementation plans |

## Read before coding

- Frontend conventions: `banhang/AGENT.md` (files ≤ 200 lines, small modules, state rules).
- Module system (core/editions/customers, slots, builds): `banhang/src/platform/README.md`.
- Editions: `banhang/src/editions/README.md`; customers: `banhang/src/customers/README.md`.
- Windows installers per edition/customer: `packaging/windows/README.md`.
- E-invoice export (tax rules, profiles, add a provider): `banhang/src/features/einvoice/README.md`.
- Demo mode architecture, rules and recipes: `banhang/src/demo/README.md`.
- Backend layout and demo-compatibility rules: `banhang-backend/README.md`.

Key invariants:
- Business logic lives only in the backend; the demo reuses it unchanged.
- Backend shared code imports models, never `mongoose`; new routers go in `banhang-backend/src/routes/index.js`.
- Demo code is only loaded behind `__DEMO__`; never import `src/demo` from regular code.
- Industry/customer differences live in edition/customer modules (FE `src/editions|customers`, BE `src/editions|customers`); core never imports them; formulas stay edition-agnostic.
- Customer code never ships in the public web demo.

## Commands

```bash
# frontend (banhang/)
npm run dev                 # vite dev server (needs backend on :5000)
VITE_DEMO=true npx vite     # demo mode, no backend needed
npx vitest run              # tests
npm run lint
npm run build               # web build;  npm run build:demo → Vercel demo build
npm run build:electron      # desktop app
VITE_EDITION=pharmacy npm run build:electron  # one industry (default nhomkinh)
VITE_CUSTOMER=example npm run build           # one customer (edition from customers/catalog.js)
npm run verify:bundles     # each build contains only its own modules

# backend (banhang-backend/)
npm run dev
npx vitest run
```

Note: a local `banhang/.env` setting `VITE_API_URL` makes `dashboardApi` and `dataUpgradeApi`
tests fail (they expect the default URL). Run `VITE_API_URL= npx vitest run` to check them.

## Roadmap (productization)

1. Browser demo + industry sample data — done (spec 2026-10-24).
2a. Edition framework + module architecture (core/editions/customers, per-edition installers) — done (specs 2026-10-25).
2b+. Industry packs: minimart, VLXD, fashion (size/colour), pharmacy (lot/expiry).
3. Trial limit for the demo.

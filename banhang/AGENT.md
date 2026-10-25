# AGENT.md - React + Vite Coding Standards (banhang)

Applies to all generated/edited code inside `banhang/`.

## 1) Tech Stack Boundaries

- Frontend stack: React 18 + Vite + Ant Design + Zustand.
- Keep codebase in JavaScript/JSX unless user explicitly requests TypeScript.
- Preserve Electron runtime compatibility (`electron/`, build scripts, preload contracts).

## 2) Architecture Principles

- Separate UI, state, and business logic.
- Keep page-level orchestration in `src/pages/*`.
- Put reusable UI in `src/components/*` or `feature/components`.
- Move business logic to hooks/services/utils, not inline in JSX.
- Prefer feature-based grouping for medium/large additions.

## 3) Folder and File Rules

- Every source file (`.js`, `.jsx`, `.css`) must be <= 200 lines.
- If a file approaches 200 lines, split by:
  1. child components
  2. custom hooks
  3. helper/utils
  4. constants/config
- Folder naming must be clear, single-purpose, and predictable.
- Avoid duplicated modules; reuse existing helpers/stores where possible.

## 4) State Management Rules

- Do not overuse `useState`.
- If component state becomes complex (many fields, dependent transitions, multi-step forms), use:
  - `useReducer` for local complex state
  - Zustand store for shared/cross-page state
  - custom hooks for reusable state logic
- Avoid storing derived state when it can be computed from source state.
- Avoid prop drilling deeper than 2 levels; extract state to hook/store.

## 5) React Component Standards

- One main component per file; filename matches component name.
- Keep render blocks clean and short.
- Extract long handlers and data transforms out of component body.
- No heavy business calculations directly inside JSX tree.
- Always clean up side effects in `useEffect`.
- Memoize only when there is a real render/perf reason.

## 6) Data and Side Effects

- Access the API via the repository layer (`src/db/repository.js`, feature `api/` modules). All requests go through `src/db/transport.js`; never call `fetch` directly.
- UI components should not directly contain persistence/query logic.
- Normalize/transform payloads in dedicated helper files.
- Handle errors consistently with user-facing fallback messages.

## 7) Naming and Conventions

- Components: PascalCase (`InvoiceHeader.jsx`).
- Hooks: camelCase with `use` prefix (`usePurchaseFilters.js`).
- Stores: `<domain>Store.js` (`productStore.js`).
- Utilities: domain-focused camelCase filenames.
- Avoid magic strings/numbers; centralize constants.
- Import order: external packages -> internal modules -> relative modules.

## 8) Scalability and Maintainability

- Prefer small composable modules over monolithic components.
- Keep cross-feature dependencies minimal.
- Use selectors with Zustand to reduce rerenders.
- Preserve backward compatibility of existing store/data shape unless explicitly requested.
- Add concise comments only where code intent is non-obvious.

## 9) Mandatory Pre-Delivery Checklist

- [ ] No touched source file exceeds 200 lines.
- [ ] Reusable parts extracted instead of duplicated.
- [ ] `useState` usage is minimal and justified.
- [ ] Complex state moved to reducer/store/custom hook.
- [ ] Existing behavior preserved (no accidental regressions).
- [ ] `npm run build` passes after frontend changes.

## 10) Working Mode for AI agents

When implementing changes, prioritize:

1. Clear folder structure
2. Reusable modules
3. Small, focused files
4. Predictable data flow
5. Easy-to-maintain code over quick hacks

## 11) Demo Mode (`src/demo`)

Read `src/demo/README.md` before touching demo code or backend data access. Key rules:

- Business logic lives only in `banhang-backend`; the demo runs it unchanged in the browser.
- Demo code is loaded only behind the build flag `__DEMO__` (dynamic `import()`); never import `src/demo` from regular code.
- Shims fail loudly on unsupported mongoose/express features; extend the shim and its tests instead of working around it.

## 12) Modules: core + editions + customers

Read `src/platform/README.md` before adding industry- or customer-specific behaviour. Key rules:

- Industry differences live in `src/editions/<id>/`, customer differences in `src/customers/<id>/`; core never imports them (boundary tests enforce it).
- Core exposes extension points (`SLOTS` + `<Slot>` / `resolveSlot`, routes, home tiles); add a slot instead of branching on the edition in core.
- Read config via `useEdition()` / `useEditionFeature()` / `useActiveModule()` (React) or `getEditionConfig()` / `hasFeature()` (plain code).
- Keep formulas edition-agnostic; edition-dependent values are computed lazily, never module-level constants.

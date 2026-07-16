# stitch-cli — Directory Structure Plan

Status: planning. Not yet implemented.
Scope: full repo reorganization. Both products retained — new Ink CLI and legacy SecureCode IDE — restructured into a single coherent monorepo.

## Scan results — current state

```
stitch-cli/
├── README.md                         ← describes legacy IDE (wrong target)
├── QUICKSTART.md                     ← legacy
├── IMPLEMENTATION_SUMMARY.md         ← legacy
├── TRANSFORMATION.md                 ← legacy
├── TEST_PLAN.md                      ← new
├── package.json                      ← new (workspaces)
├── package-lock.json
├── tsconfig.base.json
├── .gitignore
├── node_modules/
├── packages/                         ← NEW Ink CLI
│   ├── core/
│   │   ├── src/{index.ts, workspace.ts, commands.ts}
│   │   ├── dist/                     ← committed (shouldn't be)
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── cli/
│       ├── src/{index.tsx, ui/App.tsx}
│       ├── dist/                     ← committed
│       ├── package.json
│       └── tsconfig.json
└── stitch_command_line_interface/    ← LEGACY monolith, snake_case+&
    ├── command_line_interface/                          ┐
    ├── crypto_tools_&_key_management/                   │
    ├── global_threat_monitoring_map_{1,2,3}/            │  15 mock-up
    ├── live_coding_environment/                         │  dirs, each
    ├── network_idps_interface/                          │  containing only
    ├── secure_audit_&_logging_dashboard/                ├─ code.html +
    ├── secure_authentication_&_access_control/          │  screen.png
    ├── secure_boot_&_integrity_check/                   │  (HTML prototypes)
    ├── secure_file_transfer_interface_{1,2}/            │
    ├── secure_remote_access_&_control/                  │
    ├── system_config_&_policy_management/               │
    ├── system_diagnostics_&_repair/                     ┘
    └── hacker_desktop_dashboard/     ← the actual live IDE
        ├── 13 *.md status reports at root
        ├── code.html, screen.png    ← stray prototype artifacts
        ├── backend/   (Express + jest)
        │   ├── src/{app.ts, server.ts, middleware/, routes/, services/, utils/, websocket/}
        │   ├── tests/  (10 files)
        │   ├── workspace/   ← runtime data inside source tree
        │   ├── coverage/    ← committed report
        │   ├── dist/, node_modules/
        │   ├── 5 SECURITY_*.md, TESTING.md, DEPLOYMENT_CHECKLIST.md, README.md
        │   ├── jest.config.js, package.json, tsconfig.json
        │   └── package-lock.json
        └── react-dashboard/  (Vite + React + Electron + vitest)
            ├── src/{App.tsx, main.tsx, components/, pages/, hooks/, contexts/,
            │        services/, routes/, types/, test/, types.ts, config.ts,
            │        electron.d.ts, vite-env.d.ts, index.css}
            ├── electron/, electron-start.cjs
            ├── 14 *.md (ARCHITECTURE, API_SPEC, CHANGELOG, DEMO_GUIDE, DEPLOYMENT,
            │            ELECTRON, LIVE_EDITOR_GUIDE, MEGA-LENS-PLAN,
            │            NAVIGATION_*, BACKEND_INTEGRATION, COMPLETION-SUMMARY...)
            ├── assets/, dist/, node_modules/
            └── index.html, package.json, vite.config.ts, vitest.config.ts, ...
```

## Findings — symptoms first, then root causes

**1. The repo is three layers of orphaned history glued together.**
- Layer 1: 15 HTML prototype dirs at `stitch_command_line_interface/*/` — only `code.html` + `screen.png`. They are static mock-ups never wired to anything. The real product (`hacker_desktop_dashboard/`) sits as a sibling, indistinguishable to a newcomer.
- Layer 2: `hacker_desktop_dashboard/` — the actual legacy IDE, but doubly nested inside a directory whose name no longer reflects the product (it was named `hacker_desktop_dashboard` but is the SecureCode IDE).
- Layer 3: `packages/` — the new Ink CLI, untracked, no doc lineage.

**2. Naming is internally inconsistent.**
- `snake_case_with_&` for prototype dirs (the `&` will bite shells, CI matchers, glob tools).
- `kebab-case` for `react-dashboard`, `hacker_desktop_dashboard`.
- `camelCase`/`PascalCase` inside source (fine — that's a different layer).
- Top-level `stitch_command_line_interface/` is itself a near-duplicate of the repo name `stitch-cli/`, which is why a contributor running `cd stitch-cli/stitch_command_line_interface/hacker_desktop_dashboard/backend` to install the backend is plausible — and that's what the legacy README literally instructs.

**3. Documentation sprawl.**
- 5 `.md` files at root (4 of which describe a dead architecture).
- 13 status `.md` files at `hacker_desktop_dashboard/` root.
- 14 `.md` files at `react-dashboard/` root.
- 5 `SECURITY_*.md` and a half-dozen others at `backend/` root.
- Total: ~40 markdown files outside any `docs/` structure. Most are point-in-time status reports (`*_COMPLETE.md`, `FINAL_*`, `LIVE_PREVIEW_SUMMARY.md`) — they belong in `docs/history/` or git, not the working tree.

**4. Build artifacts and runtime data committed.**
- `dist/` directories at three levels.
- `coverage/` at backend.
- `tsconfig.tsbuildinfo` (80 KB) at `packages/cli/`.
- `backend/workspace/` is the *user* workspace (runtime files), checked into source.
- `screen.png` (1.6 MB) at `hacker_desktop_dashboard/` and per prototype dir.

**5. Three independent npm projects, no monorepo seam.**
- Root `package.json` has workspaces: `packages/*` — does not include backend or frontend.
- `backend/` and `react-dashboard/` each have their own `package.json` + `package-lock.json` + `node_modules/`.
- That means a fresh clone needs `npm i` in three places, with no orchestration. No shared TypeScript config, no shared eslint config, no shared types between backend and frontend (they each define their own `FileNode`, `WorkspaceStats`, etc. — already drifting).

**6. `stitch_command_line_interface/` is a useless container.**
- 15 of its 16 children are HTML mock-ups.
- The 1 real child (`hacker_desktop_dashboard/`) is itself a container of two real projects.
- So the actual code lives at depth 4: `repo/stitch_command_line_interface/hacker_desktop_dashboard/{backend,react-dashboard}/`. That's three levels of folder before you reach anything you can run.

**7. Mixed concerns inside `backend/`.**
- `src/` has `app.ts`, `server.ts`, plus `middleware/`, `routes/`, `services/`, `utils/`, `websocket/`. That's healthy. But `routes/logs.d.ts` lives next to `logs.ts` — a `.d.ts` for an internal route is a smell (it's stamping out a missing import error rather than fixing it).
- `backend/workspace/` (runtime) and `backend/coverage/` (artifact) and `backend/tests/` (source) all share a level — they should be on three different planes.

**8. `react-dashboard/src/` mixes file conventions.**
- `App.tsx`, `main.tsx`, `index.css`, `config.ts`, `types.ts`, `vite-env.d.ts`, `electron.d.ts` all loose at `src/` root.
- `types.ts` AND `types/settings.ts` — two different homes for types.
- `test/` directory holds tests for files in `components/`, `contexts/`, `hooks/` — colocation would put each test next to its source.

**9. Electron is invisible from outside `react-dashboard/`.**
- `electron-start.cjs` and `electron/main.js` live inside the React project. If the desktop app is a real shipping target, Electron is its own concern with its own build/test surface, not a script in the renderer's repo.

---

## Optimal target structure

Goal: every directory answers exactly one question — *what is this, who builds it, where do its tests live?* Two products are kept (per direction); each becomes a first-class workspace. Everything below is a single monorepo, npm workspaces, one lockfile.

```
stitch-cli/
├── README.md                          # repo entry point: what's here, how to run
├── CONTRIBUTING.md                    # dev setup once, applies to all packages
├── CHANGELOG.md                       # repo-wide
├── LICENSE
├── .gitignore
├── .editorconfig
├── .nvmrc                             # pin node 20
├── package.json                       # workspaces: apps/*, packages/*
├── package-lock.json                  # ONE lockfile for the whole repo
├── tsconfig.base.json                 # extended by every package
├── tsconfig.json                      # composite, references all packages
├── eslint.config.js                   # shared
├── .prettierrc
│
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                     # matrix: cli, ide-backend, ide-web, e2e
│   │   ├── nightly-mutation.yml
│   │   └── release.yml
│   ├── CODEOWNERS
│   └── ISSUE_TEMPLATE/
│
├── docs/                              # repo-wide docs only
│   ├── architecture.md                # the real one — both products, their seam
│   ├── decisions/                     # ADRs, numbered: 0001-monorepo.md ...
│   ├── history/                       # all the *_COMPLETE.md / *_SUMMARY.md
│   │   ├── transformation.md
│   │   ├── live-preview-implementation.md
│   │   └── ...                        # everything time-stamped goes here
│   └── prototypes/                    # the 15 HTML mock-ups, archived
│       ├── README.md                  # "these are reference designs, not code"
│       ├── crypto-tools/
│       ├── global-threat-map-1/
│       ├── network-idps/
│       └── ...                        # kebab-case, no '&'
│
├── apps/                              # runnable products
│   ├── cli/                           # the new Ink CLI
│   │   ├── src/
│   │   │   ├── index.tsx              # entry
│   │   │   └── ui/
│   │   │       ├── App.tsx
│   │   │       ├── App.test.tsx       # colocated
│   │   │       ├── FilePane.tsx       # extracted from App
│   │   │       ├── FilePane.test.tsx
│   │   │       ├── PreviewPane.tsx
│   │   │       ├── CommandPalette.tsx
│   │   │       └── LogPane.tsx
│   │   ├── test/
│   │   │   └── integration/           # execa-driven black-box tests
│   │   ├── package.json               # name: @stitch/cli
│   │   ├── tsconfig.json
│   │   └── vitest.config.ts
│   │
│   ├── ide-backend/                   # was: hacker_desktop_dashboard/backend
│   │   ├── src/
│   │   │   ├── server.ts              # bootstrap only
│   │   │   ├── app.ts                 # express app factory
│   │   │   ├── config/                # env parsing in one place (NEW)
│   │   │   ├── middleware/
│   │   │   ├── routes/                # one file per resource
│   │   │   ├── services/
│   │   │   ├── websocket/
│   │   │   └── utils/
│   │   ├── test/
│   │   │   ├── unit/
│   │   │   ├── integration/           # supertest against full app
│   │   │   ├── security/              # workspace-, execution-, auth-security
│   │   │   ├── fixtures/              # shared test data
│   │   │   └── helpers/               # buildApp(), authedClient(), tmpWorkspace()
│   │   ├── package.json               # name: @stitch/ide-backend
│   │   ├── jest.config.js
│   │   ├── tsconfig.json
│   │   └── README.md                  # backend-specific run notes ONLY
│   │
│   ├── ide-web/                       # was: react-dashboard
│   │   ├── index.html
│   │   ├── public/
│   │   ├── src/
│   │   │   ├── main.tsx
│   │   │   ├── App.tsx
│   │   │   ├── routes.tsx             # consolidated (was routes/lazyRoutes.tsx)
│   │   │   ├── styles/
│   │   │   │   └── index.css
│   │   │   ├── env.d.ts               # one place for ambient types
│   │   │   ├── components/
│   │   │   │   ├── LiveIDE/
│   │   │   │   │   ├── LiveIDE.tsx
│   │   │   │   │   ├── LiveIDE.test.tsx
│   │   │   │   │   └── index.ts
│   │   │   │   ├── SettingsPanel/...
│   │   │   │   └── ...                # one folder per component over ~150 LOC
│   │   │   ├── pages/
│   │   │   │   └── DashboardPage/
│   │   │   │       ├── DashboardPage.tsx
│   │   │   │       └── DashboardPage.test.tsx
│   │   │   ├── hooks/                 # *.ts + *.test.ts colocated
│   │   │   ├── contexts/
│   │   │   ├── services/              # *.ts + *.test.ts colocated, msw mocks
│   │   │   └── types/                 # ALL types here, no loose types.ts
│   │   ├── test/
│   │   │   ├── setup.ts
│   │   │   ├── msw/handlers.ts        # shared MSW handlers
│   │   │   └── a11y.ts                # axe helper
│   │   ├── package.json               # name: @stitch/ide-web
│   │   ├── vite.config.ts
│   │   ├── vitest.config.ts
│   │   ├── tailwind.config.ts
│   │   └── README.md
│   │
│   └── ide-desktop/                   # NEW — Electron split out
│       ├── src/
│       │   ├── main.ts                # main process (was electron-start.cjs)
│       │   ├── preload.ts
│       │   └── index.ts
│       ├── electron-builder.yml
│       ├── package.json               # name: @stitch/ide-desktop
│       └── tsconfig.json
│
├── packages/                          # shared libraries — multiple consumers
│   ├── core/                          # workspace.ts, commands.ts
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── workspace.ts
│   │   │   ├── workspace.test.ts      # colocated
│   │   │   ├── commands.ts
│   │   │   └── commands.test.ts
│   │   ├── package.json               # name: @stitch/core
│   │   ├── tsconfig.json
│   │   └── vitest.config.ts
│   │
│   ├── shared-types/                  # NEW — kill duplicate FileNode etc.
│   │   ├── src/index.ts               # FileNode, WorkspaceStats, ApiError, ...
│   │   └── package.json               # name: @stitch/shared-types
│   │
│   ├── api-contracts/                 # NEW — Zod schemas, request/response shapes
│   │   ├── src/                       # one file per route group
│   │   └── package.json               # name: @stitch/api-contracts
│   │                                  # used by both ide-backend and ide-web,
│   │                                  # plus B4 schema-contract tests
│   │
│   ├── eslint-config/                 # shared eslint preset
│   └── tsconfig/                      # shared tsconfig presets
│       ├── base.json
│       ├── node.json
│       └── react.json
│
├── e2e/                               # cross-product end-to-end (TEST_PLAN D1)
│   ├── playwright.config.ts
│   ├── fixtures/
│   ├── tests/
│   │   ├── workspace-crud.spec.ts
│   │   ├── execute-code.spec.ts
│   │   └── settings-persistence.spec.ts
│   └── package.json                   # name: @stitch/e2e
│
├── tools/                             # dev scripts
│   ├── scripts/
│   │   ├── coverage-merge.mjs         # nyc merge across surfaces
│   │   ├── check-no-cross-import.mjs  # forbid apps importing each other
│   │   └── verify-workspace-graph.mjs
│   └── stryker/                       # mutation config (TEST_PLAN D3)
│       └── stryker.conf.json
│
└── workspaces/                        # runtime data — gitignored
    └── .gitkeep                       # no committed user files; was backend/workspace
```

## Why this shape

- **`apps/` vs `packages/`**: classic monorepo split. `apps/*` are runnable, ship to a user. `packages/*` are libraries with multiple internal consumers. One look at `apps/` tells you what the repo *makes*. One look at `packages/` tells you what's reusable.
- **`apps/ide-desktop/` separate**: Electron is its own runtime with its own threat model (main process has Node access). Burying it in the renderer hides that. It's also the only thing that needs `electron-builder`.
- **`packages/shared-types/` and `packages/api-contracts/`**: kills the silent type drift between backend and frontend (both currently redefine `FileNode`). The contracts package is what the schema-contract tests in TEST_PLAN B4 import.
- **Tests colocated with source** (`*.test.ts` next to `*.ts`): finds tests with the file you're editing, breaks the `tests/` vs `src/` split that already lets a 600-LOC `LiveIDE.tsx` sit untested for a year. Integration/E2E stays in `test/integration/` and `e2e/` because those test *across* files.
- **`docs/decisions/` (ADRs)**: every "why does it look like this" question gets a numbered, immutable answer. Status reports (`*_COMPLETE.md`, `FINAL_*`) get archived under `docs/history/` so they stop drowning the working tree.
- **`docs/prototypes/`**: the 15 HTML mock-ups become reference material, not load-bearing infrastructure. Renamed to kebab-case so glob/CI tooling stops choking on `&`.
- **`workspaces/` at repo root, gitignored**: runtime data (the user's IDE workspace) is NOT source. Was `apps/ide-backend/workspace/` — moves out of source tree, lets backend `src/` be safely deleted/regenerated.
- **`tools/scripts/check-no-cross-import.mjs`**: a CI-enforced rule that `apps/cli/` cannot import from `apps/ide-web/` and vice-versa. Apps depend on packages, never on each other. Without this, the monorepo collapses into a tar pit.
- **One lockfile** at repo root: a single `npm install` bootstraps everything. No more "did I `npm i` in the right place?"
- **Naming**: kebab-case for directories, `@stitch/<name>` for npm packages, no `&`, no double-nesting, no directories whose name repeats their parent.

## What gets renamed/moved (concretely)

| From | To |
|---|---|
| `packages/cli/` | `apps/cli/` |
| `packages/core/` | `packages/core/` (stays, but tests colocated) |
| `stitch_command_line_interface/hacker_desktop_dashboard/backend/` | `apps/ide-backend/` |
| `stitch_command_line_interface/hacker_desktop_dashboard/react-dashboard/` | `apps/ide-web/` (Electron split out) |
| `…/react-dashboard/electron*` | `apps/ide-desktop/` |
| `…/backend/workspace/` | `workspaces/` (gitignored) |
| `stitch_command_line_interface/<15 prototype dirs>/` | `docs/prototypes/<kebab-name>/` |
| `README.md`, `QUICKSTART.md`, `IMPLEMENTATION_SUMMARY.md`, `TRANSFORMATION.md` | rewrite the first; archive the rest under `docs/history/` |
| `…/hacker_desktop_dashboard/*.md` (13 files) | `docs/history/` (mostly) + the one current ARCHITECTURE → `docs/architecture.md` |
| `…/react-dashboard/*.md` (14 files) | same — `docs/history/` for status, `docs/` for living docs |
| `…/backend/SECURITY_*.md` (5 files) | merge into `docs/security.md` (one canonical), archive the rest |
| `**/dist/`, `**/coverage/`, `**/*.tsbuildinfo` | gitignored, removed from index |
| `screen.png` (1.6 MB at multiple levels) | `docs/prototypes/<dir>/screenshot.png` (or git-lfs if kept) |

## Constraints this design enforces (intentional)

1. **No app imports another app.** Period. Shared code goes in `packages/`.
2. **Every package has its own tsconfig that extends `packages/tsconfig/`.** No drift.
3. **Every package has either `*.test.ts` colocated OR a `test/` dir — never both.**
4. **Runtime data (workspaces, caches, logs) lives outside source trees.**
5. **One markdown file at the repo root: `README.md`.** Everything else is under `docs/`.
6. **One lockfile.** Three is a bug.

## Migration strategy (PR-sized, each green-on-merge)

1. **Inventory + archive docs.** Move the 40 status `.md` files into `docs/history/`. Rewrite root `README.md`. No code moves yet. (Low risk, biggest readability win.)
2. **Lift `prototypes/`.** Rename the 15 HTML dirs to kebab-case under `docs/prototypes/`. (Pure rename, no consumer.)
3. **Create monorepo skeleton.** Add `apps/`, `packages/tsconfig/`, `packages/eslint-config/`, root `tsconfig.json` references. Wire root `package.json` workspaces to include `apps/*`. (No moves yet — empty scaffolding.)
4. **Move `packages/cli/` → `apps/cli/`.** Update imports. Run typecheck. Commit.
5. **Move `…/backend/` → `apps/ide-backend/`.** Update jest paths, fix any absolute imports, gitignore `workspaces/`, move `backend/workspace/` to `/workspaces/`. Commit only after `npm test` passes.
6. **Move `…/react-dashboard/` → `apps/ide-web/`.** Same pattern.
7. **Split Electron into `apps/ide-desktop/`.** Move `electron/`, `electron-start.cjs`, electron-builder config out. Update `ide-web/package.json` to drop electron deps.
8. **Extract `packages/shared-types/` and `packages/api-contracts/`.** Replace duplicate type defs in backend + frontend.
9. **Colocate tests.** Move each `tests/` and `test/` file next to its subject; keep `test/integration/` and `test/security/` directories.
10. **Wire CI matrix** (TEST_PLAN D4) against the new layout.
11. **Delete the now-empty `stitch_command_line_interface/` shell.**

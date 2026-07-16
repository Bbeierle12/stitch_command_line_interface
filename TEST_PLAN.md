# stitch-cli — Comprehensive Test Harness Plan

Status: planning. Not yet implemented.
Scope: both codebases retained — new Ink CLI (`packages/`) and legacy SecureCode IDE (`stitch_command_line_interface/`).

## Scan results

**Footprint**
- New Ink CLI: 5 files, ~675 LOC, **0 tests**.
- Legacy backend: 31 modules, ~6,616 LOC, **10 test files (~338 cases)**, jest+supertest, coverage threshold 60/70.
- Legacy frontend: 50+ files, ~9,161 LOC, **4 test files** (ConsoleContext, MetricCard, usePerformance, setup), vitest+RTL+jsdom.

**Tooling already on disk** — leverage, don't replace.
- Backend: jest + ts-jest + supertest. Coverage thresholds shipped (b60/f60/l70/s70).
- Frontend: vitest + @testing-library/react + jsdom + @vitest/ui + coverage.
- New CLI: nothing. TypeScript-only.

**Critical untested surfaces (this is the gap)**
- `packages/core/workspace.ts` — `assertInsideWorkspace` (path-traversal guard), `readWorkspaceSnapshot` (fs walk + ignore + depth), `readTextFile` (size cap, binary detection).
- `packages/core/commands.ts` — `discoverCommands`, `findCommand`, `runCommand` (subprocess, no timeout, no kill).
- `packages/cli/ui/App.tsx` — keyboard reducer, palette filter, file pane window math, log cap (the bugs flagged in review).
- Legacy backend: `routes/git.ts` (387 LOC), `routes/ide.ts` (411), `routes/preview.ts`, `services/multiLangExecutionService.ts` (407), `services/debuggerService.ts` (505), `services/deploymentService.ts` (450), `services/devServerService.ts`, `services/fileWatcherService.ts`, `websocket/ideHandler.ts` (375), `websocket/server.ts` (279) — **all near-zero coverage**.
- Legacy frontend: `LiveIDE` (409), `LiveCodeEditor` (448), `MegaLens` (473), `SettingsPanel` (864), `LLMChat` (335), `TopHud` (218), `LeftDock` (368), `BottomConsole`, `CommandPalette`, `ErrorBoundary`, `InspectorPanel`, all 9 pages, all hooks except `usePerformance`, all services (`apiClient`, `wsClient`, `backendApiService`, `dataService`, `commandExecutionService`, `electronService`, `navigationService`, `authService`, `llmService`), `SettingsContext`, `lazyRoutes`.

---

## Comprehensive test harness plan

Three independent test surfaces, one root entry point. Each surface owns its tooling; the root delegates.

### Surface A — `packages/core` and `packages/cli` (new CLI) — **vitest**

Why vitest: ESM-native (the packages are `"type": "module"`), no ts-jest config friction, matches what the frontend already uses. Add `vitest`, `@vitest/coverage-v8`, `ink-testing-library` to each package.

**A1. `packages/core/test/workspace.test.ts` — security & filesystem (target ~60 cases)**
- `assertInsideWorkspace`:
  - rejects `..`, `../..`, `../../etc/passwd`
  - rejects absolute paths (`/etc/passwd`, `C:\Windows`)
  - rejects symlink-escape (create `tmpRoot/link → /tmp`, assert reject)
  - accepts `./file`, `subdir/file`, deep nested
  - accepts paths with spaces, unicode, dots in names
  - rejects empty, null-byte (`a\0b`), path with embedded `\r\n`
  - case-sensitivity assertions on Linux
  - returns absolute path with no double-resolution drift
- `readWorkspaceSnapshot` (use `tmp` package, build fixture trees):
  - empty dir
  - flat dir with N files (N=0,1,50)
  - depth=1,2,4,10 — assert `maxDepth` cutoff
  - respects root `.gitignore` (custom patterns, negations `!keep`)
  - applies DEFAULT_IGNORES even with no `.gitignore`
  - **does not follow symlinked dirs into ancestor (loop guard)**
  - sorts: directories before files, alphabetical inside each
  - `flat[].depth` is correct for nested trees
  - permission-denied dir doesn't kill the walk (skipped or surfaced cleanly — pick a contract and lock it)
  - large file count (1k entries) under 500ms
- `readTextFile`:
  - reads UTF-8, returns exact contents
  - returns `[File is N bytes...]` when over `maxBytes`
  - returns `[Binary or unsupported file type...]` for `.png`, `.exe`, no extension
  - rejects with same path-escape errors as `assertInsideWorkspace`
  - rejects when target is a directory
  - rejects on missing file (ENOENT surfaces)

**A2. `packages/core/test/commands.test.ts` — subprocess (target ~30 cases)**
- `discoverCommands`:
  - returns git commands always (even with no package.json)
  - includes `npm test`/`build`/`lint`/`typecheck` only when present in `scripts`
  - ignores non-string script values
  - handles malformed JSON without throwing
  - missing package.json → no npm commands but still git
- `findCommand`: hit, miss, undefined for unknown id
- `runCommand` (use a tiny `node -e "console.log('x')"` fixture):
  - exit 0 with stdout captured
  - non-zero exit captured in `code`
  - signal capture (kill child mid-run)
  - stderr captured and interleaved
  - output truncated at MAX_OUTPUT_BYTES (assert byte cap, not char)
  - **UTF-8 split safety: emit a 4-byte emoji exactly at boundary, assert no replacement chars in retained tail**
  - `child.error` event resolves cleanly (e.g., command not found)
  - cwd is honored (assert by `pwd` output)
  - doesn't inherit shell metacharacters (`shell: false` regression test — pass `;rm -rf /` as arg, assert it's a literal arg)
  - **timeout path** (after we add it): kills after N ms, output preserved up to kill, `signal: 'SIGTERM'`
  - **cancel path** (after we add it): external `AbortSignal` triggers kill

**A3. `packages/cli/test/App.test.tsx` — Ink UI (target ~25 cases)** with `ink-testing-library`
- mounts with empty workspace, shows "No file selected"
- arrow keys move selection within bounds (no underflow at 0, no overflow at end)
- `g` triggers refresh; log shows entry count
- `c` opens palette; `esc` closes; query filters case-insensitively
- palette `enter` runs the selected command, log shows status
- palette typing accumulates query, backspace removes, selectedIndex resets to 0 on filter change
- `runningCommandId` blocks re-entry
- file pane window keeps selected row visible at every selectedIndex from 0 to N (covers the bug)
- log cap is exactly K — emit K+5 logs, assert length === K
- `q` and `ctrl+c` call `exit()`
- `e` with directory selected logs "select a file"; with file selected respects `EDITOR` env
- preview falls back to "[Directory] x" for directories
- preview surfaces error message string when `readTextFile` rejects

### Surface B — Legacy backend (`stitch_command_line_interface/.../backend`) — **jest** (existing)

Keep jest, raise the bar. Add `jest-junit` for CI artifacts. Coverage threshold raises in two stages (current 60/70 → 75/80 → 85/90) so we don't block on day-one ratchet.

**B1. Critical-path gap fills** (new test files)
- `tests/git.routes.test.ts` — every endpoint in `routes/git.ts` with supertest + `simple-git` mocked: status, branch list/create/delete/switch, log, diff, add/commit, push/pull (mocked), reject paths outside workspace, reject shell-meta in branch names.
- `tests/ide.routes.test.ts` — full CRUD on workspace endpoints: create/read/update/delete/move/copy, plus path traversal asserts on every path-accepting param (this is your highest-value security suite).
- `tests/preview.routes.test.ts` — preview render endpoints, MIME sniffing, content-disposition.
- `tests/multiLangExecutionService.test.ts` — happy path + sandbox escape attempts per supported language; resource-limit enforcement; stdin handling; output truncation.
- `tests/debuggerService.test.ts` — breakpoint set/clear, step, continue, variable inspection (mock the protocol).
- `tests/deploymentService.test.ts` — git push integration mocked, signed-commit assertion, rollback path, audit log entry shape.
- `tests/devServerService.test.ts` — start/stop/restart, port conflict, stale process cleanup, log streaming.
- `tests/fileWatcherService.test.ts` — chokidar events fan out to subscribers; debounce; cleanup on unsubscribe.
- `tests/ws.ideHandler.test.ts` — connection lifecycle, presence join/leave, file change broadcast, malformed-message rejection, auth required.
- `tests/ws.server.test.ts` — server boot/shutdown, room isolation, reconnect.
- `tests/auth.contract.test.ts` — JWT issue/verify/expire, RBAC role matrix, refresh, password hashing rounds, timing-safe compare.
- `tests/rateLimit.test.ts` — 100/15min enforced per IP, headers correct, separate buckets per route group.
- `tests/validation.middleware.test.ts` — every Joi schema with one valid + ≥3 invalid cases.

**B2. Reinforce existing suites**
- `workspace-security.test.ts`: add Windows-style path traversal (`..\\..\\`), URL-encoded `..%2f`, null-byte, symlink escape, TOCTOU (replace target between check and use — at minimum document and lock behavior).
- `execution-security.test.ts`: prototype pollution via input, `process.binding`/`require` escape attempts, SIGKILL on memory overshoot, infinite loop killed by CPU timeout.
- `routes.integration.test.ts`: full request lifecycle through helmet/cors/rate-limit/auth/validation chain.

**B3. Property-based** (add `fast-check`)
- Path-validator fuzz: arbitrary string → never returns a path outside root.
- File-tree builder fuzz: random nested fs trees → snapshot is consistent (every flat entry appears in tree, depths match).

**B4. Contract / smoke**
- OpenAPI/JSON-schema validator on every JSON response of every route — generated from a single `tests/schemas/*.ts` to prevent drift.

### Surface C — Legacy frontend (`react-dashboard`) — **vitest** (existing)

**C1. Component tests with RTL** — every component below gets at minimum: render-without-crash, prop variants, primary interaction, a11y (axe). Priority order:
- `LiveIDE` (orchestration + WebSocket wiring; mock `wsClient`)
- `LiveCodeEditor` (Monaco mock, change events, save shortcut)
- `LLMChat` (streaming responses mock, model toggle, mode toggle — these were just added per recent commits)
- `SettingsPanel` (864 LOC; one test per setting group: appearance, security, exec limits, LLM, persistence)
- `MegaLens`, `TopHud`, `LeftDock`, `BottomConsole`, `CommandPalette`, `InspectorPanel`, `ErrorBoundary` (asserts the boundary actually catches), `VirtualizedConsole` (already tagged "10x faster" — add a perf-budget test using `performance.now` in jsdom plus an item-count rendering test).

**C2. Hooks** (`@testing-library/react` `renderHook`)
- `usePolling` — fires at interval, stops on unmount, respects pause prop.
- `useWebSocket` — connect/disconnect, reconnect-on-close with backoff, message dispatch, ref stability.

**C3. Services** (no DOM; pure logic)
- `apiClient`, `backendApiService`, `dataService`, `commandExecutionService`, `wsClient`, `electronService`, `navigationService`, `authService`, `llmService` — each gets: happy path, 4xx, 5xx, network error, abort, retry policy if any.
- Use `msw` (Mock Service Worker) so we don't hand-roll fetch mocks.

**C4. Pages**
- Each page (`DashboardPage`, `SystemPage`, `NetworkPage`, `SecurityPage`, `CiPage`, `EditorPage`, `PreviewPage`, `InboxPage`) — render under `MemoryRouter`, assert title + key card present, assert lazy-route boundary fallback shows then resolves.

**C5. Contexts**
- `SettingsContext` — defaults, set/get, persistence to localStorage, schema migration if any.
- `ConsoleContext` (already has a test) — add overflow trim, max-buffer eviction.

### Surface D — Cross-cutting

**D1. End-to-end smoke** — new dir `e2e/` at repo root, **playwright**.
- Boots backend on ephemeral port, frontend dev server on ephemeral port, opens dashboard, creates a file in workspace, edits in Monaco, runs it, asserts output renders. One scenario per major flow (workspace CRUD, execute code, AI explain, deploy mocked, settings persistence).

**D2. CLI integration** (new) — black-box launches `stitch` via `execa`, drives stdin keystrokes, captures stdout. Goes in `packages/cli/test/integration/`.

**D3. Mutation testing** — `stryker-mutator` on `packages/core` and on `backend/src/services/workspaceService.ts` + `validation.ts`. Threshold: kill ≥75% of mutants. Run nightly, not per-PR.

**D4. CI matrix**
- GitHub Actions workflow (`.github/workflows/test.yml`) with three parallel jobs: `cli`, `backend`, `frontend`. Each runs lint → typecheck → unit → integration → coverage upload. E2E runs in a fourth job after all three pass.
- Node 20 on Linux, mac, windows.
- Coverage uploaded to Codecov; PR comment with delta.
- Fail PR on coverage regression > 1%.

**D5. Root orchestration**
- Add root `package.json` scripts: `test`, `test:cli`, `test:backend`, `test:frontend`, `test:e2e`, `test:all`, `coverage:merge` (uses `nyc merge` to combine reports across surfaces).

### Coverage targets (hard gates)
- `packages/core` — 95/95/95/95 (small, security-critical, no excuse).
- `packages/cli` — 85/80/85/85 (UI heuristics looser).
- backend — stage 1: 75/80; stage 2 after gap-fill: 85/90.
- frontend — stage 1: 60/65; stage 2: 80/85.
- mutation kill rate — 75% on the two crown-jewel files.

### Execution order (one phase per PR, all behind a failing test first)
1. Stand up `vitest` in `packages/core` + `packages/cli`. Land A1+A2+A3. Block PR on green.
2. Add the missing backend suites B1 (~13 files). Land in batches of 3.
3. Reinforce B2; add B3 (`fast-check`) + B4 (schema contracts).
4. Frontend C1 (components) → C2 (hooks) → C3 (services with msw) → C4 (pages) → C5 (contexts).
5. D1 playwright e2e. D2 CLI integration. D3 mutation testing on a nightly schedule.
6. Wire D4 CI matrix; flip coverage gates from "report" to "enforce" once green for one full week.

### Estimated test count when complete
- new CLI: ~115 cases
- backend: ~338 existing + ~280 new = ~620
- frontend: ~80 + ~250 new = ~330
- e2e + CLI integration: ~25
- **Total: ~1,090 tests**, with mutation testing on the two highest-leverage files.

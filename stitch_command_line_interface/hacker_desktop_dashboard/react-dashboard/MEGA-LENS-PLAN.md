# Mega-Lens Navigation Initiative

## North Star

Objective: Replace tabs with a system that lets users see structure, slice by facets, save sets, follow trails, and map the site, all with first-class accessibility and performance.

### KPIs
- Time-to-first-destination from header (median)
- % of users using facets; % saving Facet Prism sets
- Return-visit resume rate via Trailboard
- Wrong-click/quick-backtrack rate from header links
- Task completion for "Find X" tree tests (baseline vs. post-launch)

### Performance Budgets
- LCP ≤ 2.5s (p75), CLS ≤ 0.1, TBT ≤ 150ms on mid-tier mobile
- Mega-Lens open/close ≤ 100ms; Atlas pan/zoom frame budget ≥ 50 FPS

## 1. Architecture & Platform

### Front End
- Framework: React + TypeScript (Next.js or Remix for SSR/ISR)
- State: React Query (server cache) + minimal local Zustand/Redux for UI state
- Styling: Design tokens → CSS variables; utility CSS or CSS-in-JS, but server-rendered styles
- Accessibility: WAI-ARIA APG patterns for disclosure, combobox; axe-core in CI

### Back End
- Content: Headless CMS (e.g., Sanity/Contentful/Strapi) or existing CMS
- Faceted search: Algolia/Meilisearch/Elasticsearch (supports counts, synonyms)
- Persistence (Trailboard, saved sets): Postgres + Prisma (or ORM); Redis for session/edge caching
- Edge: CDN with KV/Edge cache for facet counts and panel payloads

### Observability
- Analytics: first-party events pipeline (Snowplow/Segment) → warehouse
- RUM: Web Vitals + custom interaction timings
- Feature flags: LaunchDarkly/Unleash (ship behind flags; progressive rollout)

## 2. Data Model (Minimum Viable Schemas)

### Content Basics
```
table pages (
  id uuid pk,
  slug text unique,
  title text,
  section text,
  sub_section text,
  audience text[],
  topic text[],
  format text,
  read_minutes int,
  updated_at timestamptz,
  popularity_score float
);
```

### Facet Prism (Saved Sets)
```
table saved_sets (
  id uuid pk,
  user_id uuid nullable,
  name text,
  query jsonb,
  pinned boolean default false,
  created_at timestamptz
);
```
- Example `saved_sets.query`: `{ "audience":["developers"], "format":["guide"], "read_minutes":{"lte":10}, "updated_at":{"gte":"2025-09-01"} }`

### Trailboard
```
table trails (
  id uuid pk,
  user_id uuid,
  title text,
  status text check (status in ('active','archived')),
  created_at timestamptz
);

table trail_nodes (
  id uuid pk,
  trail_id uuid fk,
  page_id uuid fk,
  parent_node_id uuid nullable,
  note text,
  scroll_y int default 0,
  state text check (state in ('todo','in-progress','done')) default 'todo',
  created_at timestamptz
);
```

### Atlas Cache (Denormalized)
```
table atlas_nodes (
  page_id uuid pk,
  section text,
  sub_section text,
  coords point,
  importance int
);
```

## 3. APIs (Contract First)
- `GET /api/nav/mega?section=:id&facets=...` → returns groups, items, counts, top previews
- `GET /api/facets?facets=...` → normalized facet counts across the corpus
- `GET /api/search?q=...&facets=...` → results + highlighted fields
- `POST /api/saved-sets`, `GET /api/saved-sets`, `PATCH /api/saved-sets/:id`
- `POST /api/trails`, `GET /api/trails`, `POST /api/trails/:id/nodes`
- `PATCH /api/trail-nodes/:id`
- `GET /api/atlas` → region layout + pin list (server-computed, cached)

## 4. Component Library (Accessibility-First)
Core components to build once, each shipping with an accessibility spec, unit tests (Jest/Testing Library), visual tests (Chromatic/Storybook), and contract tests with MSW mocks:
- DisclosureNav
- MegaPanel
- LensRibbon
- FacetPill
- CommandPalette
- Breadcrumb+Siblings
- TrailBoard
- TrailCard
- AtlasCanvas
- Shared utilities: VisuallyHidden, SkipLink, FocusRing, Dialog, Toast

## 5. Phased Delivery

### Phase A — IA Validation & Foundations
- Card sort → proposed IA; Tree test success ≥ baseline + 15%
- Design tokens, typography scale, spacing grid, color contrast tokens (WCAG AA/AAA)
- Event taxonomy, Web Vitals reporting, feature flags scaffold
- Exit criteria: IA accepted; tokenized design; analytics logging in place; SEO fallbacks defined

### Phase B — Mega-Lens Panel (MVP)
- Header with 5–7 primary sections
- MegaPanel content per section (≤3 columns, ≤7 links/col, 1-line descriptions)
- LensRibbon facets with server counts
- SSR fallback index pages mirroring panel groupings
- Acceptance: keyboard navigation, screen reader announcements, latency budgets
- Experiments: A/B Mega-Lens vs. dropdowns

### Phase C — Facet Prism (Saved Sets)
- Save current lens combo → named set; shareable URL
- Manage sets: list, pin, delete, rename
- Server-side canonicalization
- Acceptance: filters restore across surfaces; pinned sets; indexable templates

### Phase D — Trailboard (Workspace)
- Authenticated workspace route
- Create trails, add pages, capture provenance
- Node progress, notes, scroll position; curated templates
- Acceptance: keyboard-only management, resume flow, privacy handling

### Phase E — Web Atlas (Map Overlay)
- Map overlay toggle; layout with section regions
- Pin placement from `atlas_nodes`
- Lenses apply; trails draw paths
- Smooth pan/zoom; clustering by zoom level
- Acceptance: performance targets, accessibility, opt-in tour

### Phase F — Hardening & Rollout
- Cross-browser QA, performance tuning, security review
- Progressive rollout with feature flags and kill switches

## 6. Accessibility & Keyboard Specs
- Mega-Lens trigger: `aria-controls`, `aria-expanded`, focus management
- LensRibbon: use semantic form controls, live region for counts
- Command Palette: `role="combobox"` with listbox and `aria-activedescendant`
- Trailboard: keyboard alternative for drag & drop; live region announcements
- Atlas: focusable canvas/SVG; textual list of pins; accessible zoom controls

## 7. SEO & Fallback Strategy
- Real index pages for panel groupings
- Canonical, crawlable URLs for saved sets
- Breadcrumbs with schema.org metadata
- Precomputed facet counts for cacheable responses

## 8. Analytics & Experimentation
- Event taxonomy covering nav, facets, saved sets, trails, atlas usage
- Key funnels and A/B tests

## 9. Performance Playbook
- Panel payload budgets, edge caching, preloading strategies
- Rendering guidance: virtualization, IntersectionObserver, deferred scripts
- Atlas performance tactics: WebGL/SVG hybrid, quadtree hit-testing

## 10. Security & Privacy
- Row-level permissions, encryption
- Abuse controls, CSP tightening, SRI on third-party scripts
- Compliance: deletion requests with audit logs

## 11. Content & Ops
- Panel description guidelines
- Taxonomy governance
- CMS preview validations

## 12. Definition of Done
- Feature-specific accessibility, usability, and performance criteria

## 13. Rollout Plan
- Internal dogfood, private beta, progressive ramp, full launch communications

## 14. Post-Launch Iterations
- Recommendations, trail templates marketplace, atlas collaboration, offline support


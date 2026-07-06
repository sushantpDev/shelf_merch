# Shelf Merch Web → React MVC Architecture

## Status (updated)

- **Phase 1 / PR 1 is DONE and MERGED** (PR #86: TanStack Router → react-router v7, typecheck+build green).
- **Phase 2 / PR 2 (Campaigns MVC reference) is IN PROGRESS** — uncommitted in the working tree: `features/campaigns/model.ts`, `controllers/useCampaignsController.ts`, `controllers/useSendPointsController.ts`, `views/CampaignsEmptyStateView.tsx` created; `pointsDraft.ts` moved to feature root. Remaining: `views/CampaignsTableView.tsx`, `views/CampaignsView.tsx`, `views/SendGiftDialogView.tsx`, `views/SendPointsView.tsx`, thin `CampaignsPage.tsx`/`SendPointsPage.tsx` bindings, router lazy-import update, delete superseded files, `ARCHITECTURE.md`, verify (typecheck/build/eslint).
- Since #86 merged, the designated branch must be **restarted from latest `origin/main`** (`git fetch origin main && git checkout -B claude/youthful-davinci-cubfuc origin/main`) before committing PR 2 — uncommitted work carries over. PR 2 then goes up as a **new draft PR**.

## Context

The tenant + platform app just finished migrating off a legacy vanilla-JS engine onto React 19 / TS / Vite. Current stack couples two TanStack libraries: **react-query v5** (server state — 11 files) and **react-router v1 file-based** (52 route files; ~45 components import `Link`/`useNavigate`/`useParams`/`useSearch`). Screens under `features/<x>/` blend view and controller: each `XPage.tsx` mixes JSX with state, query/mutation calls, navigation, and handlers.

**Goal (user decisions, confirmed):**
1. **Replace `@tanstack/react-router` with `react-router` (v7)** — complete shift off TanStack except react-query.
2. **MVC via controller hooks** — per screen: `controllers/useXController.ts` owns all logic; `views/` are pure presentational components receiving props.
3. **Rollout: reference feature first** — Campaigns as the reviewed pattern (PR 2), then roll out feature-by-feature.

**Invariants (every PR):** zero visual/behavioral change; URLs identical; money math and react-query keys untouched (`WORKSPACE_QUERY_KEY`, etc.); CI gate (`npm run typecheck` + `npm run build`) green; files ≲300 lines.

> **Branch state (verified):** `origin/main` is **21 commits ahead** of this branch. There, `shelf-merch.js` / `ShelfMerchApp` are **already deleted** (engine cleanup done — no `mountShelfMerch` left), and TanStack Router is still fully in place. The route tree has also **grown** since the earlier snapshot: new nested layout routes (`app.kits.$id.tsx` + `.index`/`.edit`/`.send`, `app.shops.$id.tsx` + `.index`, `app.shops.$id.designs.$collectionId.tsx`, `app.campaigns.index.tsx`, `app.catalog.$id.tsx`, `login.tsx`).

---

## Phase 1 — PR 1: Router replacement (atomic, mechanical)

One PR — two routers can't coexist. No logic changes, only API swaps.

### Step 0 — Sync first (required)
Rebase this branch onto latest `origin/main` before touching anything (`git fetch origin main && git checkout -B claude/youthful-davinci-cubfuc origin/main`). The refactor must run against the current route tree, **enumerated fresh from `src/routes/` at build time** (it has grown past the earlier snapshot — nested `$id` layout routes now have `.index` children that render an `<Outlet/>`).

### Build wiring
- `apps/web/package.json`: add `react-router` (v7); remove `@tanstack/react-router`, `@tanstack/router-plugin`.
- `apps/web/vite.config.ts`: remove `tanstackRouter` plugin (import + `plugins` entry). Keep `devUploadsPlugin`, react, tailwind.
- Delete: `src/routes/` (52 files), `src/routeTree.gen.ts`, `src/router.tsx`.
- `src/main.tsx`: render `<RouterProvider router={appRouter} />`; drop the `declare module "@tanstack/react-router"` Register block.

### New central route config — `src/app/router.tsx`
`createBrowserRouter` with the exact current URL map. Use route **`lazy:`** per page to preserve per-route code splitting (matches current bundle shape).

- **Root layout** (port `routes/__root.tsx`): `QueryClientProvider` + `<Outlet/>` + `ChatWidget` + `Toaster` + `<ScrollRestoration/>`; `errorElement` = existing ErrorComponent; `path:"*"` = existing NotFound.
- `/` index → **loader** with `redirect()` (port `routes/index.tsx` `beforeLoad`: unauth→`/login`, platform→`/platform/dashboard`, tenant→`/app/orders`).
- `/login`, `/signup`, `/accept-invite` (search param read moves into the page via `useSearchParams`).
- `/app` → `TenantLayout` (children: orders, wallets, shops[+`/new`,`/:id`], swag[+`/new`], kits[+`/new`,`/:id/edit`,`/:id/send`], campaigns[+`/send-points`], contacts, integrations, settings, billing, catalog; index redirect per `routes/app.index.tsx`).
- `/platform` → `PlatformLayout` (dashboard, catalog[...], kits[...], orders[...], tenants, finance, inventory, production, shipments, support, team, audit, settings; index per `routes/platform.index.tsx`).
- `/shop/:id`, `/redeem/:token`.

### Mechanical conversions (~45 component files)
| TanStack | react-router v7 |
|---|---|
| `<Link to="/app/kits/$id/send" params={{id}}>` | `<Link to={`/app/kits/${id}/send`}>` |
| `navigate({ to, params, search })` | `navigate(pathString)` (encode search into the string) |
| `useParams({ from })` | `useParams()` (values `string \| undefined` — coerce at call site) |
| `useSearch({ from })` / `validateSearch` | `useSearchParams()` + local parse (4 files: kits/new `?template=`, campaigns/send-points `?shop=`, swag/new `?shop=`, accept-invite) |
| `useRouterState(select pathname)` | `useLocation().pathname` (`CollapsibleSidebar.tsx`) |
| `beforeLoad` + `redirect` | route `loader` + `redirect` (3 files: index, app.index, platform.index) |
| `Outlet` | same name, new import (6 files) |

Key files: `components/tenant/TenantLayout.tsx`, `components/tenant/CollapsibleSidebar.tsx`, `components/platform/PlatformLayout.tsx`, plus the Link/navigate call sites across `features/**`.

### Verify (PR 1)
`typecheck` + `build` green; manual click-through: login → `/app/orders`; every sidebar item; kits create→publish→send deep links (`/app/kits/:id/send`, `?template=`); shops `?shop=` hand-offs; platform dashboard; `/shop/:id` storefront; `/redeem/:token`; logout → `/login`; unknown URL → 404.

---

## Phase 2 — PR 2: MVC reference feature — Campaigns

Target structure (the template for all features):

```
features/campaigns/
  model.ts                     # react-query hooks: consolidate mutations.ts (+ any queries); Ui types re-exports
  controllers/
    useCampaignsController.ts  # list page: workspace slice, sendGift dialog state
    useSendPointsController.ts # wizard: draft reducer, step state, totals, payNow, navigation
  views/
    CampaignsView.tsx          # pure: renders empty-state or table from props
    CampaignsTableView.tsx     # pure (filter/search/pagination state lifted to controller)
    CampaignsEmptyStateView.tsx
    SendPointsView.tsx         # pure wizard shell + step views
    SendGiftDialogView.tsx
  pointsDraft.ts               # reducer stays (pure model-side state logic)
  CampaignsPage.tsx / SendPointsPage.tsx   # 5–10 line bindings: controller() → <View {...vm}/>
```

**Rules encoded by this PR:**
- **Views**: props only — no react-query, no router, no `services/` imports; navigation/toasts surface as callbacks from the controller.
- **Controllers**: own `useState`/`useReducer`, model hooks, `useNavigate`/`useSearchParams`, sonner toasts; return one view-model object.
- **Model**: per-feature `model.ts` wraps `services/api-bridge` flows in react-query hooks (existing `hooks.ts`/`mutations.ts` consolidated + renamed). Shared `services/` layer unchanged.
- Reuse as-is: `features/send/*` panels (already pure views), `hooks/useWorkspace.ts` (shared model hook).
- Add `apps/web/ARCHITECTURE.md` — one page documenting M/V/C rules with the campaigns example.

### Verify (PR 2)
Campaigns list (stats/filters/search/pagination), Send Gift dialog both paths, send-points wizard all 4 steps E2E against the API; typecheck/build/eslint.

---

## Phase 3 — PRs 3+: rollout by feature (same pattern)

| PR | Features | Notes |
|---|---|---|
| 3 | auth, billing, integrations, settings, orders | small/simple screens |
| 4 | contacts, catalog | forms + tables |
| 5 | kits (list, create/edit wizards, send checkout) | `kitDraft`/`sendDraft` reducers stay; wizard steps become views |
| 6 | shops, swag | Konva `MockupCanvas` remains a view; `mockup-bake.ts` stays lib/model |
| 7 | wallets | org wizard already reducer-driven — thin controller extraction |
| 8 (optional) | `components/platform/*`, `StoreShell`, `RedemptionPortal` | platform area + public surfaces, same pattern |

Each PR: move logic out of `XPage.tsx` into `controllers/`, JSX into `views/`, query/mutation hooks into `model.ts`. No renames of routes/URLs; no behavior change.

---

## Explicitly out of scope
- Re-enabling React StrictMode (possible now that the legacy engine is gone — separate decision, may surface Konva double-mount issues).
- Repo-wide prettier pass (tracked separately; lint stays ungated).
- Any backend/API changes.

## Verification summary
- Every PR: `npm run typecheck -w @shelfmerch/web`, `npm run build -w @shelfmerch/web` (both CI-gated), `eslint` on touched files.
- PR 1 carries the full manual route click-through checklist above (highest risk).
- PRs 2+ are behavior-preserving refactors verified per feature flow.
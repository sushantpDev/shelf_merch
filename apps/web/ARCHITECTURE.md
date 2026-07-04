# Web App Architecture — MVC via Controller Hooks

Every screen in `src/features/<feature>/` follows the same Model–View–Controller split.
The reference implementation is **`features/campaigns/`** — copy its shape when migrating
or adding a feature.

```
features/campaigns/
  model.ts                       # M: react-query hooks + Ui type re-exports + domain predicates
  controllers/
    useCampaignsController.ts    # C: one hook per screen, returns a single view-model object
    useSendPointsController.ts
  views/
    CampaignsView.tsx            # V: pure components — props in, callbacks out
    CampaignsTableView.tsx
    CampaignsEmptyStateView.tsx
    SendGiftDialogView.tsx
    SendPointsView.tsx
  pointsDraft.ts                 # pure reducer (model-side state logic)
  CampaignsPage.tsx              # thin binding: const vm = useXController(); return <XView {...vm}/>
  SendPointsPage.tsx
```

## Model (`model.ts`)

- Wraps `services/` flows (e.g. `services/api-bridge`) in **react-query** hooks:
  queries and `useMutation`s that invalidate `WORKSPACE_QUERY_KEY` on success.
- Re-exports the `Ui*` types views need (`export type { UiCampaign } from "@/services/mappers"`),
  so views never import from `services/` directly.
- Holds pure domain predicates/derivations (e.g. `isLiveCampaign`) shared by controller and views.
- The shared model hook `hooks/useWorkspace.ts` is the single source of truth for the tenant
  workspace snapshot; features select slices from it. Never fork its query key.
- Pure state reducers (wizard drafts like `pointsDraft.ts`) live beside `model.ts`.

## Views (`views/*.tsx`)

- **Props only.** No react-query, no `services/` imports, no toasts, no imperative routing
  (`useNavigate`/`useParams`/`useSearchParams` live in controllers). Declarative `<Link>` is
  allowed — it renders an anchor, which is presentation.
- Anything that navigates imperatively, mutates, or notifies surfaces as a **callback prop**
  supplied by the controller (`onSendGift`, `onSelectKit`, `onPayNow`, `onApplyPromo`, …).
- Local DOM wiring (e.g. a `useRef` to a hidden file input) may stay in the view.
- Views may import: other views, shared presentational components (`components/LoadingState`,
  `components/ui/*`), icons, pure formatters (`inr`, `POINT_VALUE`), and types/predicates from
  the feature's `model.ts` or controller (types only).
- Local formatting helpers and tiny private subcomponents (e.g. `StatCard`, `SumRow`) stay in
  the view file.

## Controllers (`controllers/useXController.ts`)

- One hook per screen. Owns **all** logic:
  - `useState` / `useReducer` (UI state — filters, pagination, dialog open/closed, wizard step),
  - model hooks (`useWorkspace`, mutations from `model.ts`),
  - routing (`useNavigate`, `useParams`, `useSearchParams`),
  - side effects and `sonner` toasts,
  - derived data (filtering, pagination math, stats).
- Returns **one view-model object** (typed, exported as `XVm`) that the view spreads as props.
- Exposes intent-named callbacks, not setters (`onFilter` resets the page; the view doesn't know).

## Pages (`XPage.tsx`)

Thin bindings only — the route target the router lazy-loads:

```tsx
export function CampaignsPage() {
  const vm = useCampaignsController();
  return <CampaignsView {...vm} />;
}
```

Self-contained widgets embedded in another screen (e.g. `settings/TransferOwnershipDialog.tsx`)
follow the same shape: a thin binding at the feature root that calls a parametrized controller
(`useTransferOwnershipController(props)`) and renders its view.

## Routing (`src/app/router.tsx`)

- Central `createBrowserRouter` config; every page is registered with `lazy:` for per-route
  code splitting.
- Auth/area guards are route **loaders** (`services/tenant-route-guards.ts` + `redirect()`),
  not component logic.
- URLs are the public contract — refactors must never change them.

## Invariants for every migration PR

- Zero visual or behavioral change; URLs identical.
- Money math (`features/send/money.ts`) and react-query keys untouched.
- CI gate stays green: `npm run typecheck -w @shelfmerch/web` and `npm run build -w @shelfmerch/web`.
- Keep files ≲300 lines — split views before they grow past that.

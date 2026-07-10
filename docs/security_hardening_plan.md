# ShelfMerch — Advanced Security Implementation Plan

Status: **proposed** · Scope: `apps/api`, `apps/web`, `deploy/`, `.github/`
Prepared: 2026-07-10 · Complements Phase 8 ("Hardening & deployment") of the roadmap.

This plan is based on a review of the current codebase: `app.js` middleware
stack, auth module, session/rate-limit/idempotency services, tenant-scope and
soft-delete plugins, media/upload routes, frontend token handling, nginx +
PM2 deploy assets, and the CI workflow.

---

## 1. Current security posture (what already exists)

The app has a strong baseline for its stage — the plan below builds on it
rather than replacing it:

| Area | Current state |
|---|---|
| Authn | JWT access (15m) + rotating refresh (30d, SHA-256-hashed at rest in Redis/Mongo), bcrypt cost 12, invite/forgot/reset flows with hashed one-time tokens, uniform "email exists" behavior |
| Authz | RBAC + ABAC middleware chain (`authenticate → resolveTenant → requireRole → requireScope`), role reloaded from DB per request, entity-scoped managers |
| Tenant isolation | Mongoose `tenantScope` plugin rejects any query missing `tenantId` (platform routes opt out explicitly) |
| Money | Append-only `WalletTransaction` ledger, Mongo transactions, `Idempotency-Key` replay cache, state machines for status transitions |
| Input validation | Zod `validate()` on body/query/params across routes |
| Rate limiting | Redis fixed-window on login, register, forgot/reset, OTP send/verify (per-IP + per-email/token) |
| Webhooks | Razorpay signature verified against the raw body |
| Headers | Helmet enabled; JSON body limit 1 MB |
| Audit | `AuditLog` written on state-changing actions; impersonation is tokenized (15m) and audited |
| Errors | Central handler; no stack traces leaked; Mongo errors mapped |
| Ops | Env validated with Zod (prod refuses <16-char JWT secrets), health check, pino structured logs |

## 2. Gap analysis (findings, ranked)

### Critical

- **C1 — No TLS.** `deploy/nginx.conf` listens on port 80 only and proxies to
  the app; the Node server is also directly reachable on `:8080`. Credentials,
  JWTs, OTPs, and Razorpay traffic transit in cleartext. (`deploy/nginx.conf`,
  `deploy/setup.sh`)
- **C2 — CORS fails open in production.** Empty `CORS_ORIGINS` ⇒
  `origin: true, credentials: true` (any origin, with credentials).
  (`apps/api/src/app.js:76`, `.env.example:52`)
- **C3 — Rate limiting fails open.** When Redis is down, limits are skipped
  entirely (documented in `.env.example`), so brute-force protection on
  login/OTP disappears silently. (`services/rateLimit.service.js`)
- **C4 — CSP disabled in production.** `helmet({ contentSecurityPolicy: false })`
  in prod; the SPA and `/uploads` are served with no CSP, and uploads have no
  MIME filtering — an uploaded SVG/HTML file served from `/uploads` executes
  script on the app origin (stored XSS). (`apps/api/src/app.js:93-114`,
  all `multer(...)` routes have `limits` but no `fileFilter`)

### High

- **H1 — Refresh token (30d) in `sessionStorage`.** Any XSS exfiltrates a
  month-long credential. No rotation-reuse detection: a stolen-then-rotated
  token is not treated as a compromise signal. (`apps/web/src/services/auth-store.ts`,
  `auth.service.js refresh()`)
- **H2 — No account lockout / weak password policy.** Only `min(8)`; rate
  limits are the sole brute-force control (and see C3). No breached-password
  or complexity check, no 2FA — including for `platform_super_admin`.
  (`auth.validation.js`)
- **H3 — JWT verification is not pinned.** No `algorithms`, `issuer`, or
  `audience` on sign/verify; access and refresh secrets are single, static,
  non-rotatable values. (`auth.middleware.js`, `auth.service.js`)
- **H4 — Dependency risk unmanaged.** `xlsx@0.18.5` has known unfixed
  advisories (prototype pollution, ReDoS) and parses tenant-uploaded files;
  CI runs no `npm audit`, no Dependabot/secret-scanning config exists.
  (`apps/api/package.json`, `.github/workflows/ci.yml`)
- **H5 — IP spoofing against rate limits.** `trust proxy: 1` is correct
  behind nginx, but the app is also exposed directly on `:8080`, where a
  client-supplied `X-Forwarded-For` becomes `req.ip` — defeating per-IP
  limits. (`app.js:92`, firewall not enforced in `deploy/setup.sh`)

### Medium

- **M1 — Media proxy SSRF surface.** `/media/proxy` allowlists URL prefixes
  (good) but follows redirects, has no response-size cap or content-type
  allowlist, and echoes upstream content-type. (`modules/media/media.routes.js`)
- **M2 — No NoSQL-injection defense-in-depth.** Zod covers declared fields,
  but nothing strips `$`-prefixed keys globally (e.g. from unvalidated query
  params or future routes); no HTTP-parameter-pollution guard.
- **M3 — No security observability.** No Sentry/alerting, no anomaly signals
  (failed-login spikes, impersonation usage, ledger recompute mismatches);
  audit logs have no retention/immutability story beyond "append".
- **M4 — Uploads stored/served without normalization.** Memory-storage multer
  up to 25 MB per file (DoS via concurrent uploads), original filenames/types
  trusted downstream, `/uploads` served with default headers.
- **M5 — Secrets lifecycle.** Plain `.env` on the VPS, no rotation procedure,
  demo seed credentials documented in README (fine for dev; must never reach
  prod DB — the seed script already warns, but nothing enforces it).

### Low

- **L1** — `logout` doesn't require auth context for `everywhere` (verify it
  derives `userId` from the access token, not the body).
- **L2** — No `security.txt`, no vulnerability-disclosure doc.
- **L3** — Session records keep IP/UA but there's no "active sessions" UI or
  admin revocation endpoint.
- **L4** — Prod SPA served with `maxAge: '1d'` incl. `index.html` fallback —
  ensure `index.html` is `no-cache` so security fixes roll out immediately.

## 3. Implementation plan

Four phases, ordered by risk. Each item lists concrete touch points. Phases
A and B are the "advanced security" core; C and D are maturity work.

### Phase A — Transport, headers & fail-closed edges (~1 week)

**A1. TLS everywhere + HSTS**
- Extend `deploy/nginx.conf`: 443 with Let's Encrypt (certbot), HTTP→HTTPS
  301, `Strict-Transport-Security: max-age=31536000; includeSubDomains`.
- `deploy/setup.sh`: install certbot, `ufw allow 80,443` and **deny 8080**
  externally (app binds fine on 0.0.0.0; firewall closes it).
- App: when `NODE_ENV=production`, set `app.set('trust proxy', 1)` only if
  behind nginx (env flag `TRUST_PROXY=1`), else `false` — fixes H5.
- Mark auth cookies (added in B1) `Secure`.

**A2. CORS fail-closed**
- `config/env.js`: in production, make `CORS_ORIGINS` **required** (Zod
  refinement); remove the "empty = allow all" branch in `resolveCorsOptions`.
- Keep the same-host-origin allowance for the unified server.

**A3. Rate limiting fails closed on auth routes + global limiter**
- `services/rateLimit.service.js`: add per-scope `failMode`; auth/OTP scopes
  return 503 (or a conservative in-memory fallback limiter) when Redis is
  down instead of skipping.
- Add a coarse global limiter (e.g. 300 req/min/IP on `/api/v1`) and a
  per-tenant write limiter to protect money routes.

**A4. CSP + upload hardening (stored-XSS kill)**
- Re-enable CSP in production with an explicit policy (SPA is same-origin:
  `default-src 'self'`; allow R2/S3 image hosts from env; `object-src 'none'`;
  `frame-ancestors 'none'`).
- Add a shared multer `fileFilter` (allowlist: png/jpg/webp/pdf/csv/xlsx per
  route) + extension↔MIME agreement check; reject SVG or sanitize it.
- Serve `/uploads` with `X-Content-Type-Options: nosniff`,
  `Content-Security-Policy: sandbox`, and `Content-Disposition: attachment`
  for non-image types.
- Add `Referrer-Policy`, `Permissions-Policy`, and `Cross-Origin-Opener-Policy`
  via helmet options.

Exit criteria: SSL Labs A grade; `curl` origin-spoof tests rejected; login
brute force returns 429/503 with Redis stopped; uploading an SVG/HTML file is
rejected and existing files can't execute script.

### Phase B — Identity & session hardening (~1–2 weeks)

**B1. Move refresh tokens to httpOnly cookies + reuse detection**
- API: set refresh token as `httpOnly; Secure; SameSite=Strict; Path=/api/v1/auth`
  cookie on login/refresh; keep body-token support one release for migration.
- Add a `familyId` per login; on refresh, if a **revoked/rotated** hash is
  presented, revoke the whole family and audit (`token_reuse_detected`).
- Web: drop `sm_refresh` from `auth-store.ts`; keep access token in memory
  (module state) with `sessionStorage` only as tab-restore fallback for the
  short-lived access token.
- CSRF: refresh becomes cookie-authenticated ⇒ require a custom header
  (`X-Requested-With`) + `SameSite=Strict`; document why full CSRF tokens
  aren't needed for Bearer-authenticated routes.

**B2. Credential policy + lockout + 2FA**
- Password policy: min 10, reject top-10k common passwords (packaged list),
  zxcvbn-style score on the frontend.
- Progressive lockout on the `User` doc (failed count + `lockedUntil`,
  15 min after 10 failures) — works even when Redis is down; audit lockouts.
- TOTP 2FA (`otplib`): opt-in for tenant users, **mandatory for `platform_*`
  roles**; backup codes (hashed); enforce at login and on impersonation start.

**B3. JWT hardening**
- Sign/verify with `algorithms: ['HS256']`, `issuer: 'shelfmerch-api'`,
  `audience: 'shelfmerch-web'`; add `jti`.
- Support keyed secrets (`kid` header + `JWT_ACCESS_SECRETS=v2:...,v1:...`)
  to enable zero-downtime rotation; document rotation runbook in `docs/`.
- Add `tokenVersion` on `User`, bumped on password reset/role revocation, so
  access tokens die before their 15m expiry on security events.

**B4. Supply chain & CI security gates**
- `.github/dependabot.yml` (npm, weekly, grouped).
- CI: add `npm audit --omit=dev --audit-level=high` job (allowlist file for
  accepted risks) + CodeQL workflow + gitleaks secret scan.
- Replace `xlsx` with `exceljs` (or SheetJS ≥0.20 from the vendor registry)
  in the imports module; parse spreadsheets inside the BullMQ worker with
  size/row caps, never on the request path.

Exit criteria: stolen-refresh-token replay revokes the session family and is
audited; platform admin login requires TOTP; `npm audit` gate green; secrets
rotatable without logout storms.

### Phase C — Abuse resistance & observability (~1 week)

- **C-1 Defense-in-depth input hygiene:** small middleware to strip `$`/`.`
  keys from `req.body`/`req.query` (or `express-mongo-sanitize` equivalent for
  Express 5) + `hpp`-style last-value-wins for repeated params.
- **C-2 Media proxy hardening:** `redirect: 'error'` on fetch, 10 MB response
  cap (stream + count), content-type allowlist (`image/*`), 5 s timeout.
- **C-3 Security telemetry:** Sentry (API + web) with PII scrubbing; pino
  serializers that redact `authorization`, cookies, OTP codes, tokens;
  alert rules: failed-login spike, `token_reuse_detected`, impersonation
  start, wallet recompute mismatch, 5xx rate.
- **C-4 Sessions UI + admin revocation:** `GET /users/me/sessions`,
  `DELETE /users/me/sessions/:id`, platform endpoint to revoke a user's
  sessions (uses existing `revokeAllUserSessions`).
- **C-5 Audit log integrity:** hash-chain (`prevHash`) per tenant on
  `AuditLog`, retention policy (e.g. 2y), export endpoint for auditors;
  extend the existing `platform_readonly_auditor` views.

### Phase D — Operational & compliance maturity (continuous)

- Secrets manager or SOPS-encrypted env on the VPS; documented rotation
  cadence (JWT quarterly, Razorpay/MSG91 on staff change).
- Mongo Atlas: IP allowlist to the VPS only, distinct app user with
  least-privilege roles, PITR backups + restore drill.
- Redis: require `requirepass`/TLS in production env template.
- Data lifecycle (ties into roadmap Phase 8): tenant data export, deletion
  SLA for soft-deleted records, PII field inventory.
- `security.txt` + `docs/SECURITY.md` disclosure policy.
- Pre-launch penetration test focused on tenant-isolation bypass, ledger
  manipulation via idempotency replay, and redemption-token abuse.
- Load-test the rate limiters and upload paths (memory-storage DoS ceiling).

## 4. Suggested delivery order & sizing

| PR | Contents | Size |
|---|---|---|
| 1 | A2 + A3 (CORS fail-closed, fail-closed auth limits, global limiter) | S |
| 2 | A4 (CSP, upload fileFilter, /uploads headers) | M |
| 3 | A1 (nginx TLS, firewall, trust-proxy flag) — deploy assets | S |
| 4 | B1 (cookie refresh + reuse detection + web changes) | L |
| 5 | B2 (lockout, password policy, TOTP) | L |
| 6 | B3 (JWT iss/aud/kid, tokenVersion) | M |
| 7 | B4 (Dependabot, audit/CodeQL/gitleaks CI, xlsx replacement) | M |
| 8+ | Phase C items, one PR each | S–M |

Every PR: vitest coverage for the new control (e.g. “refresh with rotated
token revokes family”, “SVG upload rejected”, “login with Redis down → 503”),
plus a manual verification note against a seeded environment.

## 5. Non-goals (explicitly out of scope for now)

- SSO/SAML/SCIM for enterprise tenants (future commercial feature).
- Field-level encryption of PII in Mongo (revisit after PII inventory in D).
- WAF/CDN (Cloudflare) — worthwhile, but orthogonal to app changes; can be
  layered in front of nginx at any time.

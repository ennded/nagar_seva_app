# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Nagar Seva — a multi-tenant civic services/municipal grievance platform for India. Each municipality ("city") is a tenant identified by a `citySlug`; citizens submit complaints/appointments, staff (Admin, Officer, Nagarsevak, Nagaradhyaksh, Driver) act on them within their scope.

## Commands

Run from the repo root unless noted. This is an npm workspaces monorepo (`shared`, `services/core-service`, `services/notification-service`, `services/media-service`, `services/api-gateway`, `client`).

```bash
npm run dev              # builds shared, then runs all 4 services + client concurrently (tsx watch / vite)
npm run build            # builds shared then every service then client, in dependency order
npm run test             # runs vitest for core-service, notification-service, media-service (not client — no client tests exist)
npm run compose:up       # docker compose -f infra/docker-compose.yml up --build
npm run compose:down
npm run onboard-city -- --name "Pune" --slug pune --adminName "Asha Patil" --adminMobile "9800000001"
```

Per-service (from repo root, `-w <workspace>`, or `cd` into the folder):

```bash
npm run dev -w services/core-service       # tsx watch src/index.ts
npm run build -w services/core-service     # tsc -p tsconfig.json
npm run test -w services/core-service      # vitest run (real MongoDB, not mocked — see Testing below)
npm run dev -w client                      # vite; client is NOT part of docker rebuilds during iteration
npm run build -w client                    # tsc -b && vite build — use this as the client's typecheck step
```

To run a single test file: `npx vitest run src/auth/jwt.test.ts` from inside the relevant service directory (`services/core-service`, `services/notification-service`, or `services/media-service`).

There is no lint script configured in any workspace.

**Client-only iteration**: the client is excluded from `docker compose` rebuilds during development — run `npm run dev -w client` directly against the dockerized (or locally running) backend instead of rebuilding the `client` container each time.

**Apollo Gateway caveat**: `services/api-gateway` uses `IntrospectAndCompose` against the running subgraphs. It must be **restarted** after any change to `core-service` or `notification-service`'s `typeDefs.ts` for the gateway to pick up the new schema — a `tsx watch` reload of the subgraph alone is not enough.

## Architecture

### Services (Apollo Federation subgraphs behind a gateway)

- **`services/api-gateway`** (port 4000) — Apollo Gateway composing `core-service` and `notification-service` subgraphs via `IntrospectAndCompose`. Does no auth itself; forwards the client's `Authorization` header unchanged to every subgraph (`AuthForwardingDataSource`). This is the single GraphQL endpoint the client talks to.
- **`services/core-service`** (port 4001) — the primary subgraph: Cities, Wards, Departments, Users (all roles), Requests (complaints/appointments), Announcements, EmergencyContacts, Vehicles. Owns auth (JWT issuance, OTP, staff login) and all tenant-scoped business logic.
- **`services/notification-service`** (port 4002) — its own subgraph plus an internal REST-ish endpoint (`src/internal/notify.ts`) that `core-service` calls directly (`services/core-service/src/services/notificationClient.ts`, via `NOTIFICATION_INTERNAL_URL`) to fan out notifications — this is service-to-service, not through the gateway.
- **`services/media-service`** (port 4003) — plain REST (not GraphQL/federated): file upload (`rest/upload.ts`) and KYC document handling (`rest/kyc.ts`), pluggable storage (`storage/` interface, local-disk provider implemented). The client calls it directly via `VITE_UPLOAD_URL`/`VITE_MEDIA_URL`, not through the gateway.
- **`shared`** — cross-service constants/types only: `enums.ts` defines `ROLES`, `REQUEST_STATUSES`, `REQUEST_PRIORITIES`, category enums, and the **status transition tables** (`COMPLAINT_TRANSITIONS`, `APPOINTMENT_TRANSITIONS`) that `core-service`'s `request.service.ts` uses as the single source of truth for legal status changes. Must be built (`npm run build -w shared`) before other workspaces since they import its compiled output.

### Multi-tenancy and authorization (core-service)

- Every JWT encodes a `city` id. `requireRole(ctx, roles)` (`services/core-service/src/auth/authorize.ts`) is the **single tenant-isolation gate**: it checks the caller's role and returns `{ user, city }` — resolvers must always scope queries/mutations using that returned `city`, never a client-supplied city id.
- Role model (`shared/enums.ts` `ROLES`): `admin`, `nagarsevak`, `nagaradhyaksh`, `officer`, `citizen`, `driver`.
  - **Admin**: full access within their one city (the vendor's on-site operator post-deal).
  - **Nagarsevak**: read-only monitor scoped to their own `ward`, plus can publish ward-scoped announcements directly (no draft step).
  - **Nagaradhyaksh**: read-only monitor scoped to the whole city; announcements they create are drafts an Admin must publish, except they can set `isEmergency`.
  - **Officer**: acts only on requests assigned to them (own department/ward).
  - **Driver**: single-vehicle on/off-duty + live lat/lng tracking, ward-scoped.
  - **Citizen**: end-user, submits complaints/appointments, tracks own requests and ward garbage-vehicle location.
- `buildContext` (`auth/context.ts`) resolves the JWT into a full `User` doc with `ward`/`department` **populated**. Any new resolver path that fetches a `User`, `Ward`, or `Request` and returns it through GraphQL must also populate its refs — `serialize.ts`'s `mapUser`/`mapWard`/`mapRequest` fail soft to `null` on an unpopulated ObjectId (to avoid crashing non-null GraphQL fields), so a missed `.populate()` silently produces `null` fields rather than an error. When comparing ownership (e.g. `citizen === currentUser`) on a possibly-populated ref, use the `idOf(ref)` helper (`String(ref?._id ?? ref)`) in `request.resolvers.ts`, not a bare `String(ref)`.
- Requests use a Mongoose discriminator: `RequestModel` base (`models/Request.ts`) with `ComplaintModel`/`AppointmentModel` discriminators. Status transitions are validated centrally against `shared`'s transition tables in `request.service.ts`, not scattered per-resolver.

### SMS / OTP

OTP codes are bcrypt-hashed with a Mongo TTL index (`models/OtpRequest.ts`). `SMS_PROVIDER=console` is the only implemented provider — it logs OTPs to the server terminal instead of sending real SMS. This is intentional for local/demo use (no real SMS provider is wired up); swapping in a real provider means implementing `services/sms/sms.interface.ts` and switching `SMS_PROVIDER`.

### Client (React 18 + Vite)

- Routing (`App.tsx`) is entirely `/:citySlug/...`-prefixed; `ProtectedRoute` gates each role's subtree by `allowedRoles`. There's a separate `CityPickerPage` at `/` and a per-city public `LandingPage` at `/:citySlug`.
- Each staff role has its own `<Role>Layout.tsx` (nav + `StaffLayout` → `StaffShellFrame`, a shared card-shell chrome) and feature pages under `features/<role>/`.
- Apollo Client (`apollo/client.ts`): `errorLink` watches for `UNAUTHENTICATED` GraphQL errors and force-clears the session + redirects to that city's login — this is the global "your session died" handler, don't duplicate that logic in individual pages.
- i18n: `react-i18next`, namespaces in `i18n/locales/{en,mr}.json`. **Every user-facing string must go through `t()`** — a past bug shipped an entire marketing page with hardcoded English that the language switcher couldn't touch. When adding a page, add its strings to both locale files in the same change.
- GraphQL documents live in `graphql/queries/*.ts` and `graphql/mutations/*.ts`; hand-written response types in `graphql/types.ts` are kept in sync manually (no codegen) — when a query's selection set changes, update the matching type.
- Design system: fixed palette/typography (Navy `#0B3D66`, Orange `#E07A1F`, Green `#1E8A5F`, Public Sans + Source Serif 4) defined in `index.css`; staff pages follow a shared shell pattern (`StaffShellFrame`, `.admin-panel`, `.stat-tile`, `.filter-pill`). New staff pages should reuse these classes rather than introducing new visual patterns, and should only surface fields/actions backed by real backend data — not decorative placeholders.

### Testing

vitest across `core-service`, `notification-service`, `media-service`, all against **real** (non-mocked) MongoDB databases with dedicated test DB names (e.g. `nagar_seva_test`, `nagar_seva_notification_test`) set up in each service's `src/test/dbSetup.ts`, kept separate from dev data. Each service's `tsconfig.json` excludes `src/**/*.test.ts` and `src/test/**` from the production build. The client has no test suite — verify client changes with `npm run build -w client` (typecheck) and manual/browser testing.

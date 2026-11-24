# TetoDairy — Frontend

Mobile-first Vue 3 PWA for the **TetoDairy** herd-management platform, a product of
**Teto Technologies**. The public landing page is a pre-sales site with a contact form;
existing farms keep their own workspace name (for example, Spring Water Dairy) inside
the authenticated app shell.

## Stack

- Vue 3 + TypeScript, Vue Router, Pinia.
- TanStack Vue Query for server state.
- Tailwind CSS for styling.
- Dexie/IndexedDB for offline data and queued writes.
- Vite for development and production builds.
- English and Swahili UI copy in `src/locales`.

No new dependencies are required for the public site or seller console.

## Local development

Requires Node 22.18+ or 24.12+.

```bash
npm ci
npm run dev
```

The app runs at <http://localhost:5173>. `vite.config.ts` proxies `/api/v1` to
`http://localhost:8000`; start the backend before loading API-backed screens.

`VITE_API_BASE_URL` in `.env` controls the API prefix. It defaults to `/api/v1`.

## Build and checks

```bash
npm run type-check
npm run build
npm run preview
```

`npm run build` runs the type check and produces `dist/`.

## Public site

- `/` fetches `GET /site` and `GET /plans`. If the API is unavailable, translated
  defaults keep the landing page usable.
- The two "Get started" calls to action and each plan's "Choose plan" button scroll to
  `#contact`.
- The contact form posts to `POST /contact-inquiries`, validates locally, shows API field
  errors, and explains rate limiting (5 requests/minute).
- Everyone signs in at `/login`; the public footer has no separate seller link.
- Branding constants: product `TetoDairy`, parent `Teto Technologies` (`https://teto.co.ke`),
  footer text exactly `Powered by Teto Technologies`.

## Seller console

- `/login` handles both identities: a Platform Admin is routed to `/seller`, farm users
  to `/dashboard`.
- `/seller` is guarded by `meta.roles: ["Platform Admin"]`. Other roles are sent to the
  dashboard with a friendly notice.
- While impersonating a farm, `/seller/*` calls keep using the Platform Admin token and
  farm calls use the short-lived impersonation token, so seller actions never fail with
  a farm user's 403. Token changes are synced across open tabs.
- Tabs: overview, site info, landing content, plans & pricing, farms & subscriptions,
  and inquiries. All seller calls use the same `/auth/login` token.
- Landing content arrays are edited with repeatable rows, not raw JSON.

### Farm impersonation

1. "Open farm as owner" asks for a reason and calls the impersonation endpoint.
2. The original token is saved in `localStorage["swd.seller_token"]` and metadata in
   `localStorage["swd.impersonation"]`; `swd.token` is replaced with the farm token and the
   page reloads at `/dashboard`.
3. A fixed banner shows the impersonated user, farm and expiry. Returning restores the
   seller token, calls the end endpoint, clears both keys and reloads `/seller`.
4. A 401 while impersonating restores the seller session and redirects to `/seller` with a
   notice. Normal 401 handling is unchanged.

## Offline behaviour

- Mutating farm requests that fail while offline are queued in the Pinia offline store and
  replayed after connectivity returns.
- Authentication, sync, seller-console and contact-inquiry writes are never queued.
- The service worker caches the app shell but not API or authenticated responses.
- Sync uses `/sync/changes` and tracks state in IndexedDB.

## Structure

| Path | Purpose |
| --- | --- |
| `src/app` | App shell, router, navigation and i18n. |
| `src/features` | Feature modules (animals, milk, breeding, calves, health, dashboard, reports, users, setup, alerts, landing, auth, seller). |
| `src/api` | Axios client, error handling, impersonation helpers and offline queue helpers. |
| `src/stores` | Pinia stores, including auth, public site, seller state and offline state. |
| `src/components` | Shared UI components (sidebar, top bar, bottom navigation). |
| `src/locales` | English and Swahili translations. |

## Related repositories

- Backend API: <https://github.com/Rotich-elias/Spring-water-dairy>

## Docker

The production image builds the app with Node and serves `dist/` through nginx. The
frontend nginx service proxies `/api` and `/storage` to the backend web service.

The full stack (nginx, php-fpm, this frontend, MySQL, Redis, queue and scheduler) is
described by a `docker-compose.yml` in the main project checkout, which expects this
project at `frontend/` next to `backend/`.

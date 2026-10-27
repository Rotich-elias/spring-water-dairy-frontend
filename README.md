# Spring Water Dairy — Frontend

Mobile-first Vue 3 PWA for the Spring Water Dairy herd-management API.

## Stack

- Vue 3 + TypeScript, Vue Router, Pinia.
- TanStack Vue Query for server state.
- Tailwind CSS for styling.
- Dexie/IndexedDB for offline data and queued writes.
- Vite for development and production builds.

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

## Offline behaviour

- Mutating requests that fail while offline are queued in the Pinia offline store and
  replayed after connectivity returns.
- Authentication and sync writes are never queued.
- The service worker caches the app shell but not API or authenticated responses.
- Sync uses `/sync/changes` and tracks state in IndexedDB.

## Structure

| Path | Purpose |
| --- | --- |
| `src/app` | App shell, router and layout. |
| `src/features` | Feature modules (animals, milk, breeding, calves, health, dashboard, reports, users, setup, alerts). |
| `src/api` | Axios client, error handling and offline queue helpers. |
| `src/stores` | Pinia stores, including offline and auth state. |
| `src/components` | Shared UI components. |
| `src/locales` | English and Swahili translations. |

## Related repositories

- Backend API: <https://github.com/Rotich-elias/Spring-water-dairy>

## Docker

The production image builds the app with Node and serves `dist/` through nginx. The
frontend nginx service proxies `/api` and `/storage` to the backend web service.

The full stack (nginx, php-fpm, this frontend, MySQL, Redis, queue and scheduler) is
described by a `docker-compose.yml` in the main project checkout, which expects this
project at `frontend/` next to `backend/`.

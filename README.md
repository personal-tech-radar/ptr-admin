# PTR Admin

Client-side Angular 21 administration SPA for Personal Tech Radar. It uses standalone Angular APIs, strict TypeScript, signals/RxJS, Tailwind CSS v4, and the current Spartan UI foundation (`@spartan-ng/brain`). The visual language follows the PTR frontend, with an orange administration accent.

## Development

Prerequisites: Node.js 20.19+, 22.12+ or 24+, npm 10+, and the PTR backend running locally.

```bash
npm install
npm start
```

Open `http://localhost:4200/login`. The backend OpenAPI document used for this implementation is `http://localhost:3300/docs-json`.

```bash
npm run lint
npm test
npm run format:check
npm run build
npm run test:e2e
```

The Playwright suite uses the running backend and requires `ADMIN_EMAIL` and `ADMIN_PASSWORD` in the process environment. For the local PTR backend, run `node --env-file=../ptr-backend/.env node_modules/playwright/cli.js test`. Install its Chromium browser with `npx playwright install chromium` if needed. Browser tests cover desktop and mobile Chromium; they do not create or delete production records.

## Configuration

The browser loads `public/runtime-config.js` before Angular starts. Set `globalThis.__PTR_ADMIN_CONFIG__.apiBaseUrl` to the administrator API origin for each environment. The default is `http://localhost:3300`; the file is public configuration and must not contain credentials or tokens.

Administrator access is separate from normal-user authentication. The SPA keeps only the administrator access token in `localStorage` under `ptr-admin-token`, attaches it only to `/admin/*` requests, and clears it on a 401.

## Routes

`/login`, `/dashboard`, `/articles` and `/articles/:id`, `/sources` and `/sources/:id` (plus `/sources/candidates/:id`), `/taxonomy` and `/taxonomy/:id` (including the Content streams tab), `/jobs` and `/jobs/:queue/:id`, `/digests` and `/digests/:id`, `/users`, `/users/:id`, `/info-pages`, `/info-pages/new`, `/info-pages/:id`, and `/admins` are direct Angular routes. The former `/coverage` URL redirects to the Taxonomy list. Protected routes use the administrator auth guard, and their filters live in query parameters. The Dashboard refreshes every 10 seconds and supports manual refresh.

The Users page shows the filtered user list and user details. The separate Users Analytics view and its activity-events route are no longer part of the admin UI.

Article details are arranged as full-width sections. Extracted content opens in a modal as plain text, and structured extraction, release, and security data is shown as labeled fields rather than JSON. Tags, scores, material/complexity, and digest flags are grouped under Analysis attributes.

The Dashboard separates account totals from DAU/WAU/MAU, then shows sources, source candidates, source types (Web, Feeds, GitHub Releases), and articles received in the selected period. Metric cards link to filtered lists and provide short hover descriptions. Digest delivery and backend application status follow the content overview.

The sidebar order is Dashboard, Users, Taxonomy, Sources, Articles, Digests, Jobs, Info pages, Administrators. Source-type metrics use compact, three-column label-and-count cards.

Information pages use Editor.js 2.x OutputData JSON. The admin editor supports heading and paragraph blocks, bold/italic text, and inline links; Editor.js modules load only in the browser. Info-page filter values remain selected from URL query parameters and list state is retained when opening/editing a row. This UI expects the coordinated backend migration/API contract to return and accept `fullText` as a JSON object, not a JSON-encoded string; deploy the backend contract change before using the editor against production.

Successful administrative actions appear as dismissible, auto-expiring toasts. Rows in record lists navigate to their detail views by pointer or keyboard; embedded links and controls retain their own actions. Sources combine type and Web extraction method in one column, keep the Added and Last successful fetch dates adjacent, and expose status actions in the detail header.

The current Angular build is client-rendered because administrator authentication is browser-local. The unused SSR route configuration also selects client rendering, so authenticated data is not transferred through a shared server-render cache if a server build is enabled later. The production Docker image serves the CSR bundle through Nginx.

## Deployment

Pull requests run unit tests, ESLint, Prettier, the Playwright TypeScript check, and a production build. Start the production workflow in `.github/workflows/deploy-prod.yml` manually from GitHub Actions. It repeats those checks, publishes `prod` and commit-SHA Docker image tags to Docker Hub, then invokes the Dokploy deployment webhook.

Required GitHub repository secrets:

| Secret                | Purpose                                                                  |
| --------------------- | ------------------------------------------------------------------------ |
| `DOCKERHUB_USERNAME`  | Docker Hub account used to publish the image.                            |
| `DOCKERHUB_TOKEN`     | Docker Hub access token with permission to push the image.               |
| `DOCKERHUB_IMAGE`     | Full Docker Hub image name, for example `personaltechradar/ptr-admin`.   |
| `DOKPLOY_WEBHOOK_URL` | Private Dokploy deployment webhook invoked after the image is published. |

Set `PTR_ADMIN_API_BASE_URL` in the Dokploy application environment to the browser-reachable administrator API origin (for example, `https://api.example.com`, without credentials or a trailing slash). The container writes this public value to `runtime-config.js` at startup; the file is served with `Cache-Control: no-store` so a redeployed API origin is not held in browser cache. The value is configuration, not a secret. Administrator credentials are entered at runtime.

## Infrastructure

`Dockerfile` builds the Angular bundle in Node 22 and serves it from the official Nginx stable Alpine image. `.dockerignore` keeps source-control metadata, local dependencies, reports, and backend reference files out of the build context. `deploy/nginx` provides security headers, immutable asset caching, runtime-config cache protection, compression, health checking, and SPA fallback. `deploy/logrotate` and `deploy/fail2ban` contain host-side examples; they are not daemons installed in the static web container.

## API behavior and limitations

The implementation was checked against the running `http://localhost:3300/docs-json` contract and backend admin API notes. Queues expose live state snapshots; pending cancellation is limited to waiting, delayed, paused, and prioritized jobs. Taxonomy creation uses the backend’s discovery flow; stream keys remain immutable. Source Web processing recipes are read-only. Administrator previews use a selected user’s profile but are delivered to the authenticated administrator, never to the selected user.

The backend has no administrator `GET /technology-interests/:id`, so a taxonomy deep link searches the paginated list until it finds the requested ID. Source validation has no independent historical attempt table, so the detail shows its latest validation and retained ingestion attempts. Older stored digest templates may lack extractable article short descriptions; those are labeled unavailable. Administrators support list and create, but not deletion, roles, reset-password-for-others, or audit logs.

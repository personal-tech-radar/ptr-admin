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
```

## Configuration

The browser loads `public/runtime-config.js` before Angular starts. Set `globalThis.__PTR_ADMIN_CONFIG__.apiBaseUrl` to the administrator API origin for each environment. The default is `http://localhost:3300`; the file is public configuration and must not contain credentials or tokens.

Administrator access is separate from normal-user authentication. The SPA keeps only the administrator access token in `localStorage` under `ptr-admin-token`, attaches it only to `/admin/*` requests, and clears it on a 401.

## Routes

`/login`, `/dashboard`, `/articles`, `/sources` (including Candidates), `/taxonomy`, `/coverage`, `/users`, `/digests`, `/jobs`, and `/admins` are direct Angular routes. Protected routes use the administrator auth guard.

## Deployment

The workflow in `.github/workflows/deploy.yml` builds and pushes the Docker image, deploys it over SSH, and checks `/nginx-health`. The image serves the CSR Angular bundle with Nginx; `/` falls back to `index.html`, so direct navigation/bookmarks such as `/articles` work correctly. Runtime API configuration can be supplied by replacing `runtime-config.js` in the served public directory during deployment.

Required GitHub repository secrets:

| Secret              | Purpose                                                         |
| ------------------- | --------------------------------------------------------------- |
| `REGISTRY_HOST`     | Container registry hostname for `docker login`.                 |
| `REGISTRY_USERNAME` | Registry login username.                                        |
| `REGISTRY_PASSWORD` | Registry password or token.                                     |
| `REGISTRY_IMAGE`    | Full image name, including registry/namespace, without the tag. |
| `DEPLOY_HOST`       | SSH hostname or IP of the deployment host.                      |
| `DEPLOY_USER`       | SSH user allowed to run Docker.                                 |
| `DEPLOY_SSH_KEY`    | Private SSH key used by the deployment action.                  |

The current workflow does not require an API secret: the admin API URL is public browser configuration, while administrator credentials are entered at runtime. Update `runtime-config.js` on the deployment host/image for a non-local backend URL.

## Infrastructure

`Dockerfile` builds the Angular bundle in Node 22 and serves it from Nginx. `deploy/nginx` provides security headers, immutable asset caching, compression, health checking, and SPA fallback. `deploy/logrotate` rotates Nginx logs. `deploy/fail2ban` contains the equivalent PTR Docker action and an Nginx abuse jail; enable it on the host with the host's Fail2ban service and log mount.

## Verified backend gaps

The live `http://localhost:3300/docs-json` contract was inspected programmatically. The following are not fabricated in the UI:

- Jobs currently expose `GET /admin/jobs/failed` and `DELETE /admin/jobs/{queue}/{jobId}` only. Current waiting/active/delayed/paused/completed queue listing and counts are unavailable, so Dashboard and Jobs describe/show failed-job capability only.
- Technology/Interest supports list, patch, merge, and source discovery, but no administrator create endpoint exists. There is no fake Add taxonomy mutation.
- Administrators support list and create only. No edit, disable, delete, or reset-password-for-another-admin endpoints are exposed.
- The admin source contract supports direct `POST /admin/sources`; no separate administrator source-candidate submission endpoint was present. Candidate list/detail/retry are implemented from their dedicated admin endpoints.

The API also exposes additional read-only audit resources (`article-feedback`, saved articles, opens, user taxonomy/streams, source preferences) that are typed in the API layer for follow-up detail tabs; the first pass keeps the main operational tables intentionally compact.

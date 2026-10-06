---
name: verify-frontend-runtime
description: Verify changed Angular admin behavior with proportionate tests, Playwright browser investigation for substantial frontend changes, production SSR checks, hydration awareness, and clear evidence.
---

# Verify frontend runtime

Use the smallest relevant verification set, then record commands and outcomes in the ignored iteration report.

1. Run focused tests for changed behavior, then the applicable project scripts: `npm run test`, `npm run lint`, `npm run format:check`, and `npm run build`.
2. For routing, SSR, provider, or browser-bound changes, start the built server with `node dist/ptr-admin/server/server.mjs` when practical and directly request affected routes. Check server logs and returned HTML for failures or missing primary content.
3. For substantial visible, interaction, route, authentication-flow, or SSR-sensitive work, use `@playwright/test` against the running admin and backend. Directly load changed routes and inspect browser-console errors, failed same-origin requests, hydration symptoms, and representative narrow and wide viewports. Run `npx playwright install chromium` first when the browser is absent.
4. Add focused deterministic end-to-end assertions for changed flows when they protect meaningful behavior. Do not add broad visual snapshots, mock the entire application, or treat exploratory browser inspection as a passing test suite.
5. For authenticated routes, test both anonymous and authenticated states without placing credentials, user data, or authorization-dependent responses in transfer caches or reports.

Report commands, routes or states checked, viewport coverage, actual outcomes, failures, and unverified risks. Do not hide console, network, SSR, or hydration failures.

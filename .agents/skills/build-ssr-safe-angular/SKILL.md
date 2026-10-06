---
name: build-ssr-safe-angular
description: Implement or review Angular code that runs during server rendering or hydration, including browser APIs, HTTP data loading, render modes, transfer cache, metadata, and the Express SSR host. Use whenever behavior can execute on both Node and the browser or when hydration differs. Do not use for purely static styles.
---

# Build SSR-Safe Angular

Design shared rendering code to produce stable equivalent server and client output.

## Browser boundaries

- Do not read browser globals, storage, observers, media queries, or layout during shared initialization.
- Prefer injected platform abstractions or a browser-only service with one guarded boundary.
- Run browser-only side effects after render when appropriate and clean them up with `DestroyRef`.
- Do not hide broad logic behind repeated `isPlatformBrowser` checks.
- Do not initialize authenticated state from browser storage during shared rendering. An anonymous server render must not imply an authenticated client session.

## Stable rendering

- Do not render initial values derived from current time, randomness, implicit locale, viewport size, or mutable globals.
- Keep valid HTML structure and stable list tracking to avoid hydration mismatches.
- Keep constructors and field initializers side-effect free.
- Ensure server failures produce intentional error or fallback UI, not silent empty markup.

## Data and caching

- Use `HttpClient` with fetch through the application provider.
- Avoid duplicate server and browser requests by using Angular transfer cache deliberately.
- Never transfer-cache credentials, authorization-dependent responses, or private user data without an explicit safe design.
- Map transport DTOs before they reach domain and UI code when contracts differ.
- Keep authorization-dependent admin responses out of shared transfer caches.

## Render modes and host

- Use server rendering for dynamic routes by default.
- Use prerendering only when route parameters and build-time data are bounded and available.
- Add client-only rendering only for a documented incompatibility.
- Keep frontend-host endpoints in `src/server.ts` minimal, validated, and free of secrets exposed to the browser.
- Read `app.config.ts`, `app.config.server.ts`, `app.routes.server.ts`, and `src/server.ts` before changing routes, providers, data loading, or host behavior.

## Verification

- Run focused tests and a production build.
- Start the generated SSR server and request affected routes when practical.
- Inspect server HTML for content and check logs for runtime or hydration warnings.

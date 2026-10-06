# Codex Project Instructions

This repository contains the Angular SSR frontend for Personal Tech Radar. These instructions govern Codex. Do not load instructions from sibling repositories unless the user explicitly requests comparison work.

## Language and context

- Communicate with the user in English. Write plans, reports, documentation, comments, commits, issues, and pull requests in English.
- Inspect `.local-context/` before planning or resuming work when present. Treat `current-task.md` as current and `decisions.md` or `archive/` as historical.
- When present, also review `.local-context/CHANGELOG.md` as short-lived cross-session memory. For substantive work, append a concise completion, verification, and risk note; never record secrets or treat it as architectural truth.
- The current request and repository state override local notes. Preserve unrelated user changes.

## Technical baseline

- Use Angular 21, standalone APIs, strict TypeScript and templates, signals, SSR, hydration, SCSS, and Vitest.
- Do not add a UI component library or CSS framework unless the user explicitly approves it.
- Prefer Angular-native and web-platform APIs before dependencies.
- Treat hydration warnings and server/client output divergence as defects.
- Keep routes lazy at feature boundaries unless eager loading has a measured benefit.

## Architecture

- Organize product code under `src/app/core`, `src/app/features`, and `src/app/shared`.
- Keep singleton infrastructure, tokens, guards, interceptors, and application-wide services in `core`.
- Keep reusable presentational components, directives, pipes, and styles in `shared`.
- Organize substantial features into `domain`, `data`, and `ui` only when those boundaries carry real responsibilities; never create empty layers.
- Keep domain code independent of components, browser globals, transport DTOs, and generated clients.
- Keep API mapping and transport details in `data`; keep components focused on rendering and interaction.
- Prefer local component state. Add a feature state service only for state shared across components or routes.
- Before adding UI, audit `src/app/shared`, the target feature, and the closest analogous feature. Reuse an existing component or add a small semantic, backwards-compatible variant before creating a duplicate.
- Keep direct HTTP access and transport mapping out of components and templates. The existing `core/api` service is the current boundary; introduce feature `data` and `domain` layers only when their responsibilities are real.

## Angular implementation

- Generate standalone components with external HTML and SCSS files.
- Prefer `input()`, `output()`, `model()`, `signal()`, and `computed()` for new code.
- Use `inject()` consistently and keep dependencies private unless templates or subclasses need them.
- Use built-in control flow and stable tracking expressions for repeated data.
- Prefer `ChangeDetectionStrategy.OnPush` for non-root components.
- Use `takeUntilDestroyed()` for imperative subscriptions. Prefer async pipe or signal interop when ownership stays clear.
- Do not call methods with non-trivial work from templates.
- Use semantic, keyboard-operable HTML. Prefer native elements before ARIA.
- Follow the local naming, selector, import-order, and signal conventions of the closest analogue; do not introduce a new state or HTTP library.

## SSR and browser boundaries

- Never access `window`, `document`, `navigator`, storage, observers, or layout APIs during shared initialization without a platform-safe boundary.
- Prefer injected browser-only services over scattered platform checks.
- Avoid server/client divergence from time, randomness, locale defaults, or mutable global state.
- Use transfer cache intentionally and never leak user-specific or authenticated data through shared caches.
- Keep authenticated administration data out of shared transfer caches and do not server-render a browser-stored session as if it were authenticated.
- Define render modes deliberately in `app.routes.server.ts`; default dynamic routes to server rendering until prerender parameters are known.
- Put custom Express behavior in `src/server.ts` only when it belongs to the frontend SSR host.

## Styling and components

- Build project-specific components with semantic HTML and scoped SCSS; do not imitate a library abstraction prematurely.
- Use CSS custom properties for repeated color, spacing, typography, radius, and elevation values.
- Design mobile-first and verify keyboard focus, reduced motion, zoom, long content, loading, empty, and error states.
- Never use clickable `div` or `span` elements, positive `tabindex`, or ARIA that duplicates native semantics.

## Scope and maintenance

- Do not add dependencies without explicit approval.
- Do not change deployment, production endpoints, analytics, authentication, or environment secrets unless explicitly requested.
- Add public environment values through typed configuration; never place secrets in browser bundles.
- Update `README.md` for setup, commands, architecture, or user-visible behavior changes.
- Prefer concise comments that explain intent, not syntax.

## Workflow and verification

- For informational tasks, answer without changing files.
- For changes, inspect relevant code, plan non-trivial work, implement the smallest coherent solution, and review the final diff once.
- Run the narrowest checks first: targeted tests, `npm run lint`, `npm run format:check`, then `npm run build` for runtime or SSR changes.
- The project provides `npm run test` for the non-watch Angular test run and `@playwright/test` for browser-based investigation. For substantial visible, interaction, route, authentication-flow, or SSR-sensitive changes, use Playwright against the running admin and backend to inspect direct navigation, browser-console errors, failed same-origin requests, responsive layouts, and the affected user flow. Add deterministic end-to-end assertions when they meaningfully protect changed behavior; do not create broad snapshots by default.
- Install the Chromium browser with `npx playwright install chromium` when it is absent and browser validation is required. Do not add a generated-API command without approval.
- For SSR-sensitive changes, build and smoke-test the production server output when practical.
- Review accessibility, hydration safety, API contracts, bundle impact, documentation, and accidental scope.
- Never change application behavior merely to silence an unrelated check.

## Delivery

- Before completing an implementation iteration, update an ignored Markdown report under `reports/` with completed and incomplete work, exact verification results, problems, unresolved risks, and final worktree status.
- Never stage or commit reports. Stage only intended files.
- Never force-push, bypass hooks, amend shared history, merge a pull request, or restore the starting branch unless explicitly requested.

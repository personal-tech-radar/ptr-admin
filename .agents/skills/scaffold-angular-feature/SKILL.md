---
name: scaffold-angular-feature
description: Create or substantially extend a product feature in this Angular 21 SSR application using standalone routes and components with appropriate domain, data, and UI boundaries. Use for new route-level features or multi-component feature slices. Do not use for a small edit to an existing component.
---

# Scaffold an Angular Feature

Inspect the closest feature and create only layers with real responsibilities.

Audit `src/app/shared`, the target feature, and similar routes before creating a component or service. Reuse first, or add a small semantic backwards-compatible variant.

## Structure

Place the feature under `src/app/features/<feature>/`:

```text
domain/  framework-independent models, contracts, and rules
data/    HTTP access, generated-client adapters, and DTO mapping
ui/      pages, components, feature state, directives, and pipes
```

Omit empty layers. Keep application-wide infrastructure in `core` and genuinely reusable presentation in `shared`.

## Route and page

- Add a lazy `loadComponent` or lazy child route at the feature boundary.
- Keep page components focused on orchestration and layout.
- Add a deliberate entry to `app.routes.server.ts` when render behavior differs from the default.
- Set a route title or update metadata through an SSR-compatible service.

## Domain and data

- Keep domain models independent from Angular components and transport DTOs.
- Put HTTP calls and DTO-to-domain mapping in `data`.
- Keep using the established `core/api` boundary where it remains the appropriate scope; do not create a parallel client merely to satisfy this layout.
- Provide services at root only when their lifecycle is application-wide; otherwise scope them to a route or feature.
- Keep authenticated or user-specific requests out of shared SSR transfer caches.

## UI and state

- Use standalone, OnPush components with external HTML and SCSS.
- Prefer signal inputs, outputs, computed state, and local state.
- Add feature state only when multiple components or routes share asynchronous state.
- Render explicit loading, empty, error, and success states where applicable.
- Use semantic HTML and retain visible keyboard focus.

## Completion

- Add focused Vitest tests for project behavior.
- Run targeted tests, lint, format check, and an SSR build when routing or runtime behavior changes.
- Update `README.md` when architecture, setup, or public behavior changes.
- For substantive work, append completion, verification, and risks to `.local-context/CHANGELOG.md` when it exists, and update the ignored iteration report.

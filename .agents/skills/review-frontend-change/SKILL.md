---
name: review-frontend-change
description: Review an Angular frontend diff for concrete defects in architecture, standalone component design, accessibility, SSR and hydration safety, routing, API contracts, state, performance, tests, dependencies, documentation, and scope. Use after regular or substantial frontend changes or when explicitly asked for code review. Do not use for prose-only review.
---

# Review a Frontend Change

Inspect the actual diff and relevant neighboring code. Report defects, not style preferences.

## Architecture and contracts

- Check `core`, `features`, and `shared` ownership and flag empty or artificial layers.
- Check that raw HTTP access and transport mapping do not leak into templates or presentational components, while preserving the established `core/api` boundary.
- Keep transport DTOs and API mapping out of domain and presentation code.
- Check component inputs, outputs, route params, public types, and API assumptions for unintended breaking changes.
- Flag global state or root providers whose lifetime should be local.

## Angular and SSR

- Check standalone imports, OnPush compatibility, signal ownership, stable list tracking, and subscription cleanup.
- Flag browser globals or side effects reachable during server rendering.
- Check time, randomness, locale, viewport, and cache behavior for server/client divergence.
- Verify render modes, metadata, error behavior, and private-data transfer-cache safety.

## UI quality

- Check native semantics, keyboard interaction, focus management, labels, names, status announcements, contrast assumptions, reduced motion, zoom, and responsive overflow.
- Flag clickable non-interactive elements and unnecessary or incorrect ARIA.
- Check loading, empty, error, disabled, and long-content states when relevant.

## Maintenance and verification

- Flag unapproved dependencies, UI libraries, or CSS frameworks.
- Check focused tests for changed behavior and an SSR build for runtime-sensitive changes. For substantial visible, interaction, route, authentication-flow, or SSR work, check Playwright evidence for direct navigation, console/network failures, and narrow/wide viewport behavior; distinguish absent browser verification from a confirmed defect.
- Check README and configuration updates when setup or architecture changes.
- Check the ignored iteration report and `.local-context/CHANGELOG.md` when present for exact verification and residual risks, without treating either as source of truth.
- Compare implementation with approved scope and preserve unrelated work.

## Output

List findings by severity with file and line references. Explain impact and the smallest correction. If there are no findings, say so directly. Confirm the ignored iteration report contains exact verification and final worktree status and is not staged.

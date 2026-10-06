---
name: build-accessible-component
description: Create or modify a custom Angular component, page interaction, form control, modal, menu, navigation element, or reusable UI primitive without a component library. Use when component semantics, inputs and outputs, keyboard behavior, focus, responsive styling, or accessibility states matter. Do not use for non-UI services.
---

# Build an Accessible Component

Start from the native element and interaction model closest to the requirement.

Before adding UI, inspect `src/app/shared`, the target feature, and an analogous screen. Prefer reuse or a small semantic backwards-compatible variant over a duplicate component.

## Contract

- Give the component one clear responsibility.
- Prefer signal `input()`, `output()`, and `model()` APIs with explicit types.
- Keep required inputs required; avoid sentinel empty values for required data.
- Emit user intent, not raw DOM events.
- Keep internal state local unless a parent or route must own it.

## Markup and behavior

- Use buttons for actions and anchors for navigation.
- Associate every form control with a visible label and accessible error or hint text.
- Preserve native keyboard behavior. Add keyboard handling only for established composite-widget patterns.
- Manage focus for overlays, dialogs, and route-level error recovery; restore focus after dismissal.
- Use ARIA only to fill a semantic gap and keep state attributes synchronized.
- Announce important asynchronous status changes without making routine updates noisy.

## Angular and styling

- Use a standalone OnPush component with external template and SCSS.
- Keep raw API calls and transport mapping outside the component; use the established core or feature data boundary.
- Use built-in template control flow and stable `track` expressions.
- Use CSS custom-property tokens and component-scoped styles.
- Support narrow screens, 200% zoom, long translations, visible focus, reduced motion, and disabled/loading/error states.
- Avoid encoding meaning through color alone.

## Verification

- Test public behavior and accessible state rather than private methods.
- Exercise keyboard navigation and focus manually for interactive widgets.
- Run template linting and check server rendering when the component appears in an SSR route.
- For substantive work, record the exact verification and residual risks in the ignored iteration report and local changelog when present.

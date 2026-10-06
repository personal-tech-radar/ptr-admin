---
name: angular-component-pattern
description: Create or extend Angular components, directives, and pipes using this admin application's standalone, signal-first, SCSS, and SSR-safe conventions.
---

# Angular component pattern

Use the closest analogous implementation as the final authority.

- Components are standalone and use the repository's configured external HTML and SCSS files. Keep `ChangeDetectionStrategy.OnPush` unless an analogous component has a concrete reason not to use it.
- Prefer `inject()` fields, `input()` / `input.required()` inputs, `output()` outputs, and `computed()` derived state. Keep state local unless it is genuinely shared across components or routes.
- Use built-in control flow, stable `track` expressions, and public or protected members only when the template needs them. Imperative subscriptions use `takeUntilDestroyed()`.
- Audit `shared`, the target feature, and analogous pages before creating a component. Prefer a small semantic API over cosmetic boolean-flag combinations.
- Keep components free of raw `HttpClient` calls and transport mapping. Use the established core or feature data boundary.
- Keep browser primitives SSR-safe: inject platform abstractions where available and guard browser-only work. Do not derive initial rendered state from storage, time, randomness, viewport, or mutable globals.
- Use semantic native controls, component-scoped SCSS, shared CSS custom-property tokens, visible focus, and responsive layouts that tolerate zoom, long content, reduced motion, and loading or error states.

Follow the neighboring component's formatting, selectors, and naming rather than importing conventions from another project.

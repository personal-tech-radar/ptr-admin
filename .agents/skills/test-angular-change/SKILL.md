---
name: test-angular-change
description: Add or review focused Vitest tests for Angular 21 standalone components, services, pipes, guards, interceptors, signals, routing, HTTP mapping, and SSR-sensitive behavior. Use when frontend behavior changes or a regression needs coverage. Do not use to test Angular framework guarantees or CSS appearance.
---

# Test an Angular Change

Write the smallest readable set of tests that proves distinct project behavior.

## Boundaries

- Test public behavior, rendered output, emitted intent, and observable state transitions.
- Do not test private methods, Angular internals, decorators, or static implementation details.
- Prefer real lightweight collaborators; mock HTTP, time, storage, or expensive boundaries only when required.
- Use accessible queries or semantic DOM selectors where possible.
- Keep specs beside the implementation.

## Components

- Configure standalone components through `imports`.
- Cover meaningful inputs, outputs, user interaction, conditional states, and accessibility state.
- Call `detectChanges()` deliberately and await async stabilization when behavior requires it.
- Do not snapshot large templates or assert class names unless the class is behavioral.

## Services and transport

- Cover mapping, error handling, cancellation, and distinct state transitions.
- For HTTP code, assert method, URL, relevant payload, and response mapping without testing `HttpClient` itself.
- For signals, assert externally visible computed behavior rather than internal storage.

## SSR-sensitive code

- Cover the server path without browser globals and the browser-only path when both contain project logic.
- Assert deterministic initial output for hydration-sensitive values.
- Use a production SSR smoke test for route or provider wiring that unit tests cannot prove.

## Completion

- Run the narrow test command first, then `npm run test` when scope justifies it.
- Record exact results and any untested risks in the ignored iteration report.

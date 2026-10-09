# Portal frontend task: render Editor.js info-page blocks

Work in `/Users/miter/WebstormProjects/PTR/ptr-frontend`.

First inspect the worktree and current branch. Fetch `origin`, verify `origin/main`, update local `main` with a fast-forward only, then create a feature branch such as `dev/info-pages-editorjs-portal` from that updated `main`. Do not discard, stash, or overwrite pre-existing work; stop and report if the worktree is not clean or the branch cannot be safely created. Do not load sibling repository instructions except where this task explicitly requires the backend/admin contract below; follow the portal repo's own instructions.

## Shared contract

The backend is being changed to return `fullText` as a JSON object in PostgreSQL/API, not as an arbitrary HTML string or a JSON string. Match the Editor.js 2.x OutputData shape exactly:

```json
{
  "time": 1700000000000,
  "blocks": [
    {
      "id": "optional-block-id",
      "type": "header",
      "data": { "text": "Section title", "level": 2 }
    },
    {
      "id": "optional-block-id",
      "type": "paragraph",
      "data": { "text": "Text with an optional inline <a href=\"https://example.com\">link</a>." }
    }
  ],
  "version": "2.x"
}
```

Supported blocks are `header` and `paragraph`; the page title is H1, so content headings render as H2–H6. Inline formatting and links can be HTML markup inside `data.text`; allow only safe `https`, `http`, and `mailto` links. Admin Editor.js, backend validation/storage, and this renderer must agree on this exact shape.

## Required work

- Inspect the existing info-page API model, resolver, route, component, template, styles, and tests. Verify the backend branch/schema when available; do not invent another block dialect or parse the new object as a string.
- Update the public API types and route data to carry a typed Editor.js document object. Remove `JSON.parse(fullText)` and the raw-string fallback. Render supported block types in semantic order: `header` to its requested heading level (2–6) and `paragraph` to paragraph markup.
- Render inline formatting/links through Angular's normal HTML sanitizer (for example, `[innerHTML]` on the text field). Never use `bypassSecurityTrustHtml`, direct unsanitized DOM insertion, or trust arbitrary tags/attributes/protocols. Apply sensible link behavior (`rel="noopener noreferrer"` for links opened in a new tab) if opening externally.
- Handle empty/malformed/unrecognized content with an intentional safe fallback or visible error state; do not render raw JSON or unknown HTML. Keep rendering SSR/hydration safe and preserve the existing page title, last-updated display, SEO metadata, navigation, and public visibility behavior.
- Add focused tests for headers, paragraphs, inline links and formatting, unsafe link/tag sanitization, empty documents, unsupported blocks, and the actual API object shape.

## Verification and safety

Run the portal repository's format, lint, unit, production build, SSR smoke tests, and proportionate Playwright flows for the legal/privacy/cookie pages at desktop and narrow viewport sizes. Report exact results and any backend dependency/contract mismatch. Preserve unrelated changes. Do not commit, push, create or merge a PR unless separately requested.

At completion, report the feature branch, files/routes changed, block compatibility, tests, and coordinated deployment order with the backend migration and admin editor.

# Backend task: standardize info-page content on Editor.js JSON blocks

Work in `/Users/miter/WebstormProjects/PTR/ptr-backend`.

First inspect the worktree and current branch. Fetch `origin`, verify `origin/main`, update local `main` with a fast-forward only, then create a feature branch such as `dev/info-pages-editorjs-backend` from that updated `main`. Do not discard, stash, or overwrite pre-existing work; stop and report if the worktree is not clean or the branch cannot be safely created. Keep this task scoped to info-page storage and API behavior.

## Goal

Replace the current string-encoded custom info-page document with one shared Editor.js OutputData JSON object across persistence and the admin/public APIs. The portal frontend and admin frontend will be updated to this contract independently, so keep the contract explicit and document it.

Use the Editor.js 2.x block format:

```json
{
  "time": 1700000000000,
  "blocks": [
    {
      "id": "stable-or-generated-id",
      "type": "header",
      "data": { "text": "Section title", "level": 2 }
    },
    {
      "id": "stable-or-generated-id",
      "type": "paragraph",
      "data": { "text": "Text with an optional inline <a href=\"https://example.com\">link</a>." }
    }
  ],
  "version": "2.x"
}
```

The supported block allowlist for this first iteration is `header` and `paragraph`; headings use levels 2–6 because the page title is the H1. Inline formatting and links are represented by Editor.js markup inside `data.text`. Link URLs must be restricted to safe `https`, `http`, and `mailto` protocols; reject or sanitize unsafe markup/attributes. Treat browser rendering sanitization as an additional defense, not the only validation boundary. Preserve optional Editor.js block IDs, timestamps, and version without depending on their exact values.

## Required work

- Inspect every info-page controller, DTO, service, entity, migration/seed, and test before editing; inventory real stored content if a local database is available without printing secrets or mutating user data.
- Change `fullText` persistence to PostgreSQL `jsonb` and expose it as a JSON object in both public and administrator API responses. Create/update request DTOs accept and validate the object rather than a string passed through `@IsJSON`.
- Add a forward migration that safely converts the existing text column. Parse existing serialized documents; map legacy `{type: "heading", data: {text, level}}` blocks to Editor.js `{type: "header", ...}` and keep paragraph blocks. Wrap legacy plain text as one paragraph. Preserve text and valid inline links; define a safe handling path for malformed or unknown legacy data and cover it with migration tests. Provide a rollback that preserves recoverable content.
- Keep public list/detail and admin list/detail privacy behavior unchanged: only active pages are public; public list omits content; public detail returns it; admin list stays paginated and omits content; admin detail returns it; deletes remain soft deletes.
- Validate required page title, document shape, supported block types, non-empty structural requirements, heading levels, text types, and link safety. Do not silently discard valid content on update.
- Update generated Swagger/OpenAPI schemas, API docs, and info-page domain README with the object contract and migration behavior. Do not hand-edit generated artifacts unless that is the repository convention.
- Add unit and HTTP/migration coverage for create/read/update round trips, active/public visibility, legacy conversion, malformed content, supported blocks, and unsafe links.

## Verification and safety

Run the repository-prescribed format, lint, type-check, unit tests, migration checks, e2e/API tests, and build. Record exact results and any environment limitations. Do not reset databases or run migrations against production. Never log credentials or user content. Preserve unrelated changes. Do not commit, push, create or merge a PR unless separately requested.

At completion, report the feature branch, changed API schema, migration details, tests, and any compatibility/deployment ordering requirement for the admin and portal frontend branches.

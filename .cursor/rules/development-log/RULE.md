---
description: "Standardize the format of development_log.md entries (date sections, timestamps, titles, and ordering)"
globs: "development_log.md"
alwaysApply: false
---

# Development Log Format

This rule ensures all new entries in `development_log.md` are consistent, readable, and easy to scan.

## Required structure

- The file starts with `# Development Log`.
- Group entries by day using `## YYYY-MM-DD` headings.
- Within each day, add entries as Markdown bullets, newest first.
- Keep days ordered newest first.

## Entry format (mandatory)

Each entry must be a single bullet in this format:

```md
- `YYYYMMDDTHHMMZ` — **Short title**: Clear 1–2 sentence description.
```

### Formatting rules

- Timestamp:
  - Must be UTC in the format `YYYYMMDDTHHMMZ` (e.g., `20260107T1343Z`).
  - Generate with: `date -u +"%Y%m%dT%H%MZ"`.
- Separator:
  - Use an em dash `—` (not `->`, not `-`, not `:`).
- Title:
  - Wrapped in `**...**`.
  - Use a short, imperative phrase (e.g., “Fix URL validation”, “Add env.example”).
  - No trailing period inside the title.
- Description:
  - Starts after `: ` and ends with a period.
  - Prefer concrete details (what changed and where).
  - Wrap file paths, identifiers, and commands in backticks.
  - Never include sensitive values (secrets, tokens, keys).

## Examples

```md
## 2026-01-07
- `20260107T1330Z` — **Add env.example and improve README quick start**: Added `env.example` and reorganized `README.md` quick start steps for clarity.
- `20260107T1320Z` — **Align and rename PRD document**: Renamed `docs/prd.md` to `docs/PRD.md` and updated related documentation links.
```

## Common mistakes (avoid)

```md
20260107T1330Z: [something] -> did a thing
```

```md
- 20260107T1330Z - Add env: did stuff
```

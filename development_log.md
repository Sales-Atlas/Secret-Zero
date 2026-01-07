# Development Log

## 2026-01-07

- `20260107T1440Z` — **Consolidate duplicate CLAUDE.md files**: Removed duplicate root `CLAUDE.md` and merged unique content (Integration Tests section) into `.claude/CLAUDE.md`. Project now has a single source of truth for Claude Code guidance in the canonical `.claude/CLAUDE.md` location.
- `20260107T1356Z` — **Fix MD034 in README**: Wrapped bare URL `https://zawlodzki.pl` in angle brackets to satisfy markdownlint MD034.
- `20260107T1343Z` — **Add Cursor rule for development log format**: Added `.cursor/rules/development-log/RULE.md` to keep future `development_log.md` entries consistent.
- `20260107T1337Z` — **Translate and standardize development log**: Translated `development_log.md` to English and standardized Markdown formatting (date headings + bullet entries) for readability.
- `20260107T1334Z` — **Add README license footer**: Added a `License` section to `README.md` referencing `LICENSE`, Grzegorz Zawłodzki, and `https://zawlodzki.pl`.
- `20260107T1330Z` — **Add env.example and improve README quick start**: Added `env.example` as a safe local environment template (Stytch, Infisical, RSA keys, optional webhooks/tests) and reorganized `README.md` to improve readability with clearer sections and local setup steps.
- `20260107T1320Z` — **Align and rename PRD document**: Verified the PRD against the current implementation and updated it to match the codebase (Stytch Discovery Flow, client-side AES-256-GCM + RSA-OAEP encryption, Infisical write-only secret creation with duplicate-key timestamp suffixing, Next.js log minimization + React Taint API). Renamed `docs/prd.md` to `docs/PRD.md` and updated documentation links accordingly.
- `20260107T1218Z` — **Normalize HTTP scheme case-insensitively**: Updated `normalizeHttpUrl` to convert any `http://` (any casing) to `https://` so HTTPS-only validation does not reject uppercase schemes.
- `20260107T1215Z` — **Tighten hostname label validation**: Added label checks to prevent leading/trailing hyphens and empty labels from consecutive dots.
- `20260107T1213Z` — **Enforce HTTPS-only validation**: `isValidHttpUrl` now only permits `https:` to align with normalization and prevent insecure URLs.
- `20260107T1211Z` — **Enforce HTTPS normalization**: `normalizeHttpUrl` now upgrades `http://` inputs to `https://` to avoid insecure URLs.
- `20260107T1209Z` — **Allow underscore in hostname validation**: Updated hostname regex to accept underscores for internal URLs like `app_staging.example.com`.
- `20260107T1208Z` — **Disallow single-label hostnames**: Removed `localhost` bypass in URL validation so only IPv4, bracketed IPv6, or dotted domains pass.
- `20260107T1207Z` — **Fix IPv6 URL validation**: Narrowed IPv6 hostname validation to require bracketed literals (e.g., `[::1]`) so non-IPv6 hostnames containing `:` no longer pass.
- `20260107T1204Z` — **Remove Stytch org setup script docs**: Removed the SDK script instructions from `docs/STYTCH_SETUP.md`, clarified dashboard-first organization configuration with API as optional, and updated troubleshooting language to avoid script references.
- `20260107T1202Z` — **Use root-relative doc links**: Updated links in `docs/STYTCH_SETUP.md`, `docs/INFISICAL_TESTING.md`, and `docs/SECURITY_TESTS.md` to use root-relative paths (e.g., `/lib/stytch.ts`) for portability across platforms.
- `20260107T1157Z` — **Sanitize client-side encryption error logging**: Updated `components/forms/secret-form.tsx` to log only the error message (no stack trace) using a guarded `Error` check, keeping logging minimal while avoiding exposure of internal details.
- `20260107T1145Z` — **Use validated env for public key in deposit page**: Replaced direct `process.env` access with `env.NEXT_PUBLIC_SERVER_PUBLIC_KEY` in `app/(portal)/deposit/[orgSlug]/page.tsx` so the page uses the Zod-validated environment configuration.
- `20260107T1134Z` — **Align auth layout styling with theme variables**: Updated Suspense fallback styles in `app/(auth)/layout.tsx` to use `bg-background` and primary-based borders instead of hardcoded slate/blue colors, matching the auth pages' CSS variable usage.
- `20260107T1020Z` — **Sanitize validation error logging in deposit action**: Removed Zod error object logging from `console.error()` in `actions/deposit.ts:95`. Previously logged `parseResult.error`, which can contain field paths, validation rules, and structural details. Changed to a generic log message (`Validation error`) matching the sanitization pattern applied to other error handlers in the same file (decryption, URL parsing, Infisical errors per `20260107T0820Z`). All error logging in the deposit action now follows a minimal-logging security principle.
- `20260107T1000Z` — **Fix poor UX for missing NEXT_PUBLIC_SERVER_PUBLIC_KEY**: Added server-side validation in `app/(portal)/deposit/[orgSlug]/page.tsx` to check for `NEXT_PUBLIC_SERVER_PUBLIC_KEY` before rendering `SecretForm`. If the environment variable is missing, users now see an explicit configuration error page with clear instructions instead of filling out the form and encountering `Data encryption error` on submit. Added `AlertCircle` icon import.
- `20260107T0851Z` — **Make success CTA use primary button style**: Changed the `Add more credentials` button in `components/forms/secret-form.tsx` to use the ShadCN `default` variant (theme `primary` color) instead of `secondary`.
- `20260107T0845Z` — **Accept URLs without https:// in deposit form**: Updated URL validation to accept inputs like `pipedrive.com` by normalizing to `https://`, and adjusted the URL input field to avoid browser URL-type validation blocking scheme-less entries.
- `20260107T0839Z` — **Remove ISCP from page title**: Updated `app/layout.tsx` metadata title from `Secure Secret Portal | ISCP` to `Secure Secret Portal`.
- `20260107T0825Z` — **Keep encryption errors generic in SecretForm**: Removed user-facing and console logging of runtime encryption error details in `components/forms/secret-form.tsx` to avoid leaking implementation details; users now always see a generic `Data encryption error`. Also removed an unused catch variable to satisfy ESLint.
- `20260107T0820Z` — **Sanitize deposit action error logs**: Removed raw error object logging from URL parsing and Infisical catch blocks in `actions/deposit.ts` to prevent sensitive data leakage.

## 2026-01-02
- `20260102T2115Z` — **Fix URL parser bug with 2-character domain names**: Fixed `extractAppNameFromUrl()` in `lib/url-parser.ts` where country-code TLD detection incorrectly stripped any 2-character domain segment (e.g., `ab` in `app.ab.io`). Replaced a naive length-based heuristic with an explicit list of known second-level country-code TLDs (`co`, `ac`, `gov`, `edu`, `org`, `net`, `mil`, `nom`, `sch`). The parser now only strips the second-level domain if it matches the known list and the TLD is 2 characters (indicating a country code).

## 2026-01-01
- `20260101T1200Z` — **Add MCP server config to .claude.json**: Added the `exa` MCP server to the `mcpServers` section in `.claude.json` (type `http`, url `https://mcp.exa.ai/mcp`).

## 2025-12-31
- `20251231T1215Z` — **Add directory-structure command**: Added a command named `directory-structure` using content from `.cursor/rules/cursor-rules/RULE.md` (original prompt truncated in the log). Updated documentation to reflect current codebase practices, including per-action session validation (not global middleware) and `tsx`-based integration tests (not Jest/Vitest).
- `20251231T1210Z` — **Create .env.local template for Secret-Zero**: Created `.env.local` containing all required environment variables (Stytch, Infisical, RSA keys) with example values and detailed configuration instructions.
- `20251231T1200Z` — **Translate PRD to English**: Translated the entire PRD document (~400 lines) from Polish to English while preserving Markdown formatting, tables, links, and technical terminology.

## 2025-12-30
- `20251230T1500Z` — **Verify missing PRD implementations and fill in**: Completed missing PRD elements: React Taint API (`lib/taint.ts`, `instrumentation.ts`, `taint: true`), admin notification webhook (`lib/webhook.ts`), duplicate secret handling (timestamp suffix), Stytch webhook handler (`api/webhooks/stytch/route.ts`), and `logging.incomingRequests: false`.
- `20251230T1400Z` — **Prepare implementation plan based on docs/PRD.md**: Implemented the full ISCP Portal: `lib/stytch.ts`, `lib/infisical.ts`, `lib/crypto.ts`, `lib/url-parser.ts`, `actions/auth.ts`, `actions/deposit.ts`, `schemas/deposit.ts`, `middleware.ts`, auth and portal pages, form components, `docs/STYTCH_SETUP.md`, `docs/INFISICAL_SETUP.md`, `docs/VERCEL_DEPLOYMENT.md`, `docs/SECURITY_TESTS.md`, `env.ts`, `next.config.ts`.

## 2025-12-29
- `20251229T1305Z` — **Detect npm usage in pnpm project**: Identified npm usage in a pnpm-based project and suggested `pnpm add @stytch/nextjs @stytch/vanilla-js`.
- `20251229T1223Z` — **Diagnose missing node_modules**: Diagnosed missing `node_modules` and suggested `pnpm install` and `pnpm dev`.
- `20251229T1215Z` — **Add English-only language policy rule**: Created `.cursor/rules/language-policy/RULE.md` to enforce English for all comments, code, and documentation even if agents communicate in Polish.
- `20251229T1210Z` — **Translate rules to English and enforce English**: Translated `.cursor/rules/cursor-rules/RULE.md` to English and added an English-only requirement for rules.
- `20251229T1205Z` — **Add rule content-writing guidelines**: Updated `.cursor/rules/cursor-rules/RULE.md` with guidelines from `cursor-rules.mdc` and the new specification.
- `20251229T1200Z` — **Migrate .cursor rules to Project Rules**: Migrated `.mdc` rules into Project Rules folders in `.cursor/rules/`.
- `20251229T1023Z` — **Restore self-improve rule file**: Restored the original contents of `.cursor/rules/self-improve/RULE.md` (reverted changes).
- `20251229T1022Z` — **Add rule-writing guidelines to self-improve**: Added rule-writing guidelines from `cursor-rules.mdc` to `.cursor/rules/self-improve/RULE.md`.
- `20251229T1012Z` — **Fetch Stytch B2B docs for Next.js**: Retrieved Stytch B2B documentation for Next.js and provided implementation examples for `StytchB2BProvider` and the `StytchB2B` component (Discovery Flow).

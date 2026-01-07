# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Secret-Zero** is an Inbound Secret Collection Portal (ISCP) - a secure B2B web application that enables consulting clients to safely deposit sensitive credentials (API tokens, passwords, SSH keys) directly into the consulting company's Infisical vault without transmitting them through insecure channels like email or Slack.

**Core Security Principle**: "Write-Only" architecture with client-side encryption. The application can only create secrets in Infisical, never read them. Secrets are encrypted in the browser before transmission to prevent log leakage on Vercel's serverless infrastructure.

## Development Commands

```bash
# Development
pnpm dev              # Start Next.js dev server on localhost:3000

# Production
pnpm build            # Build for production
pnpm start            # Start production server

# Code Quality
pnpm lint             # Run ESLint (Next.js config with React 19 & TypeScript rules)

# Integration Tests
pnpm test:infisical   # Test Infisical SDK integration
pnpm test:stytch      # Test Stytch authentication flow
```

## Architecture & Data Flow

### High-Level Flow
1. **Client Browser**: User fills form → Hybrid encryption (AES-256-GCM + RSA-OAEP)
2. **Next.js (Vercel)**: Receives encrypted payload → Validates Stytch session → Decrypts in RAM (ephemeral)
3. **Infisical SDK**: Authenticates with Machine Identity (Universal Auth) → Creates secrets in write-only vault
4. **Data never persists in plain text on Vercel** - protected against log leaks

### Key Components

**Authentication Layer** (Stytch B2B):
- Discovery Flow for multi-organization support
- Session management with JWT verification in middleware
- JIT Provisioning for SSO users
- Account enumeration protection (opaque errors)

**Encryption Layer** (`lib/crypto.ts`):
- Browser: Generates one-time AES session key, encrypts payload, wraps key with server's RSA public key
- Server: Decrypts with private key (stored in env vars), processes in RAM, immediately discards
- React Taint API prevents accidental secret exposure to client components

**Secret Management** (`lib/infisical.ts`):
- Machine Identity with Universal Auth (replaces deprecated Service Tokens)
- Write-only RBAC role: `CREATE` allowed, `READ/UPDATE/DELETE` denied
- Folder structure: `/{environment}/{stytch_org_slug}/`
- Secret naming: `{APPNAME}_URL`, `{APPNAME}_LOGIN`, `{APPNAME}_PASSWORD`, `{APPNAME}_API_TOKEN`

**Route Structure**:
- `app/(auth)/*` - Public authentication routes (login, authenticate)
- `app/(portal)/*` - Protected routes requiring Stytch session (dashboard, deposit)
- `app/api/webhooks/stytch/route.ts` - Webhook handler for Stytch events
- `actions/*.ts` - Server Actions for form submissions (auth, deposit)

## Critical Security Configurations

### next.config.ts
- **Logging disabled**: `logging.incomingRequests: false` - prevents request body logging
- **Taint API enabled**: `experimental.taint: true` - marks secrets as untransmittable to client
- **Payload size limit**: `experimental.serverActions.bodySizeLimit: "100kb"`
- **Security headers**: X-Frame-Options, X-Content-Type-Options, Referrer-Policy, X-XSS-Protection

### env.ts (Zod Validation)
All environment variables are validated at startup. Critical secrets:
- `SERVER_PRIVATE_KEY` - RSA private key for decrypting client payloads (Infisical-managed)
- `INFISICAL_CLIENT_ID/SECRET` - Machine Identity credentials (Universal Auth)
- `STYTCH_PROJECT_ID/SECRET` - B2B authentication credentials
- See `.env.local` template for complete list

### middleware.ts
Validates Stytch JWT for all `/dashboard/*` and `/deposit/*` routes. Redirects to `/login` if session invalid.

## Important Conventions

### File Organization
- **Server Components**: Default in `app/` directory (no `"use client"` directive)
- **Client Components**: Forms with encryption logic require `"use client"`
- **Server Actions**: Located in `actions/` directory, marked with `"use server"`
- **Utilities**: `lib/` directory - never export client instances directly

### TypeScript Standards
- **Strict typing**: No `any` types allowed
- **Zod schemas**: All DTOs validated with Zod (see `schemas/` if created, or inline schemas)
- **Server Action serialization**: DAL functions return POJOs (Plain Old JavaScript Objects)

### Naming Conventions
- **APPNAME extraction**: URL `https://app.pipedrive.com` → `PIPEDRIVE` (uppercase, main domain part)
- **Secret keys**: `{APPNAME}_{FIELD}` format (e.g., `PIPEDRIVE_API_TOKEN`)
- **Organization paths**: Use Stytch `organization_slug` for Infisical folder names

### Development Log
**Mandatory**: All changes must be logged in `development_log.md` with timestamp format `YYYYMMDDTHHMMZ`

## Tech Stack Specifics

### Next.js 16.1.1 + React 19.2.3
- **App Router only** (no Pages router)
- **Server Actions** for form handling (avoid manual API routes)
- **React Server Components** preferred over Client Components
- **React Taint API** for secret protection (`taint: true` in config)

### Stytch B2B (@stytch/nextjs ^21.11.1)
- Use `StytchB2BProvider` wrapper in root layout
- Discovery Flow pattern for multi-org login
- Session validation: `stytchClient.sessions.authenticateJwt()`
- Store org context in session for folder path resolution

### Infisical SDK (@infisical/sdk ^4.0.6)
- **IMPORTANT**: SDK v4 API - all versions prior to 4.0.0 are deprecated and unsupported
- Authenticate once per server action with `client.auth().universalAuth.login()`
- Create secrets: `client.secrets().createSecret(secretName, { secretValue, environment, projectId, secretPath, secretComment })`
- Handle duplicate keys: Add timestamp suffix if key exists
- Network security: IP restrictions + short TTL (5 min) for access tokens

### Tailwind CSS v4 + ShadCN UI
- Design tokens in `globals.css` (CSS variables for theming)
- ShadCN components in `components/ui/` (Base UI primitives)
- Form components: React Hook Form + Zod resolver
- Mobile-first responsive design

## Common Pitfalls to Avoid

1. **Never log sensitive data**: Always sanitize errors before logging. Use generic messages like "Internal Server Error"
2. **Don't use Service Tokens**: Use Machine Identity with Universal Auth instead (Service Tokens are deprecated)
3. **Don't store secrets in state**: Client-side encryption should happen on-the-fly in form submit handler
4. **Don't mix Client/Server**: Server-only code (Infisical, Stytch secret) must stay in `lib/` or `actions/`, never imported by client components
5. **Don't skip session validation**: All protected routes must verify JWT in middleware or Server Action

## Testing & Verification

See `docs/SECURITY_TESTS.md` for security testing procedures including:
- Encryption round-trip verification
- Session expiration handling
- Write-only permission validation
- Log leak prevention checks

## Claude Code Integration

Claude Code will automatically load project guidelines from:

- `.claude/CLAUDE.md` - Main project memory and overview
- `.claude/rules/` - Modular project rules:
  - `tech-stack.md` - Technology stack versions and best practices
  - `project-structure.md` - Project directory structure and conventions
  - `language-policy.md` - English language requirement
  - `security.md` - Security configurations and principles
  - `self-improve.md` - Guidelines for rule improvement
- `.claude/commands/` - Custom slash commands:
  - `/tech-stack` - Analyze tech stack dependencies
  - `/project-structure` - Document project structure

## Additional Documentation

- `docs/prd.md` - Complete Product Requirements Document with threat model
- `docs/STYTCH_SETUP.md` - Stytch B2B configuration guide
- `docs/INFISICAL_SETUP.md` - Infisical Machine Identity setup
- `docs/VERCEL_DEPLOYMENT.md` - Deployment configuration and environment variables
- `docs/SECURITY_TESTS.md` - Security testing procedures

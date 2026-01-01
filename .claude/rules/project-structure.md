# Secret-Zero Project Structure

## Overview

Secret-Zero is a Next.js application with TypeScript, implementing a secure secret sharing portal using Stytch B2B authentication and Infisical for secret management.

## Directory Structure

### Root Level Configuration

- `package.json` - Dependencies and scripts
- `next.config.ts` - Next.js configuration
- `tsconfig.json` - TypeScript configuration
- `eslint.config.mjs` - ESLint configuration
- `postcss.config.mjs` - PostCSS configuration
- `tailwind.config.js` - Tailwind CSS configuration
- `components.json` - shadcn/ui component configuration
- `env.ts` - Environment variable validation (Zod schemas)
- `instrumentation.ts` - Next.js instrumentation for logging/monitoring
- `development_log.md` - Development activity log (mandatory protocol)

### Source Code Structure

#### `actions/` - Server Actions

- `auth.ts` - Authentication-related server actions
- `deposit.ts` - Secret deposit operations

#### `app/` - Next.js App Router

- `(auth)/` - Authentication routes (route groups)
  - `login/page.tsx` - Login page
  - `authenticate/page.tsx` - Authentication flow
  - `layout.tsx` - Auth layout
- `(portal)/` - Protected portal routes (route groups)
  - `dashboard/page.tsx` - User dashboard
  - `deposit/[orgSlug]/page.tsx` - Organization-specific deposit page
  - `layout.tsx` - Portal layout
- `api/webhooks/stytch/route.ts` - Stytch webhook handler
- `layout.tsx` - Root layout
- `page.tsx` - Home page
- `globals.css` - Global styles

#### `components/` - React Components

- `ui/` - shadcn/ui components (reusable UI primitives)
- `forms/` - Form components (secret-form.tsx)
- `component-example.tsx`, `example.tsx` - Example components

#### `lib/` - Utility Libraries

- `crypto.ts` - Cryptographic utilities
- `infisical.ts` - Infisical integration
- `stytch.ts` - Stytch authentication client
- `utils.ts` - General utility functions

### Configuration & Documentation

#### `docs/` - Documentation

- `prd.md` - Product Requirements Document
- `STYTCH_SETUP.md` - Stytch integration guide
- `INFISICAL_SETUP.md` - Infisical setup instructions
- `VERCEL_DEPLOYMENT.md` - Deployment configuration
- `SECURITY_TESTS.md` - Security testing procedures

#### `public/` - Static Assets

- SVG icons and assets for the application

#### `.claude/` - Claude Code Integration

- `CLAUDE.md` - Project memory and instructions for Claude Code
- `rules/` - Modular project rules organized by topic
  - `tech-stack.md` - Technology stack guidelines
  - `project-structure.md` - Project structure conventions
  - `language-policy.md` - Language policy (English requirement)
  - `self-improve.md` - Rule improvement guidelines

## Important Conventions

### File Organization

- Use TypeScript for all source files (.ts/.tsx)
- Server components in `app/` directory
- Server actions in `actions/` directory
- Reusable components in `components/` directory
- Utility functions in `lib/` directory

### Route Organization

- Authentication routes grouped under `(auth)/`
- Protected routes grouped under `(portal)/`
- Dynamic routes use `[param]` syntax
- API routes under `api/`

### Component Architecture

- UI primitives in `components/ui/` (shadcn/ui)
- Feature-specific components in appropriate directories
- Form components in `components/forms/`

### Security Considerations

- All sensitive operations use server actions
- Environment variables validated with Zod schemas
- Cryptographic operations centralized in `lib/crypto.ts`
- Authentication handled through Stytch B2B
- Client-side encryption for secrets before transmission

### Development Workflow

- All changes logged in `development_log.md` with timestamp format `YYYYMMDDTHHMMZ`
- Follow Claude Code rules for consistent code style
- Use English for all code comments and documentation
- Maintain security-first approach in all implementations

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

### middleware.ts

Validates Stytch JWT for all `/dashboard/*` and `/deposit/*` routes. Redirects to `/login` if session invalid.

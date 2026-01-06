# Agent Guidelines for Secret-Zero

## Development Commands

```bash
# Development
pnpm dev                    # Start Next.js dev server (localhost:3000)

# Build & Quality
pnpm build                  # Production build
pnpm start                  # Start production server
pnpm lint                   # Run ESLint (must pass before committing)

# Testing
pnpm test:infisical         # Test Infisical integration (tsx scripts/test-infisical-integration.ts)
pnpm test:stytch            # Test Stytch integration (tsx scripts/test-stytch-integration.ts)
```

## Code Style Guidelines

### File Organization
- `actions/*.ts` - Server Actions (always use `"use server"`)
- `lib/*.ts` - Utility libraries and SDK clients (server-only, never export instances)
- `app/(auth)/*` - Public auth routes (login, authenticate)
- `app/(portal)/*` - Protected routes (require Stytch session)
- `components/ui/*` - ShadCN UI primitives
- `components/forms/*` - Form components with client-side encryption
- `schemas/*.ts` - Zod validation schemas

### Import Conventions
```typescript
// Use absolute imports with @ alias for internal modules
import { depositSecrets } from "@/lib/infisical";
import { depositSecretAction } from "@/actions/deposit";

// External imports first, then internal
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
```

### TypeScript Standards
- **Strict mode enabled**: No `any` types allowed
- **Interfaces vs Types**: Use interfaces for object shapes with properties, types for unions/intersections
- **Type exports**: Export types/interfaces alongside functions
- **Server Action return types**: Return POJOs (Plain Old JavaScript Objects) - never non-serializable objects

```typescript
// ✅ Good: Explicit interface
interface DepositActionInput {
  encryptedData: string;
  encryptedKey: string;
  iv: string;
  organizationSlug: string;
}

// ❌ Bad: any type
function processData(data: any): any { }
```

### Naming Conventions
- **Functions**: camelCase (e.g., `depositSecrets`, `encryptPayload`)
- **Components**: PascalCase (e.g., `SecretForm`, `Button`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `INFISICAL_PROJECT_ID`)
- **Interfaces**: PascalCase (e.g., `EncryptedPayload`, `SecretData`)
- **Files**: kebab-case (e.g., `secret-form.tsx`, `crypto.ts`)
- **Secret keys**: `{APPNAME}_{FIELD}` format (e.g., `PIPEDRIVE_API_TOKEN`)
- **APPNAME extraction**: URL `https://app.pipedrive.com` → `PIPEDRIVE` (uppercase, main domain)

### Error Handling
- **Never log sensitive data**: Sanitize errors before console.error
- **Generic user messages**: "Internal Server Error" instead of stack traces
- **Session errors**: Return friendly messages like "Session expired. Please log in again."
- **Validation errors**: Use Zod schemas with descriptive messages

```typescript
// ✅ Good: Sanitized error logging
try {
  await depositSecrets(orgSlug, appPrefix, data);
} catch (error) {
  console.error("[Deposit] Infisical error:", error);
  return { success: false, error: "Vault save error." };
}

// ❌ Bad: Logging sensitive data
console.error("Secret deposit failed:", secretData);
```

### Security Patterns
- **Client-side encryption**: All secrets encrypted in browser before transmission
- **Server Actions**: Use for all form submissions (manual API routes discouraged)
- **Memory cleanup**: Null sensitive variables immediately after use (use `@ts-expect-error` for intentional nulling)
- **No secret persistence**: Never store secrets in state, encrypt on-the-fly in form handler
- **Write-only architecture**: Infisical role only allows CREATE, never READ/UPDATE/DELETE
- **Environment variables**: Validated with Zod schemas in `env.ts` at startup

```typescript
// ✅ Good: Memory cleanup after secret handling
// @ts-expect-error - intentional nulling for security
secretData.password = null;
```

### React Patterns
- **Server Components preferred**: Default in `app/` directory (no `"use client"` directive)
- **Client Components**: Only for forms with encryption or interactive UI
- **Forms**: Use React Hook Form + Zod resolver (avoid controlled components)
- **State**: Use `useTransition` for server action form submissions

### Code Comments
- **JSDoc preferred**: Document exported functions and interfaces
- **Security notes**: Add comments explaining security-critical operations
- **No TODO/FIXME**: Either implement or create GitHub issue
- **Language**: English only (variable names, comments, docs, commit messages)

### Format & Linting
- **ESLint config**: Next.js config with React 19 & TypeScript rules
- **No trailing whitespace**
- **2-space indentation**
- **Single quotes for strings** (consistent with Next.js defaults)
- **No unused imports** (auto-removed by linter)
- **Fix all lint errors** before committing

### Testing
- **Integration tests**: Located in `scripts/` directory
- **Test runner**: Use `tsx` for TypeScript test execution
- **Test commands**: `pnpm test:infisical` or `pnpm test:stytch`
- **No unit test framework configured**: Manual integration scripts only

## Critical Security Checklist

Before committing code that handles secrets:
1. Secrets encrypted client-side before sending to server
2. Server-side code never logs secret values
3. Memory cleanup performed after secret processing
4. Generic error messages returned to users
5. React Taint API enabled in `next.config.ts`
6. Write-only permissions verified for Infisical operations
7. Session validation present in all protected routes
8. ESLint passes with no errors

# Security Guidelines

Critical security configurations and principles for Secret-Zero application.

## Write-Only Architecture

Secret-Zero implements a **write-only** architecture with client-side encryption:

- **Never read secrets**: The application can only create secrets in Infisical, never read them
- **Client-side encryption**: Secrets are encrypted in the browser before transmission
- **No plain-text storage**: Secrets are never stored in plain text on Vercel's serverless infrastructure
- **Protected against log leaks**: Encryption prevents log leakage on Vercel

## Encryption Strategy

### Client-Side Encryption (Browser)

- Generate one-time AES session key
- Encrypt payload with AES-256-GCM
- Wrap session key with server's RSA public key (RSA-OAEP)

### Server-Side Decryption

- Decrypt with private key (stored in environment variables)
- Process only in RAM (ephemeral)
- Immediately discard after processing

### React Taint API

- Prevent accidental secret exposure to client components
- Mark secrets as untransmittable using `taint: true` in `next.config.ts`

## Authentication Security

### Stytch B2B Integration

- Discovery Flow for multi-organization support
- Session management with JWT verification in middleware
- JIT Provisioning for SSO users
- Account enumeration protection (opaque errors)

### Session Validation

- All protected routes (`/dashboard/*`, `/deposit/*`) require valid JWT
- Middleware validates Stytch JWT on every request
- Redirect to `/login` if session invalid

## Environment Variables & Secrets

### Critical Secrets (Zod Validated)

- `SERVER_PRIVATE_KEY` - RSA private key for decrypting client payloads
- `INFISICAL_CLIENT_ID/SECRET` - Machine Identity credentials (Universal Auth)
- `STYTCH_PROJECT_ID/SECRET` - B2B authentication credentials

### Management Rules

- Never hardcode secrets in code
- All environment variables validated with Zod at startup
- Store sensitive auth data securely (never in localStorage)
- Regularly rotate sensitive credentials

## Infisical Configuration

### Machine Identity (Universal Auth)

- Use Universal Auth instead of deprecated Service Tokens
- Write-only RBAC role: `CREATE` allowed, `READ/UPDATE/DELETE` denied
- Short TTL (5 min) for access tokens
- IP restrictions for network security

### Secret Folder Structure

- Organization paths: `/{environment}/{stytch_org_slug}/`
- Secret naming: `{APPNAME}_URL`, `{APPNAME}_LOGIN`, `{APPNAME}_PASSWORD`, `{APPNAME}_API_TOKEN`

### APPNAME Extraction

URL `https://app.pipedrive.com` → `PIPEDRIVE` (uppercase, main domain part)

## Logging & Data Protection

### Logging Disabled for Security

- `logging.incomingRequests: false` - prevents request body logging
- No secrets logged on Vercel

### Payload Size Limits

- `experimental.serverActions.bodySizeLimit: "100kb"` - prevents memory exhaustion

## Security Headers

All security headers configured in `next.config.ts`:

- `X-Frame-Options: DENY` - Prevent clickjacking
- `X-Content-Type-Options: nosniff` - Prevent MIME type sniffing
- `Referrer-Policy: strict-origin-when-cross-origin` - Control referrer information
- `X-XSS-Protection: 1; mode=block` - Enable XSS protection

## Common Pitfalls to Avoid

1. **Never log sensitive data**: Always sanitize errors before logging. Use generic messages like "Internal Server Error"
2. **Don't use Service Tokens**: Use Machine Identity with Universal Auth instead (Service Tokens deprecated)
3. **Don't store secrets in state**: Client-side encryption should happen on-the-fly in form submit handler
4. **Don't mix Client/Server**: Server-only code (Infisical, Stytch secret) must stay in `lib/` or `actions/`, never imported by client components
5. **Don't skip session validation**: All protected routes must verify JWT in middleware or Server Action

## Server Actions Best Practices

- All sensitive operations use server actions
- Validate Stytch session before processing
- Decrypt client payload with private key (in RAM only)
- Create secrets in Infisical
- Return only status/success confirmation to client

## Testing & Verification

Security tests should verify:
- Encryption round-trip functionality
- Session expiration handling
- Write-only permission enforcement
- Log leak prevention
- Proper error handling without data exposure

See `docs/SECURITY_TESTS.md` for complete security testing procedures.

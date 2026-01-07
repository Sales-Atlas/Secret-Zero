# Stytch Dashboard Analysis & Documentation Discrepancies

**Date:** 2026-01-03
**Analysis of:** Stytch B2B Dashboard vs docs/STYTCH_SETUP.md

## Executive Summary

The current `docs/STYTCH_SETUP.md` contains **significant inaccuracies** when compared to the actual Stytch B2B dashboard (as of January 2026). The documentation references menu structures and configuration options that no longer exist or have been reorganized.

## Current Dashboard Structure (January 2026)

Based on the actual Stytch B2B dashboard, the menu structure is:

```
├── Project Overview
├── Activity
├── Branding
├── Frontend SDK
├── Management
│   ├── Organizations
│   ├── Members
│   ├── Connected Apps
│   ├── M2M Clients
│   ├── Password and User Policies
│   ├── RBAC Policies
│   └── Device Fingerprinting Rules
└── Configuration
    ├── Redirect URLs
    ├── Custom Domains
    ├── OAuth
    ├── reCAPTCHA
    ├── Trusted Auth Tokens
    ├── Custom Claim Templates
    ├── Webhooks
    ├── Migration
    └── Country Code Allowlists
```

## Major Discrepancies in docs/STYTCH_SETUP.md

### 1. Non-Existent Menu Paths

| Document Reference | Reality |
|-------------------|---------|
| `Authentication → Email Magic Links` | **Does not exist** - Email Magic Links are configured via Organization API or SDK |
| `Project Settings → Security → Opaque Error Mode` | **Does not exist** - Opaque errors are default behavior for discovery flows |
| `Authentication → SMS OTP` | **Does not exist** - SMS OTP is configured via `allowed_mfa_methods` in Organization settings |
| `Authentication → Discovery` | **Does not exist** - Discovery Flow is enabled by default for B2B projects |
| `Organizations → Settings → JIT Provisioning` | **Partially incorrect** - JIT is configured via API/SDK with `email_jit_provisioning` field |

### 2. Configuration Methodology Changes

#### Old Documentation Claims:
- "Go to Project Settings → Security → Enable Opaque Error Mode"
- "Go to Authentication → SMS OTP → Make sure it is disabled"
- "Go to Authentication → Discovery → Enable Discovery Flow"

#### Current Reality:
These settings are managed through:
1. **API Calls** using the [Update Organization endpoint](https://stytch.com/docs/b2b/api/update-organization)
2. **Organization Settings** via Management → Organizations
3. **Default Project Behaviors** (Discovery Flow is enabled by default)

### 3. Opaque Errors

**Old Documentation:**
```
Step 3: Configure Opaque Errors (CRITICAL)
1. Go to Project Settings → Security
2. Find the "Error handling" section
3. Enable "Opaque Error Mode"
```

**Current Reality:**
- Opaque error handling is **built-in behavior** for Discovery Flow
- When `billing_not_verified_for_email` error occurs, it's a development account limitation
- No toggle exists in the dashboard for "Opaque Error Mode"
- Discovery magic links always return success (200) to prevent email enumeration

### 4. JIT Provisioning

**Old Documentation:**
```
Step 5: Configure JIT Provisioning
1. Go to Organizations → Settings
2. Set email_jit_provisioning to RESTRICTED
3. Add allowed domains in email_allowed_domains
```

**Current Reality:**
JIT Provisioning is configured via **API calls** to the Update Organization endpoint:

```bash
curl --request PUT \
  --url https://test.stytch.com/v1/b2b/organizations/{ORGANIZATION_ID} \
  -u 'PROJECT_ID:SECRET' \
  -H 'Content-Type: application/json' \
  -d '{
    "email_jit_provisioning": "RESTRICTED",
    "email_allowed_domains": ["client1.com", "client2.com"]
  }'
```

Or via the Stytch SDK:
```typescript
await stytchClient.organizations.update({
  organization_id: orgId,
  email_jit_provisioning: "RESTRICTED",
  email_allowed_domains: ["client1.com", "client2.com"]
});
```

### 5. Email Magic Links

**Old Documentation:**
```
Step 2: Configure Authentication Methods
Go to Authentication → Email Magic Links → Enable
```

**Current Reality:**
- Email Magic Links are **enabled by default** for B2B projects
- Configuration happens at the **Organization level** via API
- Dashboard location: **Configuration → Redirect URLs** (to set redirect destinations)

### 6. SMS OTP

**Old Documentation:**
```
Step 2: SMS OTP - DISABLE!
Go to Authentication → SMS OTP → Make sure it is disabled
```

**Current Reality:**
SMS OTP is configured via Organization settings using `allowed_mfa_methods`:

```bash
curl --request PUT \
  --url https://test.stytch.com/v1/b2b/organizations/{ORGANIZATION_ID} \
  -u 'PROJECT_ID:SECRET' \
  -H 'Content-Type: application/json' \
  -d '{
    "mfa_methods": "RESTRICTED",
    "allowed_mfa_methods": ["totp"]
  }'
```

To disable SMS OTP: exclude `"sms_otp"` from `allowed_mfa_methods` array.

## What Actually Needs to be Configured

### Required Dashboard Configuration

1. **Configuration → Redirect URLs**
   - Add development URLs: `http://localhost:3000/authenticate`
   - Add production URLs: `https://your-domain.com/authenticate`

2. **Configuration → OAuth** (if using OAuth)
   - Enable Google OAuth or Microsoft OAuth
   - Add client credentials

### Required API/SDK Configuration

3. **Organization Settings** (via API or Dashboard → Management → Organizations)
   ```typescript
   await stytchClient.organizations.update({
     organization_id: orgId,
     email_jit_provisioning: "RESTRICTED",
     email_allowed_domains: ["trusted-client.com"],
     mfa_methods: "RESTRICTED",
     allowed_mfa_methods: ["totp"], // Excludes sms_otp
     auth_methods: "RESTRICTED",
     allowed_auth_methods: ["magic_link", "oauth"]
   });
   ```

### Built-in Defaults (No Configuration Needed)

4. **Discovery Flow** - Enabled by default for B2B projects
5. **Opaque Errors** - Built-in behavior for discovery authentication
6. **Email Magic Links** - Enabled by default

## Implementation Code Verification

### Current Implementation Status: ✅ CORRECT

Our implementation in [lib/stytch.ts](lib/stytch.ts:42-44) correctly uses:
- ✅ Discovery Flow API (`stytchClient.magicLinks.email.discovery.send()`)
- ✅ Discovery authentication (`stytchClient.magicLinks.discovery.authenticate()`)
- ✅ Intermediate session exchange (`stytchClient.discovery.intermediateSessions.exchange()`)
- ✅ Session JWT verification (`stytchClient.sessions.authenticate()`)

### Authentication Flow: ✅ CORRECT

[actions/auth.ts](actions/auth.ts:25-36) correctly implements:
- ✅ Opaque error handling (always returns `success: true`)
- ✅ Discovery authentication flow
- ✅ Organization selection and session exchange

## Recommendations

### 1. Update STYTCH_SETUP.md

Create a new version that:
- Uses actual dashboard menu paths
- Explains API-based configuration
- Removes references to non-existent settings
- Clarifies what's configured via dashboard vs. API

### 2. Create Organization Setup Script

Add a script to automate organization configuration:
```typescript
// scripts/setup-stytch-org.ts
import { B2BClient } from 'stytch';

async function setupOrganization(orgId: string) {
  const client = new B2BClient({
    project_id: process.env.STYTCH_PROJECT_ID!,
    secret: process.env.STYTCH_SECRET!,
  });

  await client.organizations.update({
    organization_id: orgId,
    email_jit_provisioning: "RESTRICTED",
    email_allowed_domains: ["client-domain.com"],
    mfa_methods: "RESTRICTED",
    allowed_mfa_methods: ["totp"],
    auth_methods: "RESTRICTED",
    allowed_auth_methods: ["magic_link"]
  });
}
```

### 3. Update Manual Checklist

Create a realistic checklist based on actual dashboard:
- [ ] Configuration → Redirect URLs configured
- [ ] Configuration → OAuth configured (if needed)
- [ ] Organizations created via Dashboard or API
- [ ] Organization settings updated via API
- [ ] Email templates customized (if needed)

## Testing Considerations

The test script [scripts/test-stytch-integration.ts](scripts/test-stytch-integration.ts) correctly handles:
- ✅ Development account `billing_not_verified_for_email` limitation
- ✅ Discovery Flow testing
- ✅ Opaque error behavior verification

## Sources

- [Stytch B2B Email Magic Links Setup](https://stytch.com/docs/b2b/guides/magic-links/initial-setup)
- [Stytch B2B Organization Settings](https://stytch.com/docs/b2b/guides/organizations/org-settings)
- [Stytch B2B API - Organization Auth Settings](https://stytch.com/docs/b2b/api/org-auth-settings)
- [Stytch B2B Update Organization API](https://stytch.com/docs/b2b/api/update-organization)

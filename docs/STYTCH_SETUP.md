# Stytch B2B Configuration Guide

**Last Updated:** 2026-01-06

## Prerequisites

- Stytch account (https://stytch.com)
- Access to Stytch Dashboard
- Node.js environment with Stytch SDK installed

## Understanding Stytch B2B Configuration Levels

Stytch B2B has **two configuration levels** that are critical to understand:

### 1. Project-Level Settings (Global)

These settings apply to **all organizations** in your Stytch project and are configured via the Stytch Dashboard.

**Location:** Stytch Dashboard UI

**What's configured here:**
- **Redirect URLs** - Global list of allowed redirect URLs for authentication callbacks
- **OAuth Credentials** - OAuth provider credentials (Google, Microsoft)
- **Email Templates** - Branding and magic link email templates
- **Frontend SDK** - Public tokens and SDK configuration

### 2. Organization-Level Settings (Per-Organization)

These settings apply to **specific organization** only. Each organization (client) can have different security policies.

**Location:** Stytch Dashboard (Management → Organizations) or API/SDK calls via `organizations.create()` or `organizations.update()`

**What's configured here:**
- **JIT Provisioning** - Email domain restrictions for auto-provisioning
- **Authentication Methods** - Which auth methods are allowed
- **MFA Settings** - MFA requirements and allowed methods

**⚠️ CRITICAL**: Organization-level settings must be configured **separately for each client organization**.

## Step 1: Create B2B Project (Project-Level - Once)

**Configuration Level:** Project-wide (applies to all organizations)

1. Log in to [Stytch Dashboard](https://stytch.com/dashboard)
2. Click **"Create new project"**
3. Select project type: **B2B SaaS**
4. Name your project (e.g., `Secret-Zero-Production`)
5. Save the credentials from **Project Overview** page:
   - `STYTCH_PROJECT_ID` - found in **API Keys** section
   - `STYTCH_SECRET` - found in **API Keys** section (keep this secure!)
   - `NEXT_PUBLIC_STYTCH_PUBLIC_TOKEN` - public token for frontend

## Step 2: Configure Redirect URLs (Project-Level - Once)

**Configuration Level:** Project-wide (applies to all organizations)

**Location:** `Configuration → Redirect URLs`

1. Navigate to **Configuration** in the left sidebar
2. Click **Redirect URLs**
3. Add authorized redirect URLs:

### Development URLs:
```
http://localhost:3000/authenticate
http://localhost:3000/dashboard
```

### Production URLs:
```
https://your-domain.com/authenticate
https://your-domain.com/dashboard
```

### Discovery Redirect URL:
This is where users land after clicking the magic link:
- Development: `http://localhost:3000/authenticate`
- Production: `https://your-domain.com/authenticate`

## Step 3: Configure OAuth (Project-Level - Optional)

**Configuration Level:** Project-wide (applies to all organizations, but can be restricted per-org)

**Location:** `Configuration → OAuth`

If you want to enable OAuth login:

1. Navigate to **Configuration → OAuth**
2. Enable **Google OAuth** or **Microsoft OAuth**
3. Add your OAuth credentials:
   - Client ID
   - Client Secret
   - Authorized redirect URIs

## Step 4: Create Organizations (Per-Client)

**Configuration Level:** Organization-specific (repeat for each client)

**⚠️ IMPORTANT**: You must create and configure **one organization per client**. Each organization will have its own security settings.

### Option A: Via Dashboard

**Location:** `Management → Organizations`

1. Navigate to **Management** in the left sidebar
2. Click **Organizations**
3. Click **Create Organization**
4. Fill in:
   - Organization Name (e.g., "Client Company")
   - Organization Slug (e.g., "client-company")
   - Optional: Logo URL

### Option B: Via API

```bash
curl --request POST \
  --url https://test.stytch.com/v1/b2b/organizations \
  -u 'PROJECT_ID:SECRET' \
  -H 'Content-Type: application/json' \
  -d '{
    "organization_name": "Client Company",
    "organization_slug": "client-company",
    "email_allowed_domains": ["client-company.com"]
  }'
```

## Step 5: Configure Organization Security Settings (Per-Client)

**Configuration Level:** Organization-specific (configure for EACH organization separately)

**⚠️ CRITICAL**:
- These settings are **per-organization**, NOT global
- You must configure **each client organization separately**
- Organization-level settings are configured via **Stytch Dashboard** (recommended) or **API/SDK**

### Configuration via API (Optional)

### Using cURL

```bash
curl --request PUT \
  --url https://test.stytch.com/v1/b2b/organizations/{ORGANIZATION_ID} \
  -u 'PROJECT_ID:SECRET' \
  -H 'Content-Type: application/json' \
  -d '{
    "email_jit_provisioning": "RESTRICTED",
    "email_allowed_domains": ["client1.com", "client2.com"],
    "email_invites": "RESTRICTED",
    "mfa_methods": "RESTRICTED",
    "allowed_mfa_methods": ["totp"],
    "auth_methods": "RESTRICTED",
    "allowed_auth_methods": ["magic_link"]
  }'
```

### Organization Settings Explained

#### JIT Provisioning
```typescript
email_jit_provisioning: "RESTRICTED"
email_allowed_domains: ["client-domain.com"]
```
- **RESTRICTED**: Only users with email domains in `email_allowed_domains` can auto-join
- **NOT_ALLOWED**: Disables automatic user provisioning

⚠️ **WARNING**: Do NOT add public domains like `gmail.com` or `outlook.com`!

#### SMS OTP Security
```typescript
mfa_methods: "RESTRICTED"
allowed_mfa_methods: ["totp"] // Excludes "sms_otp"
```
**IMPORTANT**: SMS OTP must be disabled due to **Toll Fraud** risk. Only use TOTP (Time-based One-Time Password) for MFA.

#### Auth Methods
```typescript
auth_methods: "RESTRICTED"
allowed_auth_methods: ["magic_link"]
```
For Secret-Zero, we only allow Email Magic Links. Add `"oauth"` if using OAuth.

## Step 6: Customize Email Templates (Project-Level - Optional)

**Configuration Level:** Project-wide (shared across all organizations)

**Location:** `Branding` (in left sidebar)

1. Navigate to **Branding**
2. Customize email templates for magic links
3. Example template for Secret-Zero:

```
Subject: Secure Credential Transfer

Hello,

You are receiving this link to securely transfer credentials
to [Your Consulting Company Name].

Click the link below to continue:
{{magic_link}}

This link expires in {{expiration_minutes}} minutes.

If you did not request this link, please ignore this message.
```

## Built-in Features (No Configuration Needed)

The following features are enabled by default for B2B projects:

- ✅ **Discovery Flow** - Enabled by default for all B2B projects
- ✅ **Opaque Errors** - Built-in behavior for discovery authentication (prevents account enumeration)
- ✅ **Email Magic Links** - Enabled by default

## Configuration Summary

### Project-Level Configuration (Once per Project)
- [ ] B2B SaaS project created
- [ ] API Keys saved securely (`STYTCH_PROJECT_ID`, `STYTCH_SECRET`, `NEXT_PUBLIC_STYTCH_PUBLIC_TOKEN`)
- [ ] Redirect URLs configured (`Configuration → Redirect URLs`)
- [ ] OAuth configured (if needed) (`Configuration → OAuth`)
- [ ] Email templates customized (optional) (`Branding`)

### Organization-Level Configuration (Per Client/Organization)
- [ ] Organization created for client
- [ ] `email_jit_provisioning` set to `RESTRICTED` for this organization
- [ ] `email_allowed_domains` contains only trusted corporate domains for this client
- [ ] `mfa_methods` set to `RESTRICTED` with `allowed_mfa_methods: ["totp"]` for this organization
- [ ] `auth_methods` configured appropriately for this client
- [ ] SMS OTP disabled (excluded from `allowed_mfa_methods`) for this organization

## Environment Variables

Create or update your `.env.local` file with the following variables:

```env
# Stytch Configuration
STYTCH_PROJECT_ID=project-test-xxx-xxx
STYTCH_SECRET=secret-test-xxx-xxx
NEXT_PUBLIC_STYTCH_PUBLIC_TOKEN=public-token-test-xxx

# Infisical Configuration (from INFISICAL_SETUP.md)
INFISICAL_CLIENT_ID=xxx-xxx-xxx
INFISICAL_CLIENT_SECRET=xxx-xxx-xxx
INFISICAL_PROJECT_ID=xxx-xxx-xxx
INFISICAL_SITE_URL=https://app.infisical.com
INFISICAL_ENVIRONMENT=prod

# RSA Encryption Keys (from VERCEL_DEPLOYMENT.md)
SERVER_PRIVATE_KEY=-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----\n
NEXT_PUBLIC_SERVER_PUBLIC_KEY=-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----\n

# Optional: For testing
TEST_EMAIL=your-email@your-company.com
```

### Converting RSA Keys to Single-Line Format

If your RSA private key is in multiline PEM format, convert it to single-line format with `\n` separators:

```bash
# Convert private key to single-line format
awk '{printf "%s\\n", $0}' private_key.pem > private_key_single_line.pem

# Convert public key to single-line format
awk '{printf "%s\\n", $0}' public_key.pem > public_key_single_line.pem
```
Project: "Secret-Zero Production"
├── Project Settings (Global)
│   ├── Redirect URLs:
│   │   - https://app.secret-zero.com/authenticate
│   │   - https://app.secret-zero.com/dashboard
│   ├── OAuth: Google OAuth credentials
│   └── Branding: "Secret-Zero" email templates
│
├── Organization: "Acme Corporation"
│   ├── email_allowed_domains: ["acme.com"]
│   ├── email_jit_provisioning: "RESTRICTED"
│   ├── allowed_auth_methods: ["magic_link"]
│   └── mfa_policy: "OPTIONAL"
│
├── Organization: "Tech Startup Inc"
│   ├── email_allowed_domains: ["techstartup.com", "techstartup.eu"]
│   ├── email_jit_provisioning: "RESTRICTED"
│   ├── allowed_auth_methods: ["magic_link", "oauth"]
│   └── mfa_policy: "REQUIRED_FOR_ALL"
│
└── Organization: "Enterprise Client"
    ├── email_allowed_domains: ["enterprise.com"]
    ├── email_jit_provisioning: "RESTRICTED"
    ├── allowed_auth_methods: ["magic_link"]
    ├── mfa_policy: "REQUIRED_FOR_ALL"
    └── allowed_mfa_methods: ["totp"] // SMS OTP disabled
```

### Benefits of Multi-Tenancy
- ✅ Different clients can have different security requirements
- ✅ Enterprise clients can require MFA, startups can make it optional
- ✅ Some clients can use OAuth, others only magic links
- ✅ Each client's users are isolated to their allowed domains

## Multi-Tenancy Architecture

### Example Organization Structure

```
Project: "Secret-Zero Production"
├── Project Settings (Global)
│   ├── Redirect URLs:
│   │   - https://app.secret-zero.com/authenticate
│   │   - https://app.secret-zero.com/dashboard
│   ├── OAuth: Google OAuth credentials
│   └── Branding: "Secret-Zero" email templates
│
├── Organization: "Acme Corporation"
│   ├── email_allowed_domains: ["acme.com"]
│   ├── email_jit_provisioning: "RESTRICTED"
│   ├── allowed_auth_methods: ["magic_link"]
│   └── mfa_policy: "OPTIONAL"
│
├── Organization: "Tech Startup Inc"
│   ├── email_allowed_domains: ["techstartup.com", "techstartup.eu"]
│   ├── email_jit_provisioning: "RESTRICTED"
│   ├── allowed_auth_methods: ["magic_link", "oauth"]
│   └── mfa_policy: "REQUIRED_FOR_ALL"
│
└── Organization: "Enterprise Client"
    ├── email_allowed_domains: ["enterprise.com"]
    ├── email_jit_provisioning: "RESTRICTED"
    ├── allowed_auth_methods: ["magic_link"]
    ├── mfa_policy: "REQUIRED_FOR_ALL"
    └── allowed_mfa_methods: ["totp"] // SMS OTP disabled
```

### Benefits of Multi-Tenancy
- ✅ Different clients can have different security requirements
- ✅ Enterprise clients can require MFA, startups can make it optional
- ✅ Some clients can use OAuth, others only magic links
- ✅ Each client's users are isolated to their allowed domains

## Troubleshooting

### Problem: "billing_not_verified_for_email"

**Cause:** Development accounts can only send emails to addresses from the same domain as your Stytch account.

**Solutions:**
1. Use an email from your Stytch account domain for testing
2. Verify billing in Stytch Dashboard for production use
3. Contact Stytch support to enable test emails

### Problem: "Organization not found"

**Cause:** User trying to log in isn't a member of any organization.

**Solutions:**
1. Create organization first (Step 4)
2. Add user as member via Dashboard → Management → Members
3. Ensure JIT provisioning is configured correctly

### Problem: Magic Link not working

**Checks:**
1. Verify Redirect URLs are configured (`Configuration → Redirect URLs`)
2. Check email template is active (`Branding`)
3. Review logs in Stytch Dashboard → Activity
4. Ensure discovery redirect URL matches your app route

### Problem: User cannot register

**Checks:**
1. Verify JIT Provisioning settings (Dashboard or API)
2. Check if user's email domain is in `email_allowed_domains`
3. Ensure `email_jit_provisioning` is set to `RESTRICTED` (not `NOT_ALLOWED`)

### Problem: SMS OTP still available

**Cause:** Organization `allowed_mfa_methods` includes `"sms_otp"`.

**Solution:**
```typescript
await client.organizations.update({
  organization_id: orgId,
  mfa_methods: "RESTRICTED",
  allowed_mfa_methods: ["totp"] // Remove "sms_otp"
});
```

## Security Best Practices

### Project-Level Security
- Set up redirect URLs carefully - only authorized domains
- Use secure OAuth credentials
- Implement security headers in your application
- Separate projects for development and production

### Organization-Level Security
- **ALWAYS** set `email_jit_provisioning: "RESTRICTED"`
- **ALWAYS** exclude `"sms_otp"` from `allowed_mfa_methods` (Toll Fraud risk)
- **ALWAYS** specify `email_allowed_domains` with corporate domains only
- **NEVER** add public domains like `gmail.com` or `outlook.com`

### Common Pitfalls
- ❌ Wrong Assumption: "I configured email_jit_provisioning once, so all organizations are set"
  - ✅ **Reality**: You must configure **each organization separately**
- ❌ Looking for project-level toggles for organization settings
  - ✅ **Reality**: Organization settings are configured per organization in the Dashboard or via API

## Additional Resources

- [Stytch B2B Documentation](https://stytch.com/docs/b2b)
- [Email Magic Links Guide](https://stytch.com/docs/b2b/guides/magic-links/initial-setup)
- [Organization Settings Guide](https://stytch.com/docs/b2b/guides/organizations/org-settings)
- [Stytch B2B API Reference](https://stytch.com/docs/b2b/api)
- [Update Organization API](https://stytch.com/docs/b2b/api/update-organization)
- [Secret-Zero Implementation](/lib/stytch.ts)

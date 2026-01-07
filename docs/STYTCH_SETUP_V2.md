# Stytch B2B Configuration Guide (Updated January 2026)

## Prerequisites

- Stytch account (https://stytch.com)
- Access to Stytch Dashboard
- Node.js environment with Stytch SDK installed

## Important Notes

⚠️ **Configuration Levels**: Stytch B2B has **two configuration levels**:
- **Project-level** (global): Redirect URLs, OAuth, Branding - configured via Dashboard
- **Organization-level** (per-client): JIT Provisioning, Auth Methods, MFA - configured via API/SDK

⚠️ **Per-Organization Settings**: Settings like `email_jit_provisioning`, `allowed_mfa_methods`, and `allowed_auth_methods` are **per-organization**, NOT global. You must configure **each organization separately** for each client.

⚠️ **Configuration Methodology**: Many Stytch B2B settings are configured via **API calls** or **SDK methods**, not through dashboard toggles. This guide reflects the actual Stytch B2B dashboard structure as of January 2026.

⚠️ **Discovery Flow**: Enabled by default for all B2B projects - no manual configuration needed.

⚠️ **Opaque Errors**: Built-in behavior for discovery authentication - prevents email enumeration attacks automatically.

📚 **See also**: [STYTCH_CONFIGURATION_LEVELS.md](./STYTCH_CONFIGURATION_LEVELS.md) for detailed explanation of project-level vs organization-level settings.

## Step 1: Create B2B Project (Project-Level - Once)

**⚙️ Configuration Level**: Project-wide (applies to all organizations)

1. Log in to [Stytch Dashboard](https://stytch.com/dashboard)
2. Click **"Create new project"**
3. Select project type: **B2B SaaS**
4. Name your project (e.g., `Secret-Zero-Production`)
5. Save the credentials from **Project Overview** page:
   - `STYTCH_PROJECT_ID` - found in **API Keys** section
   - `STYTCH_SECRET` - found in **API Keys** section (keep this secure!)
   - `NEXT_PUBLIC_STYTCH_PUBLIC_TOKEN` - public token for frontend

## Step 2: Configure Redirect URLs (Project-Level - Once)

**⚙️ Configuration Level**: Project-wide (applies to all organizations)

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

**⚙️ Configuration Level**: Project-wide (applies to all organizations, but can be restricted per-org)

**Location:** `Configuration → OAuth`

If you want to enable OAuth login:

1. Navigate to **Configuration → OAuth**
2. Enable **Google OAuth** or **Microsoft OAuth**
3. Add your OAuth credentials:
   - Client ID
   - Client Secret
   - Authorized redirect URIs

## Step 4: Create Your First Organization (Per-Client)

**⚙️ Configuration Level**: Organization-specific (repeat for each client)

⚠️ **IMPORTANT**: You must create and configure **one organization per client**. Each organization will have its own security settings.

You have two options:

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

**⚙️ Configuration Level**: Organization-specific (configure for EACH organization separately)

**⚠️ CRITICAL**:
- These settings are **per-organization**, NOT global
- You must configure **each client organization separately**
- Organization-level settings are configured via **API or SDK**, not the dashboard UI
- Use the setup script to automate this process for each client

### Using the Setup Script (Recommended)

**For each new client**, run:

```bash
# Create organization with secure defaults for Client A
pnpm tsx scripts/setup-stytch-organization.ts create "Client A Corp" clienta.com

# Create organization with secure defaults for Client B
pnpm tsx scripts/setup-stytch-organization.ts create "Client B Inc" clientb.com
```

### Manual Configuration via SDK

If you need custom configuration, create a script `scripts/setup-stytch-org.ts`:

```typescript
#!/usr/bin/env tsx
import { B2BClient } from 'stytch';
import { config } from 'dotenv';

config({ path: '.env.local' });

const client = new B2BClient({
  project_id: process.env.STYTCH_PROJECT_ID!,
  secret: process.env.STYTCH_SECRET!,
});

async function configureOrganization(organizationId: string) {
  const response = await client.organizations.update({
    organization_id: organizationId,

    // JIT Provisioning: Only allow specific email domains
    email_jit_provisioning: "RESTRICTED",
    email_allowed_domains: [
      "client1.com",
      "client2.com",
      "trusted-partner.eu"
    ],

    // Email Invites: Restrict to allowed domains
    email_invites: "RESTRICTED",

    // MFA Policy: Disable SMS OTP (Toll Fraud risk)
    mfa_methods: "RESTRICTED",
    allowed_mfa_methods: ["totp"], // Only TOTP, excludes sms_otp

    // Auth Methods: Restrict to Email Magic Links only
    auth_methods: "RESTRICTED",
    allowed_auth_methods: ["magic_link"],
  });

  console.log('Organization configured:', response.organization.organization_slug);
}

// Replace with your organization ID from Step 4
configureOrganization('organization-test-xxxx-xxxx-xxxx-xxxx');
```

Run the script:
```bash
pnpm tsx scripts/setup-stytch-org.ts
```

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

**⚙️ Configuration Level**: Project-wide (shared across all organizations)

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

## Step 7: Configure Security Headers (Optional, Dashboard)

**Location:** `Configuration → Custom Domains`

If using a custom domain, configure security settings here.

## Configuration Verification

### Manual Checklist:

#### Project-Level Configuration (Once per Project)
- [ ] B2B SaaS project created
- [ ] API Keys saved securely (`STYTCH_PROJECT_ID`, `STYTCH_SECRET`, `NEXT_PUBLIC_STYTCH_PUBLIC_TOKEN`)
- [ ] Redirect URLs configured (`Configuration → Redirect URLs`)
- [ ] OAuth configured (if needed) (`Configuration → OAuth`)
- [ ] Email templates customized (optional) (`Branding`)

#### Organization-Level Configuration (Per Client/Organization)
- [ ] Organization created for client
- [ ] `email_jit_provisioning` set to `RESTRICTED` for this organization
- [ ] `email_allowed_domains` contains only trusted corporate domains for this client
- [ ] `mfa_methods` set to `RESTRICTED` with `allowed_mfa_methods: ["totp"]` for this organization
- [ ] `auth_methods` configured appropriately for this client
- [ ] SMS OTP disabled (excluded from `allowed_mfa_methods`) for this organization

#### Verify Settings Per Organization
```bash
# List all organizations and their settings
pnpm tsx scripts/setup-stytch-organization.ts list
```

⚠️ **Important**: Each client organization should have its own secure settings. Verify that **all organizations** have:
- ✅ `email_jit_provisioning: "RESTRICTED"`
- ✅ Appropriate domains in `email_allowed_domains`
- ✅ `"sms_otp"` excluded from `allowed_mfa_methods`

#### Built-in Features (No Configuration Needed)
- [x] Discovery Flow enabled (default for B2B projects)
- [x] Opaque Errors enabled (built-in for discovery authentication)
- [x] Email Magic Links enabled (default for B2B projects)

### Automated Testing

Run the integration test suite:

```bash
# Set your test email (must be from your Stytch account domain for dev accounts)
export TEST_EMAIL=your-email@your-company.com

# Run tests
pnpm tsx scripts/test-stytch-integration.ts
```

## Environment Variables

Add to your `.env.local`:

```env
# Stytch Configuration
STYTCH_PROJECT_ID=project-test-xxx-xxx
STYTCH_SECRET=secret-test-xxx-xxx
NEXT_PUBLIC_STYTCH_PUBLIC_TOKEN=public-token-test-xxx

# Optional: For testing
TEST_EMAIL=your-email@your-company.com
```

## Troubleshooting

### Problem: "billing_not_verified_for_email"

**Cause**: Development accounts can only send emails to addresses from the same domain as your Stytch account.

**Solutions**:
1. Use an email from your Stytch account domain for testing
2. Verify billing in Stytch Dashboard for production use
3. Contact Stytch support to enable test emails

### Problem: "Organization not found"

**Cause**: User trying to log in isn't a member of any organization.

**Solutions**:
1. Create organization first (Step 4)
2. Add user as member via Dashboard → Management → Members
3. Ensure JIT provisioning is configured correctly

### Problem: Magic Link not working

**Checks**:
1. Verify Redirect URLs are configured (`Configuration → Redirect URLs`)
2. Check email template is active (`Branding`)
3. Review logs in Stytch Dashboard → Activity
4. Ensure discovery redirect URL matches your app route

### Problem: User cannot register

**Checks**:
1. Verify JIT Provisioning settings (API call or script)
2. Check if user's email domain is in `email_allowed_domains`
3. Ensure `email_jit_provisioning` is set to `RESTRICTED` (not `NOT_ALLOWED`)

### Problem: SMS OTP still available

**Cause**: Organization `allowed_mfa_methods` includes `"sms_otp"`.

**Solution**:
```typescript
await client.organizations.update({
  organization_id: orgId,
  mfa_methods: "RESTRICTED",
  allowed_mfa_methods: ["totp"] // Remove "sms_otp"
});
```

## Additional Resources

- [Stytch B2B Documentation](https://stytch.com/docs/b2b)
- [Email Magic Links Guide](https://stytch.com/docs/b2b/guides/magic-links/initial-setup)
- [Organization Settings Guide](https://stytch.com/docs/b2b/guides/organizations/org-settings)
- [Stytch B2B API Reference](https://stytch.com/docs/b2b/api)
- [Secret-Zero Implementation](../lib/stytch.ts)

## What Changed from Old Documentation

See [STYTCH_DASHBOARD_ANALYSIS.md](./STYTCH_DASHBOARD_ANALYSIS.md) for a detailed comparison of documentation discrepancies and what actually needs to be configured.

### Key Changes:
1. **No "Opaque Error Mode" toggle** - Built-in behavior
2. **No "SMS OTP" toggle** - Configured via Organization API
3. **No "Discovery Flow" toggle** - Enabled by default
4. **JIT Provisioning** - Configured via API, not dashboard UI
5. **Menu structure** - Reorganized into Management and Configuration sections

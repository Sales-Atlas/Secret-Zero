# Stytch B2B Configuration Levels

**Important**: Understanding the difference between project-level and organization-level settings is crucial for correct Stytch B2B configuration.

## Two Configuration Levels

### 1. Project-Level Settings (Global)

These settings apply to **all organizations** in your Stytch project.

**Location**: Stytch Dashboard UI

**What's configured here**:

#### Configuration → Redirect URLs
- Global list of allowed redirect URLs for authentication callbacks
- Example: `http://localhost:3000/authenticate`, `https://app.example.com/authenticate`
- **Applies to**: All organizations in the project

#### Configuration → OAuth
- OAuth provider credentials (Google, Microsoft)
- Client IDs and secrets
- **Applies to**: All organizations (but can be restricted per-org via `allowed_auth_methods`)

#### Branding
- Email templates for magic links
- Logo and company branding
- **Applies to**: All organizations (shared templates)

#### Frontend SDK
- Public tokens
- SDK configuration
- **Applies to**: All organizations

### 2. Organization-Level Settings (Per-Organization)

These settings apply to **specific organization** only. Each organization (client) can have different security policies.

**Location**: API/SDK calls via `organizations.create()` or `organizations.update()`

**What's configured here**:

#### Email Magic Links Settings
```typescript
{
  email_jit_provisioning: "RESTRICTED" | "NOT_ALLOWED",
  email_allowed_domains: ["client-domain.com"],
  email_invites: "RESTRICTED" | "ALL_ALLOWED" | "NOT_ALLOWED"
}
```
- **Per-organization**: Each org can have different allowed domains

#### Authentication Methods
```typescript
{
  auth_methods: "RESTRICTED" | "ALL_ALLOWED",
  allowed_auth_methods: ["magic_link", "oauth", "password"]
}
```
- **Per-organization**: Each org can restrict which auth methods are allowed

#### MFA Settings
```typescript
{
  mfa_methods: "RESTRICTED" | "ALL_ALLOWED",
  allowed_mfa_methods: ["totp"], // or ["totp", "sms_otp"]
  mfa_policy: "OPTIONAL" | "REQUIRED_FOR_ALL"
}
```
- **Per-organization**: Each org can have different MFA requirements

## Practical Example

### Your Stytch Project

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

## Workflow for Secret-Zero

### Initial Setup (Once per Project)

1. **Configure project-level settings** via Dashboard:
   ```bash
   # Manual steps in Stytch Dashboard
   1. Go to Configuration → Redirect URLs
   2. Add: https://your-domain.com/authenticate
   3. (Optional) Configure OAuth providers
   4. (Optional) Customize email templates in Branding
   ```

### Per-Client Setup (Once per Organization)

2. **Create organization with secure defaults** via script:
   ```bash
   # For each new client
   pnpm tsx scripts/setup-stytch-organization.ts create "Client Name" client-domain.com
   ```

   This creates an organization with:
   - ✅ `email_jit_provisioning: "RESTRICTED"`
   - ✅ `email_allowed_domains: ["client-domain.com"]`
   - ✅ `allowed_mfa_methods: ["totp"]` (SMS OTP excluded)
   - ✅ `allowed_auth_methods: ["magic_link"]`

### Update Organization Settings (As Needed)

3. **Reconfigure organization** if requirements change:
   ```bash
   # Update existing organization
   pnpm tsx scripts/setup-stytch-organization.ts configure organization-test-xxx-xxx new-domain.com
   ```

## Important Notes

### ⚠️ Configuration Scope

| Setting | Scope | Configured Via |
|---------|-------|----------------|
| Redirect URLs | **Project-wide** | Dashboard UI |
| OAuth Credentials | **Project-wide** | Dashboard UI |
| Email Templates | **Project-wide** | Dashboard UI |
| JIT Provisioning | **Per-Organization** | API/SDK |
| Allowed Domains | **Per-Organization** | API/SDK |
| Auth Methods | **Per-Organization** | API/SDK |
| MFA Policy | **Per-Organization** | API/SDK |

### 🔐 Security Best Practices

1. **Project-level**: Configure once, secure defaults for all organizations
   - Set up redirect URLs carefully
   - Use secure OAuth credentials

2. **Organization-level**: Configure per client requirements
   - **ALWAYS** set `email_jit_provisioning: "RESTRICTED"`
   - **ALWAYS** exclude `"sms_otp"` from `allowed_mfa_methods` (Toll Fraud risk)
   - **ALWAYS** specify `email_allowed_domains` with corporate domains only
   - **NEVER** add public domains like `gmail.com` or `outlook.com`

## Why Per-Organization Settings?

This design enables:

### Multi-Tenancy Benefits
- ✅ Different clients can have different security requirements
- ✅ Enterprise clients can require MFA, startups can make it optional
- ✅ Some clients can use OAuth, others only magic links
- ✅ Each client's users are isolated to their allowed domains

### Flexibility for Secret-Zero
- Client A: Banking sector → strict MFA required
- Client B: Tech startup → flexible authentication
- Client C: Healthcare → specific compliance requirements

## Common Pitfalls

### ❌ Wrong Assumption
> "I configured email_jit_provisioning once, so all organizations are set"

**Reality**: You must configure **each organization separately**

### ❌ Wrong Approach
```bash
# This only configures ONE organization
pnpm tsx scripts/setup-stytch-organization.ts configure org-123
```

### ✅ Correct Approach
```bash
# Configure each organization
pnpm tsx scripts/setup-stytch-organization.ts configure org-client-a
pnpm tsx scripts/setup-stytch-organization.ts configure org-client-b
pnpm tsx scripts/setup-stytch-organization.ts configure org-client-c
```

Or create organizations with secure defaults from the start:
```bash
pnpm tsx scripts/setup-stytch-organization.ts create "Client A" clienta.com
pnpm tsx scripts/setup-stytch-organization.ts create "Client B" clientb.com
pnpm tsx scripts/setup-stytch-organization.ts create "Client C" clientc.com
```

## Verification

### List all organizations and their settings
```bash
pnpm tsx scripts/setup-stytch-organization.ts list
```

This shows each organization's individual settings.

## Resources

- [Stytch B2B Organization Settings](https://stytch.com/docs/b2b/guides/organizations/org-settings)
- [Organization Auth Settings API](https://stytch.com/docs/b2b/api/org-auth-settings)
- [Secret-Zero Setup Script](../scripts/setup-stytch-organization.ts)

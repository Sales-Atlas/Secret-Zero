# Infisical Configuration Guide

## Prerequisites

- Infisical account (https://app.infisical.com)
- Access to an organization in Infisical

## Step 1: Create Project

1. Log in to [Infisical Dashboard](https://app.infisical.com)
2. Click **"+ New Project"**
3. Project name: `Client-Secrets-Collection`
4. Description: `Client secrets vault - ISCP portal`
5. Save the **Project ID** (found in Project Settings)

## Step 2: Configure Environment

1. Go to the `Client-Secrets-Collection` project
2. In the left menu, select **Environments**
3. Check if the `prod` environment exists
   - If not, create a new environment: **prod**

### Folder Structure

Secrets will be stored in this structure:
```
/prod
  /{organization_slug}
    /APPNAME_URL
    /APPNAME_LOGIN
    /APPNAME_PASSWORD
    /APPNAME_API_TOKEN
```

## Step 3: Create Machine Identity

Machine Identity is a secure way to authenticate applications.

1. Go to **Organization Settings** → **Machine Identities**
2. Click **"+ Create Machine Identity"**
3. Fill in the form:
   - **Name**: `iscp-backend-worker`
   - **Description**: `ISCP Portal Backend - write-only secrets`

### Configure Universal Auth

1. After creating the Machine Identity, click on it
2. Select the **Authentication** tab
3. Click **"Add Auth Method"** → **Universal Auth**
4. Configure:
   - **Access Token TTL**: `300` (5 minutes)
   - **Max Number of Uses**: `0` (unlimited)
   - **Trusted IPs**: Leave empty or add Vercel IPs (optional)
5. Click **"Create"**
6. **SAVE IMMEDIATELY** the displayed data:
   - `Client ID`
   - `Client Secret`

**WARNING:** Client Secret is displayed only once!

## Step 4: Create Write-Only Role (CRITICAL)

The Write-Only role prevents the application backend from reading secrets.

1. Go to **Organization Settings** → **Roles**
2. Click **"+ Create Role"**
3. Fill in:
   - **Name**: `Inbound-Depositor`
   - **Description**: `Write-only role for secrets - no read access`

### Configure Permissions

Add the following permissions for the `Client-Secrets-Collection` project:

#### Secrets Permissions:
| Permission | Value |
|------------|-------|
| `secrets.create` | **ALLOW** ✅ |
| `secrets.read` | **DENY** ❌ |
| `secrets.list` | **DENY** ❌ |
| `secrets.update` | **DENY** ❌ |
| `secrets.delete` | **DENY** ❌ |

#### Folders Permissions:
| Permission | Value |
|------------|-------|
| `folders.create` | **ALLOW** ✅ |
| `folders.read` | **ALLOW** ✅ |
| `folders.delete` | **DENY** ❌ |

4. Click **"Create Role"**

### Verify Permission Inversion

After creating the role, test:
1. Call `client.secrets().listSecrets()` with this role
2. You should receive a **403 Forbidden** error

## Step 5: Assign Role to Machine Identity

1. Go to **Project Settings** → **Access Control**
2. Find the **Machine Identities** tab
3. Click **"+ Add Machine Identity"**
4. Select: `iscp-backend-worker`
5. Assign role: `Inbound-Depositor`
6. Scope:
   - **Environment**: `prod`
   - **Secret Path**: `/` (entire project)
7. Click **"Add"**

## Step 6: Test Configuration

### Write test (should work):

```typescript
import { InfisicalSDK } from '@infisical/sdk';

const client = new InfisicalSDK();

await client.auth().universalAuth.login({
  clientId: process.env.INFISICAL_CLIENT_ID!,
  clientSecret: process.env.INFISICAL_CLIENT_SECRET!
});

// This should work
await client.secrets().createSecret("TEST_SECRET", {
  environment: "prod",
  projectId: process.env.INFISICAL_PROJECT_ID!,
  secretValue: "test-value",
  secretPath: "/test-org"
});

console.log("✅ Write works correctly");
```

### Read test (should FAIL):

```typescript
// This should return 403
try {
  await client.secrets().listSecrets({
    environment: "prod",
    projectId: process.env.INFISICAL_PROJECT_ID!,
    secretPath: "/test-org"
  });
  console.log("❌ ERROR: Read should not work!");
} catch (error) {
  console.log("✅ Correct: Read blocked (403)");
}
```

## Environment Variables to Save

```env
INFISICAL_CLIENT_ID=xxx-xxx-xxx
INFISICAL_CLIENT_SECRET=xxx-xxx-xxx
INFISICAL_PROJECT_ID=xxx-xxx-xxx
INFISICAL_SITE_URL=https://app.infisical.com
```

## Secret Structure in Infisical

After deployment, secrets will look like this:

```
/prod
  /acme-corp
    PIPEDRIVE_URL=https://pipedrive.com
    PIPEDRIVE_LOGIN=admin@acme.com
    PIPEDRIVE_PASSWORD=***
    PIPEDRIVE_API_TOKEN=***
    
    HUBSPOT_URL=https://hubspot.com
    HUBSPOT_API_TOKEN=***
    
  /beta-solutions
    SALESFORCE_URL=https://salesforce.com
    SALESFORCE_LOGIN=user@beta.com
    SALESFORCE_PASSWORD=***
```

## Monitoring and Audit

### Activity Logs

1. Go to **Project** → **Audit Logs**
2. Monitor:
   - New secrets created by `iscp-backend-worker`
   - Read attempts (should be blocked)
   - Unusual activity

### Alerts

Consider setting up alerts for:
- Excessive writes in a short time
- Access attempts from unknown IPs
- Authorization errors

## Configuration Verification

### Checklist:
- [ ] `Client-Secrets-Collection` project created
- [ ] `prod` environment exists
- [ ] `iscp-backend-worker` Machine Identity created
- [ ] Universal Auth configured with 5-minute TTL
- [ ] `Inbound-Depositor` role created
- [ ] Write-Only permissions correctly configured
- [ ] Role assigned to Machine Identity
- [ ] Write test: PASS
- [ ] Read test: BLOCKED (403)
- [ ] Environment variables saved

## Troubleshooting

### Problem: "Access denied" when creating secret
- Check if Machine Identity has assigned role
- Check scope (environment, secret path)
- Check if Client ID/Secret are correct

### Problem: Read works (it shouldn't!)
- Check if role has `secrets.read: DENY`
- Make sure the correct role is assigned
- Check if there are no other roles assigned

### Problem: Cannot create folder
- Check `folders.create: ALLOW`
- Check `folders.read: ALLOW` (required for navigation)

### Problem: Token expires too quickly
- Increase TTL in Universal Auth (max recommended: 15 minutes)
- Make sure the application refreshes the token before expiration

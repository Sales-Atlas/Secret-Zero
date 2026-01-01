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

## Step 3: Create Machine Identity (Project-Level)

Machine Identity is a secure way to authenticate applications. For Secret-Zero, we'll create a **project-level** identity since we're working with a specific project.

1. Go to **Project Settings** (in the `Client-Secrets-Collection` project)
2. Select **Access Control** → **Machine Identities**
3. Click **"+ Add Machine Identity"**
4. Click **"Create new identity"**
5. Fill in the form:
   - **Name**: `iscp-backend-worker`
   - **Role**: Select a project role (e.g., "No Access" - we'll configure custom permissions later)

### Configure Universal Auth

1. After creating the Machine Identity, the **Authentication** tab should be displayed
2. By default, **Universal Auth** should already be configured
3. Click to edit the **Authentication** section to configure:
   - **Access Token TTL**: `300` seconds (5 minutes)
   - **Access Token Max TTL**: `300` seconds (5 minutes)
   - **Access Token Max Number of Uses**: `0` (unlimited)
   - **Trusted IPs**: Leave empty or add Vercel IPs (optional)
4. Click **"Save"**

### Create Client Secret

1. In the **Authentication** section, click **"Create Client Secret"**
2. **SAVE IMMEDIATELY** the displayed credentials:
   - `Client ID`
   - `Client Secret`

**WARNING:** Client Secret is displayed only once!

## Step 4: Configure Write-Only Permissions (CRITICAL)

The Write-Only permissions prevent the application backend from reading secrets. Infisical uses a **permission rule system** with Allow and Forbid rules.

1. In the Machine Identity page, go to the **Permissions** tab
2. Make sure the **Environment** is set to `prod` and **Secret Path** is set to `/` (root)

### Configure Secrets Permissions

Add two permission rules for **Secrets**:

#### Rule 1: Allow Create Only

- **Permission**: `Allow`
- **Actions**:
  - ☑️ **Create** (checked)
  - ☐ Describe Secret (unchecked)
  - ☐ Read Value (unchecked)
  - ☐ Modify (unchecked)
  - ☐ Remove (unchecked)

#### Rule 2: Forbid Read, Modify, Delete

- **Permission**: `Forbid`
- **Actions**:
  - ☐ Create (unchecked)
  - ☐ Describe Secret (unchecked)
  - ☑️ **Read Value** (checked)
  - ☑️ **Modify** (checked)
  - ☑️ **Remove** (checked)

### Configure Secret Folders Permissions

Add two permission rules for **Secret Folders**:

#### Rule 1: Allow Create and Modify

- **Permission**: `Allow`
- **Actions**:
  - ☑️ **Create** (checked)
  - ☑️ **Modify** (checked)
  - ☐ Remove (unchecked)

#### Rule 2: Forbid Remove

- **Permission**: `Forbid`
- **Actions**:
  - ☐ Create (unchecked)
  - ☐ Modify (unchecked)
  - ☑️ **Remove** (checked)

**Note**: The Modify permission for folders is needed to navigate the folder structure. Create is needed to create organization-specific folders (e.g., `/acme-corp`).

### Verify Permission Inversion

After configuring permissions, test:

1. Try to call `client.secrets().listSecrets()` with this identity
2. You should receive a **403 Forbidden** error

## Step 5: Test Configuration

### Write test (should work):

```typescript
import { InfisicalSDK } from '@infisical/sdk';

const client = new InfisicalSDK({
  siteUrl: 'https://app.infisical.com'
});

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
INFISICAL_ENVIRONMENT=prod
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
- [ ] `iscp-backend-worker` Machine Identity created at **project level**
- [ ] Universal Auth configured with 5-minute TTL
- [ ] Write-Only permissions configured using **permission rules**:
  - [ ] Secrets: Allow Create, Forbid Read Value/Modify/Remove
  - [ ] Secret Folders: Allow Create/Modify, Forbid Remove
- [ ] Client ID and Client Secret saved
- [ ] Write test: PASS
- [ ] Read test: BLOCKED (403)
- [ ] Environment variables saved

## Troubleshooting

### Problem: "Access denied" when creating secret

- Check if Machine Identity has the correct permissions
- Verify environment and secret path settings
- Check if Client ID/Secret are correct

### Problem: Read works (it shouldn't!)

- Check if permission rules are correctly configured
- Make sure **Forbid** rule for "Read Value" is active
- Verify you're testing with the correct Machine Identity

### Problem: Cannot create folder

- Check if "Create" permission is allowed for **Secret Folders**
- Check if "Modify" permission is allowed for **Secret Folders** (needed for navigation)

### Problem: Token expires too quickly

- Increase TTL in Universal Auth (recommended: 5-15 minutes)
- Make sure the application authenticates fresh for each deposit operation
- Current implementation in `lib/infisical.ts` handles re-authentication automatically

## Key Differences from Organization-Level Setup

**Project-Level Identity** (recommended for Secret-Zero):

- ✅ Scoped to specific project (`Client-Secrets-Collection`)
- ✅ Easier permission management
- ✅ Better security isolation
- ✅ Permissions configured directly on the identity

**Organization-Level Identity** (alternative):

- Managed at organization level
- Can access multiple projects
- Requires explicit project assignment
- More complex to manage

For Secret-Zero, we use **project-level** identities because:

1. We only need access to one project
2. Simpler permission configuration
3. Better security principle of least privilege
4. Easier to audit and maintain

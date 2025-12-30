# ISCP Portal Security Tests

## Overview

This document describes security testing procedures for the Inbound Secret Collection Portal.
Tests should be performed before each production deployment.

---

## 1. Unit Tests

### 1.1 Encryption/Decryption Test

**Goal:** Verify correctness of AES+RSA hybrid encryption

```typescript
// __tests__/crypto.test.ts
import { encryptPayload, decryptPayload, generateKeyPair } from "@/lib/crypto";

describe("Crypto", () => {
  let publicKey: string;
  let privateKey: string;

  beforeAll(async () => {
    const keys = await generateKeyPair();
    publicKey = keys.publicKey;
    privateKey = keys.privateKey;
  });

  it("should encrypt and decrypt data correctly", async () => {
    const originalData = {
      url: "https://example.com",
      login: "admin@test.com",
      password: "secretPassword123",
      apiToken: "sk-test-token",
    };

    // Encrypt
    const encrypted = await encryptPayload(originalData, publicKey);
    
    // Check structure
    expect(encrypted.encryptedData).toBeTruthy();
    expect(encrypted.encryptedKey).toBeTruthy();
    expect(encrypted.iv).toBeTruthy();

    // Decrypt
    const decrypted = await decryptPayload(encrypted, privateKey);
    
    // Verify
    expect(decrypted).toEqual(originalData);
  });

  it("should fail decryption with wrong key", async () => {
    const data = { url: "https://test.com" };
    const encrypted = await encryptPayload(data, publicKey);

    // Generate different key
    const wrongKeys = await generateKeyPair();

    await expect(
      decryptPayload(encrypted, wrongKeys.privateKey)
    ).rejects.toThrow();
  });
});
```

### 1.2 URL Extraction Test

**Goal:** Verify correctness of domain parsing

```typescript
// __tests__/url-parser.test.ts
import { extractAppNameFromUrl } from "@/lib/url-parser";

describe("URL Parser", () => {
  it("should extract app name from various URLs", () => {
    expect(extractAppNameFromUrl("https://pipedrive.com")).toBe("PIPEDRIVE");
    expect(extractAppNameFromUrl("https://app.pipedrive.com")).toBe("PIPEDRIVE");
    expect(extractAppNameFromUrl("https://my.salesforce.com")).toBe("SALESFORCE");
    expect(extractAppNameFromUrl("https://api.hubspot.com/v1")).toBe("HUBSPOT");
    expect(extractAppNameFromUrl("https://stripe.com/dashboard")).toBe("STRIPE");
  });

  it("should throw on invalid URL", () => {
    expect(() => extractAppNameFromUrl("not-a-url")).toThrow();
    expect(() => extractAppNameFromUrl("")).toThrow();
  });
});
```

### 1.3 Session Validation Test

**Goal:** Verify that missing/invalid JWT returns 401

```typescript
// __tests__/auth.test.ts
describe("Session Validation", () => {
  it("should reject request without JWT", async () => {
    const response = await fetch("/api/protected", {
      method: "POST",
      // No session cookie
    });
    
    expect(response.status).toBe(401);
  });

  it("should reject expired JWT", async () => {
    const expiredJwt = "expired.jwt.token";
    
    const response = await fetch("/api/protected", {
      method: "POST",
      headers: {
        Cookie: `stytch_session_jwt=${expiredJwt}`,
      },
    });
    
    expect(response.status).toBe(401);
  });
});
```

---

## 2. Integration Tests

### 2.1 Discovery Flow Test

**Goal:** Full login flow through magic link

**Manual Procedure:**

1. Go to `/login`
2. Enter email of a registered user
3. Check that:
   - UI shows "Check your inbox" (not "Email does not exist")
   - Email with magic link was sent
4. Click the link in email
5. Check that:
   - User is redirected to `/authenticate`
   - Organization list is displayed (or auto-redirect with single org)
6. Select organization
7. Check that:
   - User is redirected to `/deposit/{org}`
   - `stytch_session_jwt` cookie is set

**Expected Result:** Complete login without errors

### 2.2 Secret Save Test

**Goal:** Verify save to Infisical

**Procedure:**

1. Log in as test user
2. On `/deposit/{org}` page fill in the form:
   - URL: `https://test.example.com`
   - Login: `testuser`
   - Password: `testpass`
   - Token: `test-token`
3. Click "Send"
4. Check in Infisical Dashboard:
   - Folder `/{org}` exists
   - Secrets: `EXAMPLE_URL`, `EXAMPLE_LOGIN`, `EXAMPLE_PASSWORD`, `EXAMPLE_API_TOKEN`
5. Check that values are correct

**Expected Result:** All secrets saved correctly

### 2.3 Write-Only Test

**Goal:** Verify that backend cannot read secrets

**Procedure:**

1. Temporarily add this call in code:
```typescript
try {
  const secrets = await client.secrets().listSecrets({
    environment: "prod",
    projectId: process.env.INFISICAL_PROJECT_ID!,
    secretPath: "/test-org"
  });
  console.log("❌ FAIL: Read should be blocked", secrets);
} catch (error) {
  console.log("✅ PASS: Read blocked with 403");
}
```
2. Run test
3. Check logs

**Expected Result:** 403 Forbidden error

---

## 3. Security Tests

### 3.1 Opaque Errors Test (Account Enumeration)

**Goal:** Verify that existing emails cannot be identified

**Procedure:**

1. Send request with email that EXISTS:
```bash
curl -X POST https://your-domain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "existing@example.com"}'
```

2. Send request with email that DOES NOT EXIST:
```bash
curl -X POST https://your-domain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "nonexistent@example.com"}'
```

3. Compare responses

**Expected Result:** 
- Both responses have the same status (200)
- Both responses have identical structure
- Cannot distinguish if email exists

### 3.2 Log Leak Test

**Goal:** Verify that logs do not contain secrets

**Procedure:**

1. Force a 500 error (e.g., invalid JSON):
```bash
curl -X POST https://your-domain.com/api/deposit \
  -H "Content-Type: application/json" \
  -d '{"invalid": "data"}'
```

2. Check Vercel logs:
   - Vercel Dashboard → Deployments → Logs
   - Or: `vercel logs --follow`

3. Search in logs for:
   - Passwords
   - Tokens
   - Private keys
   - Full request body

**Expected Result:** Logs contain only safe metadata, no secret values

### 3.3 JWT Expiry Test

**Goal:** Verify that expired sessions are rejected

**Procedure:**

1. Log in and copy the `stytch_session_jwt` cookie value
2. Wait until expiration (or change system time)
3. Send request with expired JWT:
```bash
curl -X POST https://your-domain.com/api/deposit \
  -H "Cookie: stytch_session_jwt=EXPIRED_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"data": "test"}'
```

**Expected Result:** 
- Status 401 Unauthorized
- Redirect to `/login`

### 3.4 Infisical RBAC Test

**Goal:** Confirm that Write-Only role blocks read access

**Procedure:**

Run the test script:

```typescript
// scripts/test-rbac.ts
import { InfisicalSDK } from "@infisical/sdk";

async function testRBAC() {
  const client = new InfisicalSDK();
  
  await client.auth().universalAuth.login({
    clientId: process.env.INFISICAL_CLIENT_ID!,
    clientSecret: process.env.INFISICAL_CLIENT_SECRET!,
  });

  // Test 1: Create (should work)
  try {
    await client.secrets().createSecret("RBAC_TEST", {
      environment: "prod",
      projectId: process.env.INFISICAL_PROJECT_ID!,
      secretValue: "test-value",
      secretPath: "/rbac-test",
    });
    console.log("✅ CREATE: Allowed (correct)");
  } catch (error) {
    console.log("❌ CREATE: Blocked (INCORRECT!)");
  }

  // Test 2: Read (should be blocked)
  try {
    await client.secrets().getSecret("RBAC_TEST", {
      environment: "prod",
      projectId: process.env.INFISICAL_PROJECT_ID!,
      secretPath: "/rbac-test",
    });
    console.log("❌ READ: Allowed (SECURITY ISSUE!)");
  } catch (error) {
    console.log("✅ READ: Blocked (correct)");
  }

  // Test 3: List (should be blocked)
  try {
    await client.secrets().listSecrets({
      environment: "prod",
      projectId: process.env.INFISICAL_PROJECT_ID!,
      secretPath: "/rbac-test",
    });
    console.log("❌ LIST: Allowed (SECURITY ISSUE!)");
  } catch (error) {
    console.log("✅ LIST: Blocked (correct)");
  }

  // Test 4: Update (should be blocked)
  try {
    await client.secrets().updateSecret("RBAC_TEST", {
      environment: "prod",
      projectId: process.env.INFISICAL_PROJECT_ID!,
      secretValue: "new-value",
      secretPath: "/rbac-test",
    });
    console.log("❌ UPDATE: Allowed (SECURITY ISSUE!)");
  } catch (error) {
    console.log("✅ UPDATE: Blocked (correct)");
  }

  // Test 5: Delete (should be blocked)
  try {
    await client.secrets().deleteSecret("RBAC_TEST", {
      environment: "prod",
      projectId: process.env.INFISICAL_PROJECT_ID!,
      secretPath: "/rbac-test",
    });
    console.log("❌ DELETE: Allowed (SECURITY ISSUE!)");
  } catch (error) {
    console.log("✅ DELETE: Blocked (correct)");
  }
}

testRBAC();
```

**Expected Result:**
```
✅ CREATE: Allowed (correct)
✅ READ: Blocked (correct)
✅ LIST: Blocked (correct)
✅ UPDATE: Blocked (correct)
✅ DELETE: Blocked (correct)
```

---

## 4. Pre-Production Checklist

### Stytch Configuration
- [ ] B2B SaaS project type
- [ ] Email Magic Links enabled
- [ ] SMS OTP disabled
- [ ] **Opaque Errors enabled**
- [ ] Discovery Flow configured
- [ ] JIT Provisioning: RESTRICTED
- [ ] Redirect URLs configured
- [ ] Authorized Origins added

### Infisical Configuration
- [ ] Machine Identity created
- [ ] Universal Auth configured
- [ ] **Write-Only role created and assigned**
- [ ] Token TTL: 5 minutes
- [ ] RBAC test: all tests PASS

### Vercel Configuration
- [ ] All environment variables set
- [ ] RSA private key as secret
- [ ] NEXT_PUBLIC_APP_URL correct
- [ ] Domain configured
- [ ] HTTPS enforced

### Security Tests
- [ ] Opaque Errors test: PASS
- [ ] Log leak test: PASS
- [ ] JWT Expiry test: PASS
- [ ] RBAC test: all PASS
- [ ] Encryption test: PASS

### Monitoring
- [ ] Vercel logs configured
- [ ] Alerts set (error rate, response time)
- [ ] Infisical audit logs monitored

---

## 5. Incident Reporting

In case a security issue is detected:

1. **Immediately:**
   - Stop deployment
   - Notify security team

2. **Documentation:**
   - Problem description
   - Reproduction steps
   - Potential impact
   - Proposed solution

3. **Remediation:**
   - Fix the issue
   - Run tests again
   - Update documentation

4. **Post-mortem:**
   - Root cause analysis
   - Preventive actions
   - Update test procedures

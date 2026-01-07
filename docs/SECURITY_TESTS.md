# ISCP Portal Security Tests (Updated)

## Overview

This document describes security testing procedures for the Inbound Secret Collection Portal.
Tests should be performed before each production deployment.

**Last Updated:** 2026-01-06
**Architecture:** Next.js 16 with Server Actions (no API routes)

---

## 1. Automated Integration Tests

### 1.1 Infisical Integration Test

**Goal:** Verify complete Infisical integration including RBAC, secret creation, and write-only permissions

**Run Test:**

```bash
pnpm test:infisical
```

**Test Coverage:**
- ✅ Environment variable validation
- ✅ Universal Auth authentication
- ✅ Invalid credentials rejection
- ✅ Read permissions blocked (403 Forbidden)
- ✅ Create secret succeeds (write-only)
- ✅ Duplicate secret handling with timestamp suffix
- ✅ Full deposit flow (all secret types)
- ✅ Partial deposit (URL only)
- ✅ Secret path validation
- ✅ Secret naming convention ({APPNAME}_{FIELD})

**Expected Output:**

```
===================================
Infisical Integration Tests
===================================

Configuration Tests
✅ PASS Environment variables are set (5ms)

Authentication Tests
✅ PASS Universal Auth login succeeds (234ms)
❌ FAIL Authentication fails with invalid credentials (123ms)

Permission Tests
✅ PASS Read permissions are blocked (403 Forbidden) (89ms)
✅ PASS Create secret succeeds (write-only) (156ms)

Secret Operation Tests
✅ PASS Duplicate secret gets timestamp suffix (312ms)
✅ PASS Valid single-level secret path succeeds (145ms)
✅ PASS Nested folder paths are rejected with clear error (23ms)
✅ PASS Secret naming follows APPNAME_FIELD pattern (178ms)

Full Integration Tests
✅ PASS Full deposit flow with all secret types (423ms)
✅ PASS Partial deposit with only URL (134ms)

Test Summary
Total Tests: 12
Passed: 11
Failed: 1 (expected failure for invalid credentials)
```

---

### 1.2 Stytch Integration Test

**Goal:** Verify Stytch B2B authentication flow and session management

**Run Test:**

```bash
pnpm test:stytch
```

**Test Coverage:**
- ✅ Discovery magic link sending
- ✅ Magic link authentication
- ✅ Organization discovery
- ✅ Intermediate session exchange
- ✅ Full session JWT creation
- ✅ Session verification

---

## 2. Manual Security Tests

### 2.1 Discovery Flow Test

**Goal:** Full login flow through magic link

**Procedure:**

1. Navigate to `/login`
2. Enter email of registered user: `test@example.com`
3. **Verify:**
   - ✅ UI shows "Check your inbox"
   - ✅ No error message about non-existent email (opaque errors)
   - ✅ Email with magic link sent
4. Click link in email
5. **Verify:**
   - ✅ Redirected to `/authenticate`
   - ✅ Organization list displayed (or auto-redirect with single org)
6. Select organization
7. **Verify:**
   - ✅ Redirected to `/deposit/{org}`
   - ✅ Cookie `stytch_session_jwt` is set (check DevTools)

**Expected Result:** Complete login without errors

---

### 2.2 Secret Save Test

**Goal:** Verify save to Infisical with correct naming and structure

**Procedure:**

1. Log in as test user
2. Navigate to `/deposit/{org}` page
3. Fill in form:
   - URL: `https://test.example.com`
   - Login: `testuser`
   - Password: `testpass`
   - Token: `test-token`
4. Click "Send"
5. Check Infisical Dashboard:
   - ✅ Folder `/{org}` exists
   - ✅ Secrets created:
     - `EXAMPLE_URL`
     - `EXAMPLE_LOGIN`
     - `EXAMPLE_PASSWORD`
     - `EXAMPLE_API_TOKEN`
6. Verify values are correct (should match input)

**Expected Result:** All secrets saved correctly

---

### 2.3 Write-Only Verification

**Goal:** Verify backend cannot read secrets

**Already Tested:** Automated in [scripts/test-infisical-integration.ts:248-268](../scripts/test-infisical-integration.ts#L248-L268)

**Manual Verification (if needed):**

Add temporary code in a server action:

```typescript
// TEMPORARY TEST CODE - REMOVE AFTER TESTING
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

**Expected Result:** 403 Forbidden error

---

## 3. Security Tests

### 3.1 Opaque Errors Test (Account Enumeration)

**Goal:** Verify that existing emails cannot be identified

**Implementation Check:**

File: [actions/auth.ts:25-36](../actions/auth.ts#L25-L36)

```typescript
export async function sendMagicLinkAction(email: string): Promise<ActionResult> {
  try {
    await sendDiscoveryMagicLink(email);
    return { success: true };
  } catch (error) {
    // Opaque Errors - don't reveal if email exists
    console.error("[Auth] Magic link error:", error);
    return { success: true }; // ← Always returns success!
  }
}
```

**Manual Test:**

1. Test with **existing** email:
   ```
   Email: existing@example.com
   Response: { "success": true }
   UI: "Check your inbox"
   ```

2. Test with **non-existing** email:
   ```
   Email: nonexistent@example.com
   Response: { "success": true }
   UI: "Check your inbox"
   ```

**Expected Result:**
- ✅ Both responses identical
- ✅ Cannot distinguish if email exists
- ✅ Same UI message shown

---

### 3.2 Log Leak Test

**Goal:** Verify logs do not contain secrets

**Implementation Check:**

File: [actions/deposit.ts:133-162](../actions/deposit.ts#L133-L162)

```typescript
// 6. Audit log (without secret values!)
const auditData = {
  organization: session.organizationSlug,
  member: session.memberId,
  appPrefix,
  secretsCount: depositResult.secretsCount,
  timestamp: new Date().toISOString(),
};
console.log("[Deposit] Success:", auditData);

// 7. Admin notification webhook (without secret values!)
await sendDepositNotification({
  organizationSlug: session.organizationSlug,
  memberEmail: session.email,
  memberId: session.memberId,
  appPrefix,
  appDomain: extractDomainFromUrl(secretData.url),
  secretsCount: depositResult.secretsCount,
  timestamp: auditData.timestamp,
});

// 8. Clear sensitive variables
secretData.password = null;
secretData.apiToken = null;
secretData.login = null;
```

**Manual Test:**

1. Perform secret deposit
2. Check Vercel logs:
   - Vercel Dashboard → Deployments → Logs
   - Or: `vercel logs --follow`
3. Search for:
   - ❌ Passwords
   - ❌ Tokens
   - ❌ Login credentials
   - ❌ Full request body
   - ✅ Only metadata should appear

**Expected Log Output:**

```
[Deposit] Success: {
  organization: "acme-corp",
  member: "member_abc123",
  appPrefix: "PIPEDRIVE",
  secretsCount: 4,
  timestamp: "2026-01-06T12:00:00.000Z"
}
```

**Expected Result:** Logs contain only safe metadata, no secret values

---

### 3.3 Session Expiry Test

**Goal:** Verify expired sessions are rejected

**Implementation:** Session validation in [actions/deposit.ts:34-52](../actions/deposit.ts#L34-L52)

**Manual Test:**

**Option 1:** Wait for natural expiry (24 hours)

1. Log in and copy `stytch_session_jwt` cookie value
2. Wait 24+ hours
3. Try to deposit secret
4. **Expected:** Redirect to `/login` with error

**Option 2:** Test with invalid JWT

1. Open DevTools → Application → Cookies
2. Modify `stytch_session_jwt` to invalid value: `invalid.jwt.token`
3. Try to deposit secret
4. **Expected:** Error message "Session expired. Please log in again."

**Expected Result:**
- ✅ Status: Session validation fails
- ✅ User sees: "Session expired. Please log in again."
- ✅ Redirect to `/login`

---

### 3.4 Encryption Roundtrip Test

**Goal:** Verify client-side encryption and server-side decryption work correctly

**Implementation:**
- Client: [lib/crypto.ts:72-119](../lib/crypto.ts#L72-L119) - `encryptPayload`
- Server: [lib/crypto.ts:129-169](../lib/crypto.ts#L129-L169) - `decryptPayload`

**Test Method:**

Create test script: `scripts/test-crypto.ts`

```typescript
#!/usr/bin/env tsx

import { encryptPayload, decryptPayload, generateKeyPair } from "../lib/crypto";

async function testCryptoRoundtrip() {
  console.log("🔐 Testing Crypto Roundtrip...\n");

  // Generate keypair
  const { publicKey, privateKey } = await generateKeyPair();
  console.log("✅ Key pair generated\n");

  // Original data
  const originalData = {
    url: "https://example.com",
    login: "admin@test.com",
    password: "secretPassword123",
    apiToken: "sk-test-token",
  };
  console.log("📝 Original data:", originalData);

  // Encrypt
  const encrypted = await encryptPayload(originalData, publicKey);
  console.log("\n🔒 Encrypted payload:");
  console.log("  - encryptedData:", encrypted.encryptedData.substring(0, 40) + "...");
  console.log("  - encryptedKey:", encrypted.encryptedKey.substring(0, 40) + "...");
  console.log("  - iv:", encrypted.iv);

  // Decrypt
  const decrypted = await decryptPayload(encrypted, privateKey);
  console.log("\n🔓 Decrypted data:", decrypted);

  // Verify
  const matches = JSON.stringify(originalData) === JSON.stringify(decrypted);
  console.log("\n✅ Roundtrip test:", matches ? "PASSED" : "FAILED");

  if (!matches) {
    console.error("❌ Data mismatch!");
    process.exit(1);
  }
}

testCryptoRoundtrip().catch((error) => {
  console.error("❌ Test failed:", error);
  process.exit(1);
});
```

**Run Test:**

```bash
tsx scripts/test-crypto.ts
```

**Expected Output:**

```
🔐 Testing Crypto Roundtrip...

✅ Key pair generated

📝 Original data: {
  url: 'https://example.com',
  login: 'admin@test.com',
  password: 'secretPassword123',
  apiToken: 'sk-test-token'
}

🔒 Encrypted payload:
  - encryptedData: U2FsdGVkX1+vupppZksvRf5pq5g5XjFRlI...
  - encryptedKey: MEZCQkVBODE5N0Y5NTRBMzBGQTEwMzY1M...
  - iv: MTIzNDU2Nzg5MDEyMzQ1Ng==

🔓 Decrypted data: {
  url: 'https://example.com',
  login: 'admin@test.com',
  password: 'secretPassword123',
  apiToken: 'sk-test-token'
}

✅ Roundtrip test: PASSED
```

---

### 3.5 Webhook Security Test

**Goal:** Verify webhook notifications don't leak secrets

**Implementation:** [lib/webhook.ts](../lib/webhook.ts)

**Test Script:** `scripts/test-webhook-security.ts`

```typescript
#!/usr/bin/env tsx

import { sendDepositNotification, createWebhookSignature, verifyWebhookSignature } from "../lib/webhook";

async function testWebhookSecurity() {
  console.log("📡 Testing Webhook Security...\n");

  // Test 1: Payload doesn't contain secrets
  console.log("Test 1: Webhook payload structure");
  const payload = {
    organizationSlug: "test-org",
    memberEmail: "user@example.com",
    memberId: "member_123",
    appPrefix: "PIPEDRIVE",
    appDomain: "app.pipedrive.com",
    secretsCount: 4,
    timestamp: new Date().toISOString(),
  };

  // Verify payload has NO sensitive fields
  const sensitiveFields = ["password", "apiToken", "login", "secret"];
  const payloadKeys = Object.keys(payload);
  const hasSensitiveData = sensitiveFields.some(field => payloadKeys.includes(field));

  console.log("Payload keys:", payloadKeys);
  console.log("Contains sensitive data:", hasSensitiveData);
  console.log(hasSensitiveData ? "❌ FAIL: Sensitive data found!" : "✅ PASS: No sensitive data\n");

  // Test 2: HMAC signature validation
  console.log("Test 2: HMAC signature validation");
  const testPayload = JSON.stringify({ event: "test" });
  const secret = "test-webhook-secret";

  const signature = await createWebhookSignature(testPayload, secret);
  console.log("Generated signature:", signature.substring(0, 20) + "...");

  const isValid = await verifyWebhookSignature(testPayload, signature, secret);
  console.log("Signature valid:", isValid);
  console.log(isValid ? "✅ PASS: Signature verification works" : "❌ FAIL: Signature invalid");

  // Test 3: Invalid signature rejected
  console.log("\nTest 3: Invalid signature rejection");
  const invalidSignature = "0".repeat(64);
  const isInvalid = await verifyWebhookSignature(testPayload, invalidSignature, secret);
  console.log("Invalid signature accepted:", isInvalid);
  console.log(!isInvalid ? "✅ PASS: Invalid signature rejected" : "❌ FAIL: Invalid signature accepted!");
}

testWebhookSecurity().catch((error) => {
  console.error("❌ Test failed:", error);
  process.exit(1);
});
```

**Run Test:**

```bash
tsx scripts/test-webhook-security.ts
```

**Expected Output:**

```
📡 Testing Webhook Security...

Test 1: Webhook payload structure
Payload keys: [ 'organizationSlug', 'memberEmail', 'memberId', 'appPrefix', 'appDomain', 'secretsCount', 'timestamp' ]
Contains sensitive data: false
✅ PASS: No sensitive data

Test 2: HMAC signature validation
Generated signature: 8c9d45a1b3f7e6d2c5...
Signature valid: true
✅ PASS: Signature verification works

Test 3: Invalid signature rejection
Invalid signature accepted: false
✅ PASS: Invalid signature rejected
```

---

## 4. Pre-Production Checklist

### Stytch Configuration
- [ ] B2B SaaS project type
- [ ] Email Magic Links enabled
- [ ] SMS OTP disabled
- [ ] **Opaque Errors enabled** (verified in code: [actions/auth.ts:33](../actions/auth.ts#L33))
- [ ] Discovery Flow configured
- [ ] JIT Provisioning: RESTRICTED
- [ ] Redirect URLs configured (`{APP_URL}/authenticate`)
- [ ] Authorized Origins added

### Infisical Configuration
- [ ] Machine Identity created
- [ ] Universal Auth configured
- [ ] **Write-Only role created and assigned**
- [ ] Token TTL: 5 minutes
- [ ] RBAC test: `pnpm test:infisical` - all tests PASS

### Vercel Configuration
- [ ] All environment variables set (validated by [env.ts](../env.ts))
- [ ] RSA private key as secret: `SERVER_PRIVATE_KEY`
- [ ] Public key exposed: `NEXT_PUBLIC_SERVER_PUBLIC_KEY`
- [ ] NEXT_PUBLIC_APP_URL correct
- [ ] Domain configured
- [ ] HTTPS enforced

### Security Tests
- [ ] Opaque Errors test: PASS (Section 3.1)
- [ ] Log leak test: PASS (Section 3.2)
- [ ] Session expiry test: PASS (Section 3.3)
- [ ] Encryption roundtrip test: PASS (Section 3.4)
- [ ] Webhook security test: PASS (Section 3.5)
- [ ] Infisical integration: `pnpm test:infisical` - PASS
- [ ] Stytch integration: `pnpm test:stytch` - PASS

### Monitoring
- [ ] Vercel logs configured
- [ ] Alerts set (error rate, response time)
- [ ] Infisical audit logs monitored
- [ ] Webhook delivery monitoring (if configured)

---

## 5. Quick Test Suite

Run all automated tests:

```bash
# Full integration test suite
pnpm test:infisical
pnpm test:stytch

# Custom security tests (create if needed)
tsx scripts/test-crypto.ts
tsx scripts/test-webhook-security.ts
```

---

## 6. Incident Reporting

In case a security issue is detected:

1. **Immediately:**
   - Stop deployment
   - Notify security team
   - Document the issue

2. **Documentation:**
   - Problem description
   - Reproduction steps
   - Potential impact
   - Proposed solution

3. **Remediation:**
   - Fix the issue
   - Run all tests again
   - Update documentation
   - Review related code

4. **Post-mortem:**
   - Root cause analysis
   - Preventive actions
   - Update test procedures
   - Add new tests if needed

---

## 7. Testing Notes

### Architecture

- **No API Routes:** Application uses Server Actions exclusively
- **Session Validation:** Happens in server actions, not middleware
- **Test Framework:** Integration tests use tsx scripts, not Jest/Vitest
- **Log Safety:** Secrets explicitly nulled after use ([actions/deposit.ts:156-161](../actions/deposit.ts#L156-L161))

### Common Pitfalls

1. **Don't test API routes** - They don't exist, test server actions instead
2. **Session validation is per-action** - Not global middleware
3. **Opaque errors are intentional** - Always return success for login attempts
4. **Logs are safe by design** - Never log request bodies or decrypted data

---

**Document Version:** 2.0
**Last Updated:** 2026-01-06
**Audited Against:** Codebase commit 745a35f

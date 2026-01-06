# Stytch B2B Testing Guide

**Last Updated:** 2026-01-06

This document describes the comprehensive testing strategy for verifying the Stytch B2B authentication configuration.

## Test Categories

### 1. Configuration Validation Tests

These tests verify that all required environment variables and configuration settings are properly set.

**Test Cases:**

- Environment variables validation (PROJECT_ID, SECRET, PUBLIC_TOKEN)
- Stytch client initialization
- Project type verification (B2B vs Consumer)

### 2. Authentication Method Tests

Verify that the correct authentication methods are enabled/disabled.

**Test Cases:**

- Email Magic Links are enabled
- Discovery Flow is configured
- SMS OTP is disabled (critical security requirement)
- OAuth configuration (if enabled)

### 3. Discovery Flow Tests

Test the complete Discovery Flow authentication process.

**Test Cases:**

- Send discovery magic link to valid email
- Authenticate discovery magic link token
- List discovered organizations
- Exchange intermediate session for full session
- Session JWT validation
- Invalid/expired token rejection
- Invalid organization ID rejection

### 4. Session Management Tests

Verify session creation, validation, and expiration.

**Test Cases:**

- Session cookie is set with correct attributes (httpOnly, secure, sameSite)
- Session JWT contains correct member and organization data
- Session verification with valid JWT
- Session verification fails with invalid JWT
- Session verification fails with expired JWT
- Logout clears session cookie

### 5. Opaque Errors Tests

Verify that authentication errors don't reveal if an email exists (prevents account enumeration).

**Test Cases:**

- Non-existent email returns success (opaque error)
- Invalid email format returns success (opaque error)
- No indication whether email is registered

### 6. Security Configuration Tests

Verify critical security settings are properly configured.

**Test Cases:**

- Opaque Error Mode is enabled (built-in for discovery flows)
- JIT Provisioning is set to RESTRICTED per organization
- Allowed domains are configured (no public domains like gmail.com)
- Redirect URLs are properly configured
- Authorized Origins are set

### 7. Integration Tests

End-to-end tests simulating real user flows.

**Test Cases:**

- Complete login flow: Send link → Authenticate → Select org → Create session
- Multi-organization user flow
- Single organization auto-login
- Unauthorized organization access prevention

## Running Automated Tests

### Execute Test Suite

Run the automated test suite:

```bash
pnpm test:stytch
```

This executes `scripts/test-stytch-integration.ts` which performs:

- Environment validation
- Discovery flow authentication
- Session management
- Error handling

### Understanding Test Results

**Success Criteria:**

- All automated tests should pass with green status
- Expected failures for negative test cases (invalid tokens, etc.)
- No skipped tests due to configuration issues

**Common Test Issues:**

#### Issue: "Environment variables not set"

**Solution:** Copy `.env.local.example` to `.env.local` and configure Stytch credentials

#### Issue: "Discovery authentication failed"

**Solution:** Verify Discovery Flow is enabled in Stytch Dashboard (enabled by default for B2B projects)

#### Issue: "Organization not found"

**Solution:** Ensure test user has at least one organization assigned in Stytch

#### Issue: "Invalid redirect URL"

**Solution:** Add the redirect URL to authorized list in Stytch Dashboard

#### Issue: "billing_not_verified_for_email"

**Solution:** Development accounts can only send emails to addresses from the same domain as your Stytch account. Either:

1. Use an email from your Stytch account domain for testing
2. Verify billing in Stytch Dashboard for production use
3. Contact Stytch support to enable test emails

## Manual Verification Checklist

Some configuration settings must be verified manually in the Stytch Dashboard.

**Environment:** □ Development  □ Production

---

### 1. Project Configuration

**Project Type:**

- [ ] Log in to [Stytch Dashboard](https://stytch.com/dashboard)
- [ ] Navigate to **Project Settings** → **General**
- [ ] Verify project type is **B2B SaaS** (NOT Consumer)
- [ ] Project name matches expected value

---

### 2. API Credentials

**Credentials Verification:**

- [ ] Navigate to **API Keys** section
- [ ] Copy `STYTCH_PROJECT_ID` and verify it's in `.env.local`
- [ ] Copy `STYTCH_SECRET` and verify it's in `.env.local`
- [ ] Copy `NEXT_PUBLIC_STYTCH_PUBLIC_TOKEN` and verify it's in `.env.local`

**Format Check:**

- [ ] `STYTCH_PROJECT_ID` starts with `project-`
- [ ] `STYTCH_SECRET` starts with `secret-`
- [ ] `NEXT_PUBLIC_STYTCH_PUBLIC_TOKEN` starts with `public-token-`

---

### 3. Email Magic Links

**Default Configuration:**

- [ ] Email Magic Links are **enabled by default** for B2B projects
- [ ] Verify redirect URLs are configured in `Configuration → Redirect URLs`

**Email Template:**

- [ ] Navigate to **Branding**
- [ ] Verify email template exists
- [ ] Template includes `{{magic_link}}` variable
- [ ] Template includes `{{expiration_minutes}}` variable
- [ ] Template is customized for secure credential transfer context

---

### 4. Discovery Flow

**Built-in Feature:**

- [ ] Discovery Flow is **enabled by default** for B2B projects
- [ ] No manual configuration needed

**Redirect URL Configuration:**

- [ ] Navigate to **Configuration → Redirect URLs**
- [ ] Verify discovery redirect URL configured:
  - Development: `http://localhost:3000/authenticate`
  - Production: `https://your-domain.com/authenticate`

**Test Discovery Flow:**

- [ ] Send discovery magic link to test email
- [ ] Click link in email
- [ ] Verify redirect to correct URL
- [ ] Organization selection screen appears (if multi-org user)

---

### 5. Organization Settings

**Organizations Created:**

- [ ] Navigate to **Management → Organizations**
- [ ] Verify all client organizations are created

**Per-Organization Security Settings (via API/SDK):**

For **each organization**, verify the following settings are configured:

- [ ] `email_jit_provisioning` is set to **RESTRICTED**
- [ ] `email_allowed_domains` contains only approved corporate domains
- [ ] NO public domains (gmail.com, outlook.com, yahoo.com, etc.)
- [ ] `mfa_methods` set to **RESTRICTED**
- [ ] `allowed_mfa_methods` includes only `["totp"]` (SMS OTP excluded)
- [ ] `auth_methods` configured appropriately (e.g., `["magic_link"]`)

**⚠️ CRITICAL:** These settings are **per-organization**, not global. Each client organization must be configured separately.

---

### 6. SMS OTP Verification

**Critical Security Requirement:**

- [ ] Verify `allowed_mfa_methods` for each organization does NOT include `"sms_otp"`
- [ ] ⚠️ **CRITICAL:** SMS OTP poses Toll Fraud risk - must remain disabled

**Verification Method:**

```bash
# Check organization settings via API
curl --request GET \
  --url https://test.stytch.com/v1/b2b/organizations/{ORGANIZATION_ID} \
  -u 'PROJECT_ID:SECRET'
```

Look for: `"allowed_mfa_methods": ["totp"]` (should NOT include "sms_otp")

---

### 7. OAuth Configuration (Optional)

**If OAuth is enabled:**

- [ ] Navigate to **Configuration → OAuth**
- [ ] Google OAuth status: □ Enabled  □ Disabled
- [ ] Microsoft OAuth status: □ Enabled  □ Disabled
- [ ] If enabled, OAuth credentials are configured
- [ ] Organizations have `"oauth"` in `allowed_auth_methods` if they should use OAuth

---

### 8. Redirect URLs

**Authorized Redirect URLs:**

- [ ] Navigate to **Configuration → Redirect URLs**
- [ ] All necessary redirect URLs are configured

**Development URLs:**

- [ ] `http://localhost:3000/authenticate`
- [ ] `http://localhost:3000/dashboard`

**Production URLs:**

- [ ] `https://your-domain.com/authenticate`
- [ ] `https://your-domain.com/dashboard`
- [ ] All production URLs use HTTPS (no HTTP)
- [ ] No localhost URLs in production list

---

### 9. Opaque Errors

**Built-in Behavior:**

- [ ] Opaque error handling is **built-in** for Discovery Flow
- [ ] No manual configuration needed
- [ ] Test: Login with non-existent email returns generic success message
- [ ] Test: No difference in response time between valid/invalid emails

**Why Important:** Prevents account enumeration attacks

---

### 10. Session Configuration

**Session Settings:**

- [ ] Navigate to **Project Settings** → **Sessions** (if available)
- [ ] Session duration: recommended 24 hours
- [ ] Session token type: **JWT**

---

### 11. Functional Testing

**Automated Tests:**

- [ ] Run automated tests: `pnpm test:stytch`
- [ ] All automated tests pass

**Manual Flow Test:**

1. [ ] Navigate to login page
2. [ ] Enter test email address
3. [ ] Receive magic link email (check spam if needed)
4. [ ] Click magic link
5. [ ] Redirected to authenticate page
6. [ ] Organization selection appears (if multi-org)
7. [ ] Select organization
8. [ ] Redirected to dashboard
9. [ ] Session active and valid
10. [ ] Logout works correctly

---

### 12. Security Audit

**Security Best Practices Review:**

- [ ] All secrets stored in environment variables (not in code)
- [ ] Environment variables loaded correctly in all environments
- [ ] No credentials committed to version control
- [ ] `.env.local` is in `.gitignore`
- [ ] Production and development use separate Stytch projects
- [ ] Access to Stytch Dashboard limited to authorized personnel

**Access Control:**

- [ ] Team members with dashboard access documented
- [ ] Two-factor authentication enabled for dashboard access
- [ ] API keys rotated regularly

---

### 13. Documentation & Compliance

**Documentation Check:**

- [ ] Setup documentation is up to date (STYTCH_SETUP.md)
- [ ] Test documentation exists (STYTCH_TESTING.md)
- [ ] Environment variables documented
- [ ] Runbook exists for common issues
- [ ] Security incident response plan documented

**Compliance & Audit Trail:**

- [ ] Configuration screenshots saved
- [ ] This checklist completed and filed
- [ ] Changes logged in development_log.md
- [ ] Security review completed

---

## Security Testing

### Attack Scenarios to Test

#### 1. Account Enumeration Prevention

- Try to log in with non-existent email → Should return success (opaque)
- Try to log in with invalid email format → Should return success (opaque)
- Response time should be consistent regardless of email existence

#### 2. Session Security

- Attempt to use expired JWT → Should be rejected
- Attempt to use JWT for wrong organization → Should be rejected
- Attempt to forge JWT → Should be rejected

#### 3. Toll Fraud Prevention

- Verify SMS OTP is disabled via API check
- Ensure no SMS-based authentication methods are available in any organization

#### 4. JIT Provisioning Security

- Attempt to provision user with non-allowed domain → Should be rejected
- Verify public domains (gmail.com, etc.) are not in allowed list
- Test that only corporate domain users can auto-provision

## Continuous Monitoring

### Production Health Checks

Monitor these metrics in production:

- **Authentication Success Rate**: Should be >95%
- **Discovery Flow Completion**: Track users who complete org selection
- **Session Duration**: Monitor average session length
- **Failed Authentication Attempts**: Alert on unusual spikes
- **Magic Link Expiration Rate**: Track how many links expire unused

### Alert Triggers

Set up alerts for:

- Authentication error rate >5%
- Unusual number of failed login attempts from single IP
- Session validation errors
- Stytch API errors or downtime

## Compliance & Audit

### Documentation for Audit

Maintain records of:

- Stytch configuration screenshots (security settings)
- Test execution results (automated and manual)
- Security review dates
- Configuration change history

### Regular Review Schedule

- **Monthly**: Review allowed domains for JIT provisioning
- **Quarterly**: Audit email templates and user flows
- **Annually**: Complete security configuration review
- **On Incident**: Review and update security settings

## Troubleshooting Common Issues

### Problem: Magic link not received

**Possible Causes:**

- Email in spam folder
- Incorrect email address
- Billing not verified (development accounts)

**Solutions:**

1. Check spam/junk folder
2. Verify email address is correct
3. For development accounts, use email from same domain as Stytch account
4. Verify billing in Stytch Dashboard for production

### Problem: "Organization not found"

**Possible Causes:**

- Discovery Flow misconfigured (unlikely - enabled by default)
- User not a member of any organization

**Solutions:**

1. Create organization via Dashboard → Management → Organizations
2. Add user as member
3. Verify JIT provisioning settings

### Problem: "Invalid redirect URL"

**Possible Causes:**

- URL not in allowed list
- Typo in URL
- Protocol mismatch (http vs https)

**Solutions:**

1. Add URL to Configuration → Redirect URLs
2. Verify exact URL match (including protocol)
3. Check for trailing slashes

### Problem: Authentication fails silently

**Possible Causes:**

- Wrong environment variables
- Stytch API issues
- Network connectivity

**Solutions:**

1. Verify credentials in `.env.local`
2. Check Stytch Dashboard → Activity for errors
3. Test network connectivity to Stytch API
4. Review application logs

### Problem: CORS errors

**Possible Causes:**

- Origin not in authorized list
- Protocol mismatch

**Solutions:**

1. Add origin to authorized list
2. Verify protocol matches (http/https)
3. Check for trailing slashes in origin URLs

## Quick Reference

### Test Commands

```bash
# Run Stytch tests
pnpm test:stytch

# Run Infisical tests
pnpm test:infisical

# Start development server
pnpm dev

# Build for production
pnpm build
```

### Emergency Contacts

- **Stytch Support:** support@stytch.com
- [Stytch B2B Documentation](https://stytch.com/docs/b2b)
- [Stytch Dashboard](https://stytch.com/dashboard)

### Related Documentation

- [STYTCH_SETUP.md](./STYTCH_SETUP.md) - Complete configuration guide
- [SECURITY_TESTS.md](./SECURITY_TESTS.md) - Security testing procedures
- [PRD.md](./PRD.md) - Complete product requirements

## Success Criteria

Your Stytch configuration is ready for production when:

- ✅ All automated tests pass (`pnpm test:stytch`)
- ✅ Manual checklist completed with all items verified
- ✅ Full authentication flow tested manually and working
- ✅ SMS OTP confirmed disabled for all organizations
- ✅ Opaque Error behavior confirmed (built-in for discovery)
- ✅ JIT Provisioning confirmed set to RESTRICTED for all organizations
- ✅ Email templates customized and tested
- ✅ Production Stytch project created (separate from development)
- ✅ Production URLs configured (HTTPS only)
- ✅ Billing verified (for production project)

# Stytch Configuration Tests

This document describes the comprehensive testing strategy for verifying the Stytch B2B authentication configuration according to [STYTCH_SETUP.md](./STYTCH_SETUP.md).

## Test Categories

### 1. Configuration Validation Tests

These tests verify that all required environment variables and configuration settings are properly set.

**Test Cases:**
- ✅ Environment variables validation (PROJECT_ID, SECRET, PUBLIC_TOKEN)
- ✅ Stytch client initialization
- ✅ Project type verification (B2B vs Consumer)

### 2. Authentication Method Tests

Verify that the correct authentication methods are enabled/disabled.

**Test Cases:**
- ✅ Email Magic Links are enabled
- ✅ Discovery Flow is configured
- ⚠️ SMS OTP is disabled (critical security requirement)
- ⚠️ OAuth configuration (if enabled)

### 3. Discovery Flow Tests

Test the complete Discovery Flow authentication process.

**Test Cases:**
- ✅ Send discovery magic link to valid email
- ✅ Authenticate discovery magic link token
- ✅ List discovered organizations
- ✅ Exchange intermediate session for full session
- ✅ Session JWT validation
- ❌ Invalid/expired token rejection
- ❌ Invalid organization ID rejection

### 4. Session Management Tests

Verify session creation, validation, and expiration.

**Test Cases:**
- ✅ Session cookie is set with correct attributes (httpOnly, secure, sameSite)
- ✅ Session JWT contains correct member and organization data
- ✅ Session verification with valid JWT
- ❌ Session verification fails with invalid JWT
- ❌ Session verification fails with expired JWT
- ✅ Logout clears session cookie

### 5. Opaque Errors Tests

Verify that authentication errors don't reveal if an email exists (prevents account enumeration).

**Test Cases:**
- ✅ Non-existent email returns success (opaque error)
- ✅ Invalid email format returns success (opaque error)
- ✅ No indication whether email is registered

### 6. Security Configuration Tests

Verify critical security settings are properly configured.

**Test Cases:**
- ⚠️ Opaque Error Mode is enabled in Stytch Dashboard
- ⚠️ JIT Provisioning is set to RESTRICTED
- ⚠️ Allowed domains are configured (no public domains like gmail.com)
- ⚠️ Redirect URLs are properly configured
- ⚠️ Authorized Origins are set

### 7. Integration Tests

End-to-end tests simulating real user flows.

**Test Cases:**
- ✅ Complete login flow: Send link → Authenticate → Select org → Create session
- ✅ Multi-organization user flow
- ✅ Single organization auto-login
- ❌ Unauthorized organization access prevention

## Test Execution

### Automated Tests

Run the automated test suite:

```bash
pnpm test:stytch
```

This executes `scripts/test-stytch-integration.ts` which performs:
- Environment validation
- Discovery flow authentication
- Session management
- Error handling

### Manual Verification Checklist

Some configuration settings must be verified manually in the Stytch Dashboard:

#### Dashboard Configuration Checks

1. **Project Settings → Security**
   - [ ] Opaque Error Mode is enabled

2. **Authentication → Email Magic Links**
   - [ ] Email Magic Links are enabled
   - [ ] Login expiration: 30 minutes
   - [ ] Signup expiration: 60 minutes

3. **Authentication → SMS OTP**
   - [ ] SMS OTP is DISABLED (critical for Toll Fraud prevention)

4. **Authentication → Discovery**
   - [ ] Discovery Flow is enabled
   - [ ] Discovery Redirect URL matches environment:
     - Development: `http://localhost:3000/authenticate`
     - Production: `https://your-domain.com/authenticate`

5. **Organizations → Settings**
   - [ ] JIT Provisioning: RESTRICTED
   - [ ] Allowed domains configured (no gmail.com, outlook.com)

6. **Project Settings → Redirect URLs**
   - [ ] All redirect URLs are configured
   - [ ] No localhost URLs in production
   - [ ] HTTPS enforced for production URLs

7. **Project Settings → SDK Configuration**
   - [ ] Authorized Origins match deployment environments

8. **Emails → Templates**
   - [ ] Email templates customized for secure credential transfer context
   - [ ] Magic link variables included
   - [ ] Professional branding applied

## Test Results Interpretation

### Success Criteria

All automated tests should pass with:
- ✅ Green status for positive test cases
- ❌ Expected failures for negative test cases (invalid tokens, etc.)
- No skipped tests due to configuration issues

### Common Issues

#### Issue: "Environment variables not set"
**Solution:** Copy `.env.local.example` to `.env.local` and configure Stytch credentials

#### Issue: "Discovery authentication failed"
**Solution:** Verify Discovery Flow is enabled in Stytch Dashboard

#### Issue: "Organization not found"
**Solution:** Ensure test user has at least one organization assigned in Stytch

#### Issue: "Invalid redirect URL"
**Solution:** Add the redirect URL to authorized list in Stytch Dashboard

## Security Testing

### Attack Scenarios to Test

1. **Account Enumeration Prevention**
   - Try to log in with non-existent email → Should return success (opaque)
   - Try to log in with invalid email format → Should return success (opaque)
   - Response time should be consistent regardless of email existence

2. **Session Security**
   - Attempt to use expired JWT → Should be rejected
   - Attempt to use JWT for wrong organization → Should be rejected
   - Attempt to forge JWT → Should be rejected

3. **Toll Fraud Prevention**
   - Verify SMS OTP is disabled in dashboard
   - Ensure no SMS-based authentication methods are available

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

## References

- [Stytch B2B Setup Guide](./STYTCH_SETUP.md)
- [Stytch B2B Documentation](https://stytch.com/docs/b2b)
- [Security Tests Overview](./SECURITY_TESTS.md)

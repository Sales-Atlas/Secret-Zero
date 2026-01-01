# Infisical Integration Testing Guide

This document describes the Infisical integration test suite and how to run it.

## Overview

The integration test suite validates the complete Infisical integration including:

- **Authentication**: Universal Auth login with Machine Identity
- **Write-Only Permissions**: Verifies that read operations are blocked (403)
- **Secret Creation**: Tests secret creation with proper naming conventions
- **Folder Operations**: Validates organization folder structure
- **Duplicate Handling**: Tests timestamp suffix generation for duplicate secrets
- **Full Deposit Flow**: End-to-end test of the complete secret deposit process

## Prerequisites

Before running the tests, ensure you have:

1. **Infisical Project Configured**: Follow [INFISICAL_SETUP.md](INFISICAL_SETUP.md) to set up your project
2. **Machine Identity Created**: With write-only permissions (Create allowed, Read/Update/Delete denied)
3. **Environment Variables Set**: All required Infisical credentials in `.env.local`

### Required Environment Variables

```env
INFISICAL_CLIENT_ID=xxx-xxx-xxx
INFISICAL_CLIENT_SECRET=xxx-xxx-xxx
INFISICAL_PROJECT_ID=xxx-xxx-xxx
INFISICAL_SITE_URL=https://app.infisical.com
INFISICAL_ENVIRONMENT=prod
```

## Running the Tests

### Run All Tests

```bash
pnpm test:infisical
```

### Run with tsx Directly

```bash
pnpm tsx scripts/test-infisical-integration.ts
```

## Test Suite Details

### 1. Configuration Tests

**Test: Environment variables are set**
- Validates all required environment variables are present
- Ensures configuration is complete before running other tests

### 2. Authentication Tests

**Test: Universal Auth login succeeds**
- Creates Infisical SDK client
- Authenticates with Machine Identity using Universal Auth
- Validates successful authentication

**Test: Authentication fails with invalid credentials**
- Attempts login with invalid credentials
- Validates proper error handling
- Expected to fail (negative test)

### 3. Permission Tests

**Test: Read permissions are blocked (403 Forbidden)**
- Attempts to list secrets from the vault
- Validates write-only role configuration
- Expected to fail with 403 error (negative test)
- **Critical security test**: Ensures application cannot read secrets

**Test: Create secret succeeds (write-only)**
- Creates a test secret in a new organization folder
- Validates that write operations are allowed
- Uses unique timestamp-based folder names

### 4. Secret Operation Tests

**Test: Duplicate secret gets timestamp suffix**
- Creates a secret
- Attempts to create duplicate with same key
- Validates automatic timestamp suffix generation
- Verifies keys are different

**Test: Secret path format validation**
- Tests organization slug in path (`/{orgSlug}`)
- Validates proper folder structure

**Test: Secret naming follows APPNAME_FIELD pattern**
- Tests naming convention: `{APPNAME}_URL`, `{APPNAME}_API_TOKEN`, etc.
- Validates uppercase APPNAME extraction
- Ensures consistency across secret types

### 5. Full Integration Tests

**Test: Full deposit flow with all secret types**
- Creates secrets for URL, login, password, and API token
- Validates all 4 secrets are created
- Checks proper key naming for each field
- Simulates complete user deposit flow

**Test: Partial deposit with only URL**
- Creates only the required URL secret
- Validates optional fields are skipped
- Tests minimal deposit scenario

## Expected Output

Successful test run example:

```
Infisical Integration Tests
Starting tests at 2025-01-01T14:30:00.000Z

============================================================
Configuration Tests
============================================================

✅ PASS Environment variables are set (15ms)

============================================================
Authentication Tests
============================================================

✅ PASS Universal Auth login succeeds (234ms)
✅ PASS Authentication fails with invalid credentials (89ms)

============================================================
Permission Tests
============================================================

✅ PASS Read permissions are blocked (403 Forbidden) (67ms)
✅ PASS Create secret succeeds (write-only) (123ms)

============================================================
Secret Operation Tests
============================================================

✅ PASS Duplicate secret gets timestamp suffix (189ms)
✅ PASS Secret path format validation (95ms)
✅ PASS Secret naming follows APPNAME_FIELD pattern (156ms)

============================================================
Full Integration Tests
============================================================

✅ PASS Full deposit flow with all secret types (298ms)
✅ PASS Partial deposit with only URL (87ms)

============================================================
Test Summary
============================================================

Total Tests: 10
Passed: 10
Failed: 0

Total Duration: 1353ms

ALL TESTS PASSED
```

## Interpreting Results

### All Tests Pass ✅
Your Infisical integration is correctly configured:
- Authentication is working
- Write-only permissions are properly set
- Secret creation follows naming conventions
- Duplicate handling works correctly

### Some Tests Fail ❌

**"Environment variables are set" fails**
- Check your `.env.local` file
- Ensure all required variables are present
- Copy values from Infisical dashboard

**"Universal Auth login succeeds" fails**
- Verify Client ID and Client Secret are correct
- Check if Machine Identity is enabled
- Ensure Universal Auth is configured

**"Read permissions are blocked" PASSES (should fail)**
- **CRITICAL SECURITY ISSUE**: Your Machine Identity can read secrets
- Review permission configuration in Infisical
- Follow [INFISICAL_SETUP.md](INFISICAL_SETUP.md#step-4-configure-write-only-permissions-critical) Step 4

**"Create secret succeeds" fails**
- Check if Create permission is allowed
- Verify environment and project ID are correct
- Review Machine Identity permissions

**"Duplicate secret gets timestamp suffix" fails**
- Check error messages for API issues
- Verify folder creation permissions
- Review timestamp suffix logic in [lib/infisical.ts](../lib/infisical.ts:60-69)

## Security Validation

The most critical test is:

**✅ Read permissions are blocked (403 Forbidden)**

This test validates the core security principle of Secret-Zero's write-only architecture. If this test PASSES instead of failing, it indicates a serious security misconfiguration.

### Why This Matters

1. **Write-Only Architecture**: The application should never be able to read secrets
2. **Log Leak Protection**: If secrets can be read, they could leak into Vercel logs
3. **Principle of Least Privilege**: Machine Identity should only have minimum required permissions

### If Read Test Fails to Fail

1. Go to Infisical dashboard
2. Navigate to your Machine Identity permissions
3. Ensure **Forbid** rule exists for "Read Value"
4. Verify the rule applies to your environment and path
5. Re-run the test suite

## Test Data Cleanup

The test suite creates test secrets with unique folder names:
- `test-org-{timestamp}` - Temporary test organizations
- Test secrets have comments indicating they are from integration tests

**Manual Cleanup** (optional):
1. Log in to Infisical dashboard
2. Go to your project → Secrets
3. Filter by comment: "Integration test"
4. Delete test folders/secrets if desired

**Note**: These test secrets do not affect production and can be safely left in the vault.

## Troubleshooting

### Network Issues

**Error**: "Connection refused" or timeout errors
- Check `INFISICAL_SITE_URL` is correct
- Verify network connectivity to Infisical
- Check firewall/proxy settings

### Permission Errors

**Error**: "Access denied" or "Unauthorized"
- Verify Machine Identity credentials
- Check if Machine Identity is enabled
- Review IP restrictions in Universal Auth

### Rate Limiting

**Error**: "Too many requests"
- Wait a few minutes and retry
- Check Infisical rate limits
- Consider adding delays between tests if needed

## Continuous Integration

To run these tests in CI/CD:

1. **Set environment variables** as secrets in your CI platform
2. **Run test command**: `pnpm test:infisical`
3. **Verify exit code**: 0 = success, 1 = failure

Example GitHub Actions:

```yaml
- name: Run Infisical Integration Tests
  env:
    INFISICAL_CLIENT_ID: ${{ secrets.INFISICAL_CLIENT_ID }}
    INFISICAL_CLIENT_SECRET: ${{ secrets.INFISICAL_CLIENT_SECRET }}
    INFISICAL_PROJECT_ID: ${{ secrets.INFISICAL_PROJECT_ID }}
    INFISICAL_SITE_URL: https://app.infisical.com
    INFISICAL_ENVIRONMENT: prod
  run: pnpm test:infisical
```

## Related Documentation

- [INFISICAL_SETUP.md](INFISICAL_SETUP.md) - Complete setup guide
- [SECURITY_TESTS.md](SECURITY_TESTS.md) - Additional security testing procedures
- [lib/infisical.ts](../lib/infisical.ts) - Infisical integration implementation

## Support

If you encounter issues:

1. Review this documentation
2. Check [INFISICAL_SETUP.md](INFISICAL_SETUP.md) for configuration steps
3. Verify all environment variables
4. Check Infisical dashboard for audit logs
5. Review error messages carefully

## Contributing

When modifying the Infisical integration:

1. Update tests to cover new functionality
2. Run full test suite before committing
3. Update this documentation if adding new tests
4. Ensure all tests pass locally

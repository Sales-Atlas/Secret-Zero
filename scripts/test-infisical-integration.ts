#!/usr/bin/env tsx

/**
 * Infisical Integration Tests
 *
 * Tests the complete Infisical integration including:
 * - Universal Auth authentication
 * - Write-only permissions validation
 * - Secret creation with proper naming
 * - Folder operations
 * - Duplicate handling with timestamp suffix
 *
 * Prerequisites:
 * - Infisical project configured per docs/INFISICAL_SETUP.md
 * - Environment variables set in .env.local
 * - Machine Identity with write-only permissions
 *
 * Usage:
 *   pnpm tsx scripts/test-infisical-integration.ts
 */

import { config } from 'dotenv';
import { InfisicalSDK } from '@infisical/sdk';
import { createSecret, depositSecrets, resetInfisicalClient, createFolder } from '../lib/infisical';

// Load environment variables from .env.local
config({ path: '.env.local' });

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  duration: number;
  skipped?: boolean;
  skipReason?: string;
}

class InfisicalIntegrationTester {
  private results: TestResult[] = [];
  private client: InfisicalSDK | null = null;
  private isAuthenticated = false;
  private prerequisitesFailed = false;

  /**
   * Logs a test section header
   */
  private logSection(title: string): void {
    console.log(`\n${colors.bright}${colors.cyan}${'='.repeat(60)}${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}${title}${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}${'='.repeat(60)}${colors.reset}\n`);
  }

  /**
   * Logs a test result
   */
  private logResult(result: TestResult): void {
    if (result.skipped) {
      const icon = '⏭️';
      const color = colors.yellow;
      const status = 'SKIP';
      console.log(`${icon} ${color}${status}${colors.reset} ${result.name}`);
      if (result.skipReason) {
        console.log(`   ${colors.yellow}Reason: ${result.skipReason}${colors.reset}`);
      }
      return;
    }

    const icon = result.passed ? '✅' : '❌';
    const color = result.passed ? colors.green : colors.red;
    const status = result.passed ? 'PASS' : 'FAIL';

    console.log(`${icon} ${color}${status}${colors.reset} ${result.name} (${result.duration}ms)`);

    if (result.error) {
      console.log(`   ${colors.red}Error: ${result.error}${colors.reset}`);
    }
  }

  /**
   * Skips a test with a reason
   */
  private skipTest(name: string, reason: string): void {
    const result: TestResult = {
      name,
      passed: false,
      duration: 0,
      skipped: true,
      skipReason: reason,
    };

    this.results.push(result);
    this.logResult(result);
  }

  /**
   * Runs a single test
   */
  private async runTest(
    name: string,
    testFn: () => Promise<void>,
    options: {
      shouldFail?: boolean;
      requiresAuth?: boolean;
      isPrerequisite?: boolean;
    } = {}
  ): Promise<void> {
    const { shouldFail = false, requiresAuth = false, isPrerequisite = false } = options;

    // Skip tests that require authentication if auth failed
    if (requiresAuth && !this.isAuthenticated) {
      this.skipTest(name, 'Skipped: Authentication prerequisite failed');
      return;
    }

    // Skip all tests if critical prerequisites failed
    if (this.prerequisitesFailed && !isPrerequisite) {
      this.skipTest(name, 'Skipped: Critical prerequisites failed');
      return;
    }

    const startTime = Date.now();

    try {
      await testFn();

      const result: TestResult = {
        name,
        passed: !shouldFail,
        duration: Date.now() - startTime,
      };

      if (shouldFail) {
        result.error = 'Expected test to fail but it passed';
      }

      this.results.push(result);
      this.logResult(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      const result: TestResult = {
        name,
        passed: shouldFail,
        error: shouldFail ? undefined : errorMessage,
        duration: Date.now() - startTime,
      };

      this.results.push(result);
      this.logResult(result);

      // Mark prerequisites as failed if this was a prerequisite test
      if (isPrerequisite && !shouldFail) {
        this.prerequisitesFailed = true;
      }
    }
  }

  /**
   * Helper method to set up a test organization folder
   * Reduces duplication across multiple test methods
   */
  private async withTestOrg(testFn: (orgSlug: string) => Promise<void>): Promise<void> {
    const testOrgSlug = `test-org-${Date.now()}`;
    await createFolder(`/${testOrgSlug}`);
    await testFn(testOrgSlug);
  }

  /**
   * Test 1: Environment Variables Validation
   */
  private async testEnvironmentVariables(): Promise<void> {
    await this.runTest(
      'Environment variables are set',
      async () => {
        const requiredVars = [
          'INFISICAL_CLIENT_ID',
          'INFISICAL_CLIENT_SECRET',
          'INFISICAL_PROJECT_ID',
          'INFISICAL_SITE_URL',
          'INFISICAL_ENVIRONMENT',
        ];

        const missing = requiredVars.filter(varName => !process.env[varName]);

        if (missing.length > 0) {
          throw new Error(`Missing environment variables: ${missing.join(', ')}`);
        }
      },
      { isPrerequisite: true }
    );
  }

  /**
   * Test 2: Universal Auth Authentication
   */
  private async testAuthentication(): Promise<void> {
    await this.runTest(
      'Universal Auth login succeeds',
      async () => {
        const siteUrl = process.env.INFISICAL_SITE_URL || 'https://app.infisical.com';

        this.client = new InfisicalSDK({ siteUrl });

        await this.client.auth().universalAuth.login({
          clientId: process.env.INFISICAL_CLIENT_ID!,
          clientSecret: process.env.INFISICAL_CLIENT_SECRET!,
        });

        this.isAuthenticated = true;
      },
      { isPrerequisite: true }
    );
  }

  /**
   * Test 3: Invalid Credentials
   */
  private async testInvalidCredentials(): Promise<void> {
    await this.runTest(
      'Authentication fails with invalid credentials',
      async () => {
        const siteUrl = process.env.INFISICAL_SITE_URL || 'https://app.infisical.com';
        const tempClient = new InfisicalSDK({ siteUrl });

        await tempClient.auth().universalAuth.login({
          clientId: 'invalid-client-id',
          clientSecret: 'invalid-client-secret',
        });
      },
      { shouldFail: true }
    );
  }

  /**
   * Test 4: Read Permissions (should be blocked)
   */
  private async testReadPermissionsBlocked(): Promise<void> {
    await this.runTest(
      'Read permissions are blocked (403 Forbidden)',
      async () => {
        if (!this.client || !this.isAuthenticated) {
          throw new Error('Client not authenticated');
        }

        const projectId = process.env.INFISICAL_PROJECT_ID!;
        const environment = process.env.INFISICAL_ENVIRONMENT || 'prod';

        // This should fail with 403
        await this.client.secrets().listSecrets({
          environment,
          projectId,
          secretPath: '/',
        });
      },
      { requiresAuth: true, shouldFail: true }
    );
  }

  /**
   * Test 5: Create Secret (write permission)
   */
  private async testCreateSecret(): Promise<void> {
    await this.runTest(
      'Create secret succeeds (write-only)',
      async () => {
        await this.withTestOrg(async (testOrgSlug) => {
          const secretKey = await createSecret({
            secretPath: `/${testOrgSlug}`,
            secretKey: 'TEST_SECRET',
            secretValue: 'test-value-123',
            secretComment: 'Integration test secret',
          });

          if (!secretKey) {
            throw new Error('Secret creation returned empty key');
          }
        });
      },
      { requiresAuth: true }
    );
  }

  /**
   * Test 6: Duplicate Secret Handling
   */
  private async testDuplicateSecretHandling(): Promise<void> {
    await this.runTest(
      'Duplicate secret gets timestamp suffix',
      async () => {
        await this.withTestOrg(async (testOrgSlug) => {
          // Create first secret
          const firstKey = await createSecret({
            secretPath: `/${testOrgSlug}`,
            secretKey: 'DUPLICATE_TEST',
            secretValue: 'first-value',
            secretComment: 'First secret',
          });

          // Try to create duplicate - should add timestamp suffix
          const secondKey = await createSecret({
            secretPath: `/${testOrgSlug}`,
            secretKey: 'DUPLICATE_TEST',
            secretValue: 'second-value',
            secretComment: 'Duplicate secret',
          });

          if (firstKey === secondKey) {
            throw new Error('Duplicate secret should have different key with timestamp suffix');
          }

          if (!secondKey.startsWith('DUPLICATE_TEST_')) {
            throw new Error(`Expected timestamp suffix, got: ${secondKey}`);
          }
        });
      },
      { requiresAuth: true }
    );
  }

  /**
   * Test 7: Full Deposit Flow
   */
  private async testFullDepositFlow(): Promise<void> {
    await this.runTest(
      'Full deposit flow with all secret types',
      async () => {
        await this.withTestOrg(async (testOrgSlug) => {
          const result = await depositSecrets(testOrgSlug, 'PIPEDRIVE', {
            url: 'https://app.pipedrive.com',
            login: 'test@example.com',
            password: 'test-password-123',
            apiToken: 'test-api-token-xyz',
          });

          if (result.secretsCount !== 4) {
            throw new Error(`Expected 4 secrets, got ${result.secretsCount}`);
          }

          const expectedKeys = [
            'PIPEDRIVE_URL',
            'PIPEDRIVE_LOGIN',
            'PIPEDRIVE_PASSWORD',
            'PIPEDRIVE_API_TOKEN',
          ];

          for (const key of expectedKeys) {
            if (!result.createdKeys.includes(key)) {
              throw new Error(`Missing expected key: ${key}`);
            }
          }
        });
      },
      { requiresAuth: true }
    );
  }

  /**
   * Test 8: Partial Deposit (only required fields)
   */
  private async testPartialDeposit(): Promise<void> {
    await this.runTest(
      'Partial deposit with only URL',
      async () => {
        await this.withTestOrg(async (testOrgSlug) => {
          const result = await depositSecrets(testOrgSlug, 'HUBSPOT', {
            url: 'https://app.hubspot.com',
          });

          if (result.secretsCount !== 1) {
            throw new Error(`Expected 1 secret, got ${result.secretsCount}`);
          }

          if (!result.createdKeys.includes('HUBSPOT_URL')) {
            throw new Error('Missing HUBSPOT_URL key');
          }
        });
      },
      { requiresAuth: true }
    );
  }

  /**
   * Test 9: Secret Path Validation (Positive Cases)
   */
  private async testSecretPathValidation(): Promise<void> {
    await this.runTest(
      'Valid single-level secret path succeeds',
      async () => {
        await this.withTestOrg(async (testOrgSlug) => {
          const secretKey = await createSecret({
            secretPath: `/${testOrgSlug}`,
            secretKey: 'PATH_TEST',
            secretValue: 'test-value',
            secretComment: 'Path validation test',
          });

          if (!secretKey) {
            throw new Error('Secret creation failed');
          }
        });
      },
      { requiresAuth: true }
    );
  }

  /**
   * Test 9a: Secret Path Validation (Negative Case - Nested Paths)
   */
  private async testNestedPathRejection(): Promise<void> {
    await this.runTest(
      'Nested folder paths are rejected with clear error',
      async () => {
        const nestedPath = '/parent/child';

        try {
          await createFolder(nestedPath);
          throw new Error('Expected createFolder to reject nested path');
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);

          // Verify error message is clear and informative
          if (!errorMessage.includes('Nested folder paths are not supported')) {
            throw new Error(`Expected clear error message about nested paths, got: ${errorMessage}`);
          }

          // Verify error mentions expected format
          if (!errorMessage.includes('Expected format:')) {
            throw new Error('Error message should explain expected format');
          }
        }
      },
      { requiresAuth: true }
    );
  }

  /**
   * Test 9b: Secret Path Validation (Negative Case - Invalid Formats)
   */
  private async testInvalidPathFormats(): Promise<void> {
    await this.runTest(
      'Invalid path formats are rejected gracefully',
      async () => {
        const invalidPaths = [
          '/org/sub/nested',      // Multiple levels
          '/org/sub',             // Two levels
          'no-leading-slash/sub', // No leading slash with nesting
        ];

        for (const invalidPath of invalidPaths) {
          try {
            await createFolder(invalidPath);
            throw new Error(`Path "${invalidPath}" should have been rejected`);
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);

            // All invalid nested paths should trigger the same validation error
            if (!errorMessage.includes('Nested folder paths are not supported')) {
              throw new Error(
                `Path "${invalidPath}" failed with unexpected error: ${errorMessage}`
              );
            }
          }
        }
      },
      { requiresAuth: true }
    );
  }

  /**
   * Test 9c: Secret Path Validation (Edge Cases)
   */
  private async testPathEdgeCases(): Promise<void> {
    await this.runTest(
      'Valid paths with special characters succeed',
      async () => {
        const validPaths = [
          '/org-with-dashes',
          '/org_with_underscores',
          '/org123',
        ];

        for (const validPath of validPaths) {
          try {
            await createFolder(validPath);
            // If folder creation succeeds or folder already exists, continue
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);

            // Ignore "already exists" errors (expected in tests)
            if (!errorMessage.includes('already exists')) {
              throw new Error(`Valid path "${validPath}" was incorrectly rejected: ${errorMessage}`);
            }
          }
        }
      },
      { requiresAuth: true }
    );
  }

  /**
   * Test 10: Secret Naming Convention
   */
  private async testSecretNamingConvention(): Promise<void> {
    await this.runTest(
      'Secret naming follows APPNAME_FIELD pattern',
      async () => {
        await this.withTestOrg(async (testOrgSlug) => {
          const result = await depositSecrets(testOrgSlug, 'SALESFORCE', {
            url: 'https://salesforce.com',
            apiToken: 'sf-token-123',
          });

          const expectedPattern = /^SALESFORCE_(URL|API_TOKEN)(_\d{8}_\d{6})?$/;

          for (const key of result.createdKeys) {
            if (!expectedPattern.test(key)) {
              throw new Error(`Key ${key} does not match expected pattern`);
            }
          }
        });
      },
      { requiresAuth: true }
    );
  }

  /**
   * Prints final test summary
   */
  private printSummary(): void {
    this.logSection('Test Summary');

    const passed = this.results.filter(r => !r.skipped && r.passed).length;
    const failed = this.results.filter(r => !r.skipped && !r.passed).length;
    const skipped = this.results.filter(r => r.skipped).length;
    const total = this.results.length;

    console.log(`Total Tests: ${total}`);
    console.log(`${colors.green}Passed: ${passed}${colors.reset}`);
    console.log(`${colors.red}Failed: ${failed}${colors.reset}`);
    if (skipped > 0) {
      console.log(`${colors.yellow}Skipped: ${skipped}${colors.reset}`);
    }

    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);
    console.log(`\nTotal Duration: ${totalDuration}ms`);

    if (failed > 0) {
      console.log(`\n${colors.red}${colors.bright}TESTS FAILED${colors.reset}`);
      process.exit(1);
    } else if (skipped > 0) {
      console.log(`\n${colors.yellow}${colors.bright}TESTS COMPLETED WITH SKIPS${colors.reset}`);
      console.log(`${colors.yellow}Some tests were skipped due to failed prerequisites${colors.reset}`);
      process.exit(1);
    } else {
      console.log(`\n${colors.green}${colors.bright}ALL TESTS PASSED${colors.reset}`);
    }
  }

  /**
   * Cleanup after tests
   */
  private cleanup(): void {
    resetInfisicalClient();
    this.client = null;
    this.isAuthenticated = false;
  }

  /**
   * Runs all integration tests
   */
  async runAll(): Promise<void> {
    console.log(`${colors.bright}${colors.blue}Infisical Integration Tests${colors.reset}`);
    console.log(`Starting tests at ${new Date().toISOString()}\n`);

    try {
      // Section 1: Configuration
      this.logSection('Configuration Tests');
      await this.testEnvironmentVariables();

      // Section 2: Authentication
      this.logSection('Authentication Tests');
      await this.testAuthentication();
      await this.testInvalidCredentials();

      // Section 3: Permissions
      this.logSection('Permission Tests');
      await this.testReadPermissionsBlocked();
      await this.testCreateSecret();

      // Section 4: Secret Operations
      this.logSection('Secret Operation Tests');
      await this.testDuplicateSecretHandling();
      await this.testSecretPathValidation();
      await this.testNestedPathRejection();
      await this.testInvalidPathFormats();
      await this.testPathEdgeCases();
      await this.testSecretNamingConvention();

      // Section 5: Integration Tests
      this.logSection('Full Integration Tests');
      await this.testFullDepositFlow();
      await this.testPartialDeposit();

      // Summary
      this.printSummary();
    } catch (error) {
      console.error(`\n${colors.red}Fatal error during test execution:${colors.reset}`);
      console.error(error);
      process.exit(1);
    } finally {
      this.cleanup();
    }
  }
}

// Run tests
const tester = new InfisicalIntegrationTester();
tester.runAll().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});

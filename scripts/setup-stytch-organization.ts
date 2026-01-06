#!/usr/bin/env tsx

/**
 * Stytch Organization Setup Script
 *
 * This script helps configure Stytch B2B organizations with the correct
 * security settings for the Secret-Zero application.
 *
 * Usage:
 *   # Create a new organization
 *   pnpm tsx scripts/setup-stytch-organization.ts create "Client Name"
 *
 *   # Configure an existing organization
 *   pnpm tsx scripts/setup-stytch-organization.ts configure organization-test-xxx-xxx
 *
 *   # List all organizations
 *   pnpm tsx scripts/setup-stytch-organization.ts list
 */

import { config } from 'dotenv';
import { B2BClient } from 'stytch';
import { Organization } from 'stytch';

// Load environment variables
config({ path: '.env.local' });

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

class StytchOrgSetup {
  private client: B2BClient;

  constructor() {
    const projectId = process.env.STYTCH_PROJECT_ID;
    const secret = process.env.STYTCH_SECRET;

    if (!projectId || !secret) {
      console.error(`${colors.red}Error: Missing Stytch credentials${colors.reset}`);
      console.error('Please set STYTCH_PROJECT_ID and STYTCH_SECRET in .env.local');
      process.exit(1);
    }

    this.client = new B2BClient({
      project_id: projectId,
      secret: secret,
    });
  }

  /**
   * Creates a new organization with secure defaults
   */
  async createOrganization(
    organizationName: string,
    allowedDomains: string[] = []
  ): Promise<void> {
    console.log(`\n${colors.cyan}Creating organization: ${organizationName}${colors.reset}\n`);

    try {
      // Generate slug from name
      const slug = organizationName
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

      const response = await this.client.organizations.create({
        organization_name: organizationName,
        organization_slug: slug,
        email_allowed_domains: allowedDomains,
        email_jit_provisioning: allowedDomains.length > 0 ? 'RESTRICTED' : 'NOT_ALLOWED',
        email_invites: allowedDomains.length > 0 ? 'RESTRICTED' : 'ALL_ALLOWED',
        mfa_methods: 'RESTRICTED',
        allowed_mfa_methods: ['totp'], // Exclude SMS OTP (Toll Fraud risk)
        auth_methods: 'RESTRICTED',
        allowed_auth_methods: ['magic_link'],
      });

      console.log(`${colors.green}✓ Organization created successfully${colors.reset}\n`);
      this.displayOrganization(response.organization);

      console.log(`\n${colors.yellow}Next Steps:${colors.reset}`);
      console.log(`1. Add members via Dashboard → Management → Members`);
      console.log(`2. Customize email templates via Dashboard → Branding`);
      console.log(`3. Test login flow with: pnpm dev\n`);
    } catch (error) {
      console.error(`${colors.red}Error creating organization:${colors.reset}`);
      console.error(error);
      process.exit(1);
    }
  }

  /**
   * Configures an existing organization with secure settings
   */
  async configureOrganization(
    organizationId: string,
    allowedDomains?: string[]
  ): Promise<void> {
    console.log(`\n${colors.cyan}Configuring organization: ${organizationId}${colors.reset}\n`);

    try {
      // Get current organization to display changes
      const current = await this.client.organizations.get({
        organization_id: organizationId,
      });

      console.log(`${colors.blue}Current settings:${colors.reset}`);
      console.log(`  Name: ${current.organization.organization_name}`);
      console.log(`  Slug: ${current.organization.organization_slug}`);
      console.log(`  Email JIT: ${current.organization.email_jit_provisioning}`);
      console.log(`  Allowed Domains: ${JSON.stringify(current.organization.email_allowed_domains)}`);
      console.log(`  MFA Methods: ${JSON.stringify(current.organization.allowed_mfa_methods)}`);
      console.log(`  Auth Methods: ${JSON.stringify(current.organization.allowed_auth_methods)}\n`);

      // Update organization with secure defaults
      const updateParams: any = {
        organization_id: organizationId,
        mfa_methods: 'RESTRICTED',
        allowed_mfa_methods: ['totp'], // Exclude SMS OTP
        auth_methods: 'RESTRICTED',
        allowed_auth_methods: ['magic_link'],
      };

      // Only update email settings if domains provided
      if (allowedDomains && allowedDomains.length > 0) {
        updateParams.email_jit_provisioning = 'RESTRICTED';
        updateParams.email_allowed_domains = allowedDomains;
        updateParams.email_invites = 'RESTRICTED';
      }

      const response = await this.client.organizations.update(updateParams);

      console.log(`${colors.green}✓ Organization configured successfully${colors.reset}\n`);
      this.displayOrganization(response.organization);
    } catch (error) {
      console.error(`${colors.red}Error configuring organization:${colors.reset}`);
      console.error(error);
      process.exit(1);
    }
  }

  /**
   * Lists all organizations in the project
   */
  async listOrganizations(): Promise<void> {
    console.log(`\n${colors.cyan}Organizations in project${colors.reset}\n`);

    try {
      const response = await this.client.organizations.search({
        limit: 100,
      });

      if (response.organizations.length === 0) {
        console.log(`${colors.yellow}No organizations found${colors.reset}`);
        console.log(`\nCreate one with: pnpm tsx scripts/setup-stytch-organization.ts create "Client Name"\n`);
        return;
      }

      response.organizations.forEach((org, index) => {
        console.log(`${colors.bright}${index + 1}. ${org.organization_name}${colors.reset}`);
        console.log(`   ID: ${org.organization_id}`);
        console.log(`   Slug: ${org.organization_slug}`);
        console.log(`   Email JIT: ${org.email_jit_provisioning}`);
        console.log(`   Allowed Domains: ${JSON.stringify(org.email_allowed_domains)}`);
        console.log(`   Auth Methods: ${JSON.stringify(org.allowed_auth_methods)}`);
        console.log(`   MFA Methods: ${JSON.stringify(org.allowed_mfa_methods)}`);
        console.log();
      });

      console.log(`${colors.green}Total: ${response.organizations.length} organization(s)${colors.reset}\n`);
    } catch (error) {
      console.error(`${colors.red}Error listing organizations:${colors.reset}`);
      console.error(error);
      process.exit(1);
    }
  }

  /**
   * Displays organization details in a formatted way
   */
  private displayOrganization(org: Organization): void {
    console.log(`${colors.bright}Organization Details:${colors.reset}`);
    console.log(`  ${colors.blue}ID:${colors.reset} ${org.organization_id}`);
    console.log(`  ${colors.blue}Name:${colors.reset} ${org.organization_name}`);
    console.log(`  ${colors.blue}Slug:${colors.reset} ${org.organization_slug}`);
    console.log();
    console.log(`${colors.bright}Email Settings:${colors.reset}`);
    console.log(`  ${colors.blue}JIT Provisioning:${colors.reset} ${org.email_jit_provisioning}`);
    console.log(`  ${colors.blue}Email Invites:${colors.reset} ${org.email_invites}`);
    console.log(`  ${colors.blue}Allowed Domains:${colors.reset} ${JSON.stringify(org.email_allowed_domains)}`);
    console.log();
    console.log(`${colors.bright}Auth Settings:${colors.reset}`);
    console.log(`  ${colors.blue}Auth Methods:${colors.reset} ${org.auth_methods}`);
    console.log(`  ${colors.blue}Allowed Auth Methods:${colors.reset} ${JSON.stringify(org.allowed_auth_methods)}`);
    console.log();
    console.log(`${colors.bright}MFA Settings:${colors.reset}`);
    console.log(`  ${colors.blue}MFA Methods:${colors.reset} ${org.mfa_methods}`);
    console.log(`  ${colors.blue}Allowed MFA Methods:${colors.reset} ${JSON.stringify(org.allowed_mfa_methods)}`);

    // Security warnings
    if (org.allowed_mfa_methods?.includes('sms_otp')) {
      console.log();
      console.log(`${colors.yellow}⚠️  WARNING: SMS OTP is enabled - Toll Fraud risk!${colors.reset}`);
      console.log(`${colors.yellow}   Run: pnpm tsx scripts/setup-stytch-organization.ts configure ${org.organization_id}${colors.reset}`);
    }

    if (org.email_jit_provisioning === 'RESTRICTED' && org.email_allowed_domains.length === 0) {
      console.log();
      console.log(`${colors.yellow}⚠️  WARNING: JIT Provisioning is RESTRICTED but no domains allowed${colors.reset}`);
      console.log(`${colors.yellow}   Users won't be able to auto-join this organization${colors.reset}`);
    }
  }

  /**
   * Displays usage information
   */
  static displayUsage(): void {
    console.log(`\n${colors.bright}Stytch Organization Setup${colors.reset}\n`);
    console.log('Usage:');
    console.log(`  ${colors.cyan}List all organizations:${colors.reset}`);
    console.log('    pnpm tsx scripts/setup-stytch-organization.ts list\n');
    console.log(`  ${colors.cyan}Create new organization:${colors.reset}`);
    console.log('    pnpm tsx scripts/setup-stytch-organization.ts create "Client Name"');
    console.log('    pnpm tsx scripts/setup-stytch-organization.ts create "Client Name" client-domain.com\n');
    console.log(`  ${colors.cyan}Configure existing organization:${colors.reset}`);
    console.log('    pnpm tsx scripts/setup-stytch-organization.ts configure organization-test-xxx-xxx');
    console.log('    pnpm tsx scripts/setup-stytch-organization.ts configure organization-test-xxx-xxx client-domain.com\n');
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  const setup = new StytchOrgSetup();

  switch (command) {
    case 'list':
      await setup.listOrganizations();
      break;

    case 'create':
      if (!args[1]) {
        console.error(`${colors.red}Error: Organization name required${colors.reset}`);
        StytchOrgSetup.displayUsage();
        process.exit(1);
      }
      const domains = args[2] ? [args[2]] : [];
      await setup.createOrganization(args[1], domains);
      break;

    case 'configure':
      if (!args[1]) {
        console.error(`${colors.red}Error: Organization ID required${colors.reset}`);
        StytchOrgSetup.displayUsage();
        process.exit(1);
      }
      const allowedDomains = args[2] ? [args[2]] : undefined;
      await setup.configureOrganization(args[1], allowedDomains);
      break;

    default:
      StytchOrgSetup.displayUsage();
      break;
  }
}

main().catch((error) => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, error);
  process.exit(1);
});

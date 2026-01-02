import { B2BClient } from "stytch";
import { env } from "@/env";

/**
 * Stytch B2B Client (Server-only)
 * Used for authentication and session management
 */
const stytchClient = new B2BClient({
  project_id: env.STYTCH_PROJECT_ID,
  secret: env.STYTCH_SECRET,
});

/**
 * Discovery Authentication Result
 * Returned after authenticating a discovery magic link
 */
export interface DiscoveryAuthResult {
  intermediateSessionToken: string;
  email: string;
  discoveredOrganizations: Array<{
    organizationId: string;
    organizationName: string;
    organizationSlug: string;
  }>;
}

/**
 * Session data extracted from JWT
 */
export interface SessionData {
  email: string;
  organizationSlug: string;
  memberId: string;
  organizationId: string;
}

/**
 * Sends a discovery magic link to the provided email address
 * Discovery flow allows users to log in without knowing their organization
 */
export async function sendDiscoveryMagicLink(email: string): Promise<void> {
  await stytchClient.magicLinks.email.discovery.send({
    email_address: email,
  });
}

/**
 * Authenticates a discovery magic link token
 * Returns intermediate session token and discovered organizations
 */
export async function authenticateDiscoveryMagicLink(
  token: string
): Promise<DiscoveryAuthResult> {
  const response = await stytchClient.magicLinks.discovery.authenticate({
    discovery_magic_links_token: token,
  });

  return {
    intermediateSessionToken: response.intermediate_session_token,
    email: response.email_address,
    discoveredOrganizations: response.discovered_organizations.map((org) => ({
      organizationId: org.organization?.organization_id || "",
      organizationName: org.organization?.organization_name || "",
      organizationSlug: org.organization?.organization_slug || "",
    })),
  };
}

/**
 * Exchanges intermediate session token for a full session
 * Must specify which organization to log into
 */
export async function exchangeIntermediateSession(
  intermediateSessionToken: string,
  organizationId: string
): Promise<{
  sessionJwt: string;
  organizationSlug: string;
}> {
  const response = await stytchClient.discovery.intermediateSessions.exchange({
    intermediate_session_token: intermediateSessionToken,
    organization_id: organizationId,
  });

  return {
    sessionJwt: response.session_jwt,
    organizationSlug: response.organization.organization_slug,
  };
}

/**
 * Verifies a session JWT and returns session data
 * Throws error if JWT is invalid or expired
 */
export async function verifySessionJwt(jwt: string): Promise<SessionData> {
  // Use authenticate instead of authenticateJwt to get full member and organization data
  const response = await stytchClient.sessions.authenticate({
    session_jwt: jwt,
  });

  return {
    email: response.member.email_address,
    organizationSlug: response.organization.organization_slug,
    memberId: response.member.member_id,
    organizationId: response.organization.organization_id,
  };
}

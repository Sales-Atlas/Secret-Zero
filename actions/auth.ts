"use server";

import { cookies } from "next/headers";
import {
  sendDiscoveryMagicLink,
  authenticateDiscoveryMagicLink,
  exchangeIntermediateSession,
  type DiscoveryAuthResult,
} from "@/lib/stytch";

const SESSION_COOKIE_NAME = "stytch_session_jwt";
const SESSION_MAX_AGE = 60 * 60 * 24; // 24 hours

interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Sends a magic link to the provided email address (Discovery Flow)
 * Always returns success=true (Opaque Errors)
 */
export async function sendMagicLinkAction(
  email: string
): Promise<ActionResult> {
  try {
    await sendDiscoveryMagicLink(email);
    return { success: true };
  } catch (error) {
    // Opaque Errors - don't reveal if email exists
    console.error("[Auth] Magic link error:", error);
    return { success: true };
  }
}

/**
 * Authenticates the token from magic link
 */
export async function authenticateDiscoveryAction(
  token: string
): Promise<ActionResult<DiscoveryAuthResult>> {
  try {
    const result = await authenticateDiscoveryMagicLink(token);
    
    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("[Auth] Discovery authenticate error:", error);
    return {
      success: false,
      error: "Link expired or invalid. Please try again.",
    };
  }
}

/**
 * Selects organization and creates a session
 */
export async function selectOrganizationAction(
  intermediateSessionToken: string,
  organizationId: string
): Promise<ActionResult<{ organizationSlug: string }>> {
  try {
    const result = await exchangeIntermediateSession(
      intermediateSessionToken,
      organizationId
    );

    // Set session cookie
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, result.sessionJwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE,
      path: "/",
    });

    return {
      success: true,
      data: {
        organizationSlug: result.organizationSlug,
      },
    };
  } catch (error) {
    console.error("[Auth] Session exchange error:", error);
    return {
      success: false,
      error: "Failed to create session. Please try again.",
    };
  }
}

/**
 * Logs out the user (removes cookie)
 */
export async function logoutAction(): Promise<ActionResult> {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);
    
    return { success: true };
  } catch (error) {
    console.error("[Auth] Logout error:", error);
    return { success: false, error: "Logout error" };
  }
}

/**
 * Gets session JWT from cookie
 */
export async function getSessionJwt(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null;
}

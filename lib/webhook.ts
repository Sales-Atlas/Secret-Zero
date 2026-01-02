/**
 * Webhook Notification System
 *
 * Sends admin notifications when secrets are deposited
 * WITHOUT including any sensitive data in the payload
 */

import { env } from "@/env";

/**
 * Deposit notification payload (NO SECRETS!)
 */
interface DepositNotificationPayload {
  organizationSlug: string;
  memberEmail: string;
  memberId: string;
  appPrefix: string;
  appDomain: string;
  secretsCount: number;
  timestamp: string;
}

/**
 * Extracts domain from URL for logging purposes
 *
 * @param url - Full URL
 * @returns Domain without protocol (e.g., "app.pipedrive.com")
 */
export function extractDomainFromUrl(url: string): string {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.hostname;
  } catch {
    return "unknown-domain";
  }
}

/**
 * Sends deposit notification to admin webhook
 *
 * IMPORTANT: This function NEVER sends secret values!
 * Only metadata for audit logging.
 *
 * @param payload - Notification payload (no secrets)
 */
export async function sendDepositNotification(
  payload: DepositNotificationPayload
): Promise<void> {
  const webhookUrl = env.ADMIN_WEBHOOK_URL;

  if (!webhookUrl) {
    // No webhook configured - skip silently
    return;
  }

  try {
    // Prepare webhook payload
    const webhookPayload = {
      event: "secret.deposited",
      data: payload,
    };
    const payloadString = JSON.stringify(webhookPayload);

    // Generate HMAC signature if webhook secret is configured
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (env.WEBHOOK_SECRET) {
      const signature = await createWebhookSignature(
        payloadString,
        env.WEBHOOK_SECRET
      );
      headers["X-Webhook-Signature"] = signature;
    }

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers,
      body: payloadString,
    });

    if (!response.ok) {
      console.error(
        `[Webhook] Failed to send notification: ${response.status} ${response.statusText}`
      );
    } else {
      console.log("[Webhook] Deposit notification sent successfully");
    }
  } catch (error) {
    // Don't fail the deposit if webhook fails
    console.error("[Webhook] Error sending notification:", error);
  }
}

/**
 * Creates HMAC signature for webhook payload
 * Used to verify webhook authenticity
 *
 * @param payload - Webhook payload
 * @param secret - Webhook secret
 * @returns HMAC signature
 */
export async function createWebhookSignature(
  payload: string,
  secret: string
): Promise<string> {
  const crypto = await import("node:crypto");

  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(payload);
  return hmac.digest("hex");
}

/**
 * Verifies webhook signature
 * Used by webhook receivers to validate authenticity
 *
 * @param payload - Webhook payload
 * @param signature - Received signature
 * @param secret - Webhook secret
 * @returns true if signature is valid
 */
export async function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const expectedSignature = await createWebhookSignature(payload, secret);

  // Use timing-safe comparison to prevent timing attacks
  const crypto = await import("node:crypto");

  const signatureBuffer = Buffer.from(signature, "hex");
  const expectedBuffer = Buffer.from(expectedSignature, "hex");

  // timingSafeEqual throws if buffers have different lengths
  // Check length first to ensure we return false instead of throwing
  if (signatureBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
}

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

/**
 * Stytch Webhook Handler
 * 
 * Handles events from Stytch:
 * - member.created - new organization member
 * - member.deleted - deleted member
 * - organization.created - new organization
 * - session.revoked - revoked session
 * 
 * @see https://stytch.com/docs/b2b/api/webhooks
 */

interface StytchWebhookPayload {
  event_id: string;
  event_type: string;
  created_at: string;
  data: Record<string, unknown>;
}

/**
 * Verifies Stytch webhook signature
 */
function verifyWebhookSignature(
  payload: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature) return false;

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  const signatureBuffer = Buffer.from(signature, "hex");
  const expectedBuffer = Buffer.from(expectedSignature, "hex");

  // timingSafeEqual throws if buffers have different lengths
  // Check length first to ensure we return false instead of throwing
  if (signatureBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
}

export async function POST(request: NextRequest) {
  try {
    const webhookSecret = process.env.STYTCH_WEBHOOK_SECRET;

    // Get raw body for signature verification
    const rawBody = await request.text();
    
    // Verify signature (if secret is configured)
    if (webhookSecret) {
      const signature = request.headers.get("x-stytch-signature");
      
      if (!verifyWebhookSignature(rawBody, signature, webhookSecret)) {
        console.error("[Stytch Webhook] Invalid signature");
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 401 }
        );
      }
    }

    // Parse payload
    const payload: StytchWebhookPayload = JSON.parse(rawBody);
    
    console.log("[Stytch Webhook] Received event:", {
      event_id: payload.event_id,
      event_type: payload.event_type,
      created_at: payload.created_at,
    });

    // Handle different event types
    switch (payload.event_type) {
      case "member.created":
        await handleMemberCreated(payload.data);
        break;

      case "member.deleted":
        await handleMemberDeleted(payload.data);
        break;

      case "organization.created":
        await handleOrganizationCreated(payload.data);
        break;

      case "session.revoked":
        await handleSessionRevoked(payload.data);
        break;

      default:
        console.log("[Stytch Webhook] Unhandled event type:", payload.event_type);
    }

    // Always return 200 - Stytch will retry failed requests
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Stytch Webhook] Error processing webhook:", error);
    
    // Return 500 only for serious errors - Stytch will retry
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Handler: new organization member
 */
async function handleMemberCreated(data: Record<string, unknown>) {
  const member = data.member as Record<string, unknown> | undefined;
  const organization = data.organization as Record<string, unknown> | undefined;

  if (member && organization) {
    // Security: avoid logging PII (like email addresses) from webhook payloads.
    console.log("[Stytch Webhook] New member:", {
      memberId: member.member_id,
      organizationId: organization.organization_id,
      organizationName: organization.organization_name,
    });

    // Here you can add logic for:
    // - Creating a folder in Infisical for the organization
    // - Sending a notification
    // - Updating internal database
  }
}

/**
 * Handler: deleted member
 */
async function handleMemberDeleted(data: Record<string, unknown>) {
  const member = data.member as Record<string, unknown> | undefined;

  if (member) {
    console.log("[Stytch Webhook] Member deleted:", {
      memberId: member.member_id,
    });

    // Here you can add logic for:
    // - Audit log
    // - Access revocation
  }
}

/**
 * Handler: new organization
 */
async function handleOrganizationCreated(data: Record<string, unknown>) {
  const organization = data.organization as Record<string, unknown> | undefined;

  if (organization) {
    console.log("[Stytch Webhook] New organization:", {
      organizationId: organization.organization_id,
      organizationName: organization.organization_name,
      organizationSlug: organization.organization_slug,
    });

    // Here you can add logic for:
    // - Creating a folder in Infisical
    // - Initial configuration
  }
}

/**
 * Handler: revoked session
 */
async function handleSessionRevoked(data: Record<string, unknown>) {
  const session = data.session as Record<string, unknown> | undefined;

  if (session) {
    console.log("[Stytch Webhook] Session revoked:", {
      sessionId: session.session_id,
      memberId: session.member_id,
    });

    // Here you can add logic for:
    // - Session cache cleanup
    // - Audit log
  }
}

/**
 * Health check for Stytch (GET)
 */
export async function GET() {
  return NextResponse.json({ status: "ok", handler: "stytch-webhook" });
}

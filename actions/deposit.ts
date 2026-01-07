"use server";

import { cookies } from "next/headers";
import { verifySessionJwt } from "@/lib/stytch";
import { depositSecrets } from "@/lib/infisical";
import { decryptPayload, type EncryptedPayload } from "@/lib/crypto";
import { extractAppNameFromUrl } from "@/lib/url-parser";
import { decryptedSecretDataSchema } from "@/schemas/deposit";
import { sendDepositNotification, extractDomainFromUrl } from "@/lib/webhook";

interface DepositActionInput extends EncryptedPayload {
  organizationSlug: string;
}

interface DepositActionResult {
  success: boolean;
  error?: string;
}

/**
 * Server Action for secure secret deposit
 * 
 * Flow:
 * 1. Verify Stytch session
 * 2. Decrypt payload with private key
 * 3. Extract app name from URL
 * 4. Save to Infisical
 */
export async function depositSecretAction(
  input: DepositActionInput
): Promise<DepositActionResult> {
  try {
    // 1. Verify session
    const cookieStore = await cookies();
    const sessionJwt = cookieStore.get("stytch_session_jwt")?.value;

    if (!sessionJwt) {
      return {
        success: false,
        error: "Session expired. Please log in again.",
      };
    }

    let session;
    try {
      session = await verifySessionJwt(sessionJwt);
    } catch {
      return {
        success: false,
        error: "Session expired. Please log in again.",
      };
    }

    // Verify that organization matches the session
    if (session.organizationSlug !== input.organizationSlug) {
      return {
        success: false,
        error: "No access to this organization.",
      };
    }

    // 2. Decrypt payload
    const privateKey = process.env.SERVER_PRIVATE_KEY;
    
    if (!privateKey) {
      console.error("[Deposit] Missing SERVER_PRIVATE_KEY");
      return {
        success: false,
        error: "Server configuration error.",
      };
    }

    let decryptedData;
    try {
      decryptedData = await decryptPayload(
        {
          encryptedData: input.encryptedData,
          encryptedKey: input.encryptedKey,
          iv: input.iv,
        },
        privateKey
      );
    } catch (error) {
      console.error("[Deposit] Decryption error", { message: error instanceof Error ? error.message : String(error) });
      return {
        success: false,
        error: "Data decryption error.",
      };
    }

    // 3. Validate decrypted data
    const parseResult = decryptedSecretDataSchema.safeParse(decryptedData);
    
    if (!parseResult.success) {
      console.error("[Deposit] Validation error");
      return {
        success: false,
        error: "Invalid form data.",
      };
    }

    const secretData = parseResult.data;

    // 4. Extract app name from URL
    let appPrefix;
    try {
      appPrefix = extractAppNameFromUrl(secretData.url);
    } catch {
      console.error("[Deposit] URL parsing error");
      return {
        success: false,
        error: "Invalid URL address.",
      };
    }

    // 5. Save to Infisical
    let depositResult;
    try {
      depositResult = await depositSecrets(session.organizationSlug, appPrefix, {
        url: secretData.url,
        login: secretData.login,
        password: secretData.password,
        apiToken: secretData.apiToken,
      });
    } catch {
      console.error("[Deposit] Infisical error");
      return {
        success: false,
        error: "Vault save error.",
      };
    }

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
    // Nulling helps GC release memory faster
    // @ts-expect-error - intentional nulling for security
    secretData.password = null;
    // @ts-expect-error - intentional nulling for security
    secretData.apiToken = null;
    // @ts-expect-error - intentional nulling for security
    secretData.login = null;

    return { success: true };
  } catch {
    // Generic error - don't reveal details
    console.error("[Deposit] Unexpected error occurred");
    return {
      success: false,
      error: "An unexpected error occurred.",
    };
  }
}

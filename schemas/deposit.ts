import { z } from "zod";

function normalizeHttpUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) {
    return trimmed;
  }

  if (trimmed.startsWith("//")) {
    return `https:${trimmed}`;
  }

  const hasScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(trimmed);
  return hasScheme ? trimmed : `https://${trimmed}`;
}

function isValidHttpUrl(urlString: string): boolean {
  try {
    const parsed = new URL(urlString);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return false;
    }

    const hostname = parsed.hostname;
    if (!hostname) {
      return false;
    }

    if (hostname === "localhost") {
      return true;
    }

    // IPv6 hostnames contain ":" (e.g., "::1")
    if (hostname.includes(":")) {
      return true;
    }

    // Basic IPv4 support
    if (/^(\d{1,3}\.){3}\d{1,3}$/.test(hostname)) {
      return hostname.split(".").every((octet) => {
        const value = Number(octet);
        return Number.isInteger(value) && value >= 0 && value <= 255;
      });
    }

    // Require a dot for typical domains (e.g., "pipedrive.com")
    if (!hostname.includes(".")) {
      return false;
    }

    // Keep hostname validation simple but avoid obvious invalid characters
    if (!/^[a-z0-9.-]+$/i.test(hostname)) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

const httpUrlSchema = z
  .string()
  .trim()
  .min(1, "Please enter a URL")
  .transform((value) => normalizeHttpUrl(value))
  .refine((value) => isValidHttpUrl(value), "Please enter a valid URL");

/**
 * Form schema for secret deposit form (client-side)
 */
export const depositFormSchema = z.object({
  url: httpUrlSchema,
  login: z.string().optional(),
  password: z.string().optional(),
  apiToken: z.string().optional(),
});

export type DepositFormData = z.infer<typeof depositFormSchema>;

/**
 * Schema for decrypted secret data (server-side)
 */
export const decryptedSecretDataSchema = z.object({
  url: httpUrlSchema,
  login: z.string().optional(),
  password: z.string().optional(),
  apiToken: z.string().optional(),
});

export type DecryptedSecretData = z.infer<typeof decryptedSecretDataSchema>;

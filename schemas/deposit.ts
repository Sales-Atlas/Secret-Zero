import { z } from "zod";

function normalizeHttpUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) {
    return trimmed;
  }

  if (/^http:\/\//i.test(trimmed)) {
    return trimmed.replace(/^http:\/\//i, 'https://');
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
    if (parsed.protocol !== "https:") {
      return false;
    }

    const hostname = parsed.hostname;
    if (!hostname) {
      return false;
    }

    // IPv6 addresses should be enclosed in brackets in URLs.
    if (hostname.startsWith('[') && hostname.endsWith(']')) {
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
    if (!/^[a-z0-9._-]+$/i.test(hostname)) {
      return false;
    }

    const labels = hostname.split('.');
    if (labels.some((label) => label.length === 0)) {
      return false;
    }

    // Disallow labels that start or end with a hyphen
    const labelPattern = /^[a-z0-9_](?:[a-z0-9_-]*[a-z0-9_])?$/i;
    if (!labels.every((label) => labelPattern.test(label))) {
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

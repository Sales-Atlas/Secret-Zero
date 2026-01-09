import { z } from "zod";

/**
 * Environment variables validation schema
 * Used for validation at application startup
 */
const envSchema = z.object({
  // Stytch B2B
  STYTCH_PROJECT_ID: z.string().min(1, "STYTCH_PROJECT_ID is required"),
  STYTCH_SECRET: z.string().min(1, "STYTCH_SECRET is required"),
  NEXT_PUBLIC_STYTCH_PUBLIC_TOKEN: z.string().min(1, "NEXT_PUBLIC_STYTCH_PUBLIC_TOKEN is required"),
  STYTCH_WEBHOOK_SECRET: z.string().optional(), // Optional - for Stytch webhook verification

  // Infisical
  INFISICAL_CLIENT_ID: z.string().min(1, "INFISICAL_CLIENT_ID is required"),
  INFISICAL_CLIENT_SECRET: z.string().min(1, "INFISICAL_CLIENT_SECRET is required"),
  INFISICAL_PROJECT_ID: z.string().min(1, "INFISICAL_PROJECT_ID is required"),
  INFISICAL_SITE_URL: z.string().url().default("https://app.infisical.com"),
  INFISICAL_ENVIRONMENT: z.string().default("prod"),

  // RSA Encryption
  SERVER_PRIVATE_KEY: z.string().min(1, "SERVER_PRIVATE_KEY is required"),
  NEXT_PUBLIC_SERVER_PUBLIC_KEY: z.string().min(1, "NEXT_PUBLIC_SERVER_PUBLIC_KEY is required"),

  // Notification webhooks
  ADMIN_WEBHOOK_URL: z.string().url().optional(), // Optional - admin notification webhook
  WEBHOOK_SECRET: z.string().optional(), // Optional - secret for signing webhooks

  // Next.js
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),

  // Footer configuration
  NEXT_PUBLIC_FOOTER_LOGO_PATH: z.string().default("/logo.svg"),
  NEXT_PUBLIC_FOOTER_LOGO_URL: z.union([z.string().url(), z.literal("")]).optional(),
  NEXT_PUBLIC_FOOTER_PRIVACY_URL: z.union([z.string().url(), z.literal("")]).optional(),
  NEXT_PUBLIC_FOOTER_COMPANY_NAME: z.string().default("Secret Zero by Grzegorz Zawłodzki"),
});

/**
 * Environment variables type
 */
export type Env = z.infer<typeof envSchema>;

/**
 * Parses and validates environment variables
 * Throws an error if required variables are missing
 */
function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const errors = result.error.flatten().fieldErrors;
    const errorMessages = Object.entries(errors)
      .map(([field, messages]) => `  ${field}: ${messages?.join(", ")}`)
      .join("\n");

    throw new Error(
      `Invalid environment variables configuration:\n${errorMessages}`
    );
  }

  return result.data;
}

/**
 * Validated environment variables
 * Importing this object guarantees all variables are valid
 */
export const env = validateEnv();

/**
 * Safe variables for client-side use
 */
export const clientEnv = {
  NEXT_PUBLIC_STYTCH_PUBLIC_TOKEN: env.NEXT_PUBLIC_STYTCH_PUBLIC_TOKEN,
  NEXT_PUBLIC_SERVER_PUBLIC_KEY: env.NEXT_PUBLIC_SERVER_PUBLIC_KEY,
  NEXT_PUBLIC_APP_URL: env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_FOOTER_LOGO_PATH: env.NEXT_PUBLIC_FOOTER_LOGO_PATH,
  NEXT_PUBLIC_FOOTER_LOGO_URL: env.NEXT_PUBLIC_FOOTER_LOGO_URL,
  NEXT_PUBLIC_FOOTER_PRIVACY_URL: env.NEXT_PUBLIC_FOOTER_PRIVACY_URL,
  NEXT_PUBLIC_FOOTER_COMPANY_NAME: env.NEXT_PUBLIC_FOOTER_COMPANY_NAME,
} as const;

/**
 * Checks if we are in production environment
 */
export const isProduction = env.NODE_ENV === "production";

/**
 * Checks if we are in development environment
 */
export const isDevelopment = env.NODE_ENV === "development";

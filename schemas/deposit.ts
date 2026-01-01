import { z } from "zod";

/**
 * Form schema for secret deposit form (client-side)
 */
export const depositFormSchema = z.object({
  url: z.string().url("Please enter a valid URL"),
  login: z.string().optional(),
  password: z.string().optional(),
  apiToken: z.string().optional(),
});

export type DepositFormData = z.infer<typeof depositFormSchema>;

/**
 * Schema for decrypted secret data (server-side)
 */
export const decryptedSecretDataSchema = z.object({
  url: z.string().url(),
  login: z.string().optional(),
  password: z.string().optional(),
  apiToken: z.string().optional(),
});

export type DecryptedSecretData = z.infer<typeof decryptedSecretDataSchema>;

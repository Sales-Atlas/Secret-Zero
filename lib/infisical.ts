import { InfisicalSDK } from "@infisical/sdk";

// Lazy initialization - client created on first use
let infisicalClient: InfisicalSDK | null = null;
let isAuthenticated = false;

/**
 * Gets or creates an Infisical client instance
 * Automatically authenticates on first use
 */
async function getInfisicalClient(): Promise<InfisicalSDK> {
  if (!infisicalClient) {
    const siteUrl = process.env.INFISICAL_SITE_URL || "https://app.infisical.com";

    infisicalClient = new InfisicalSDK({
      siteUrl,
    });
  }

  // Authenticate if not done yet
  if (!isAuthenticated) {
    const clientId = process.env.INFISICAL_CLIENT_ID;
    const clientSecret = process.env.INFISICAL_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error(
        "Missing INFISICAL_CLIENT_ID or INFISICAL_CLIENT_SECRET in environment variables"
      );
    }

    await infisicalClient.auth().universalAuth.login({
      clientId,
      clientSecret,
    });

    isAuthenticated = true;
  }

  return infisicalClient;
}

/**
 * Options for creating a secret
 */
export interface CreateSecretOptions {
  /** Path in folder structure (e.g., "/acme-corp") */
  secretPath: string;
  /** Secret key name (e.g., "PIPEDRIVE_API_TOKEN") */
  secretKey: string;
  /** Secret value */
  secretValue: string;
  /** Optional comment */
  secretComment?: string;
}

/**
 * Generates a unique timestamp suffix
 * Format: _YYYYMMDD_HHMMSS
 */
function generateTimestampSuffix(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  return `_${year}${month}${day}_${hours}${minutes}${seconds}`;
}

/**
 * Creates a folder in Infisical
 * Required before creating secrets in a new organization path
 *
 * @param folderPath - Full path like "/test-org" or "/acme-corp"
 */
export async function createFolder(folderPath: string): Promise<void> {
  const client = await getInfisicalClient();
  const projectId = process.env.INFISICAL_PROJECT_ID;
  const environment = process.env.INFISICAL_ENVIRONMENT || "prod";

  if (!projectId) {
    throw new Error("Missing INFISICAL_PROJECT_ID in environment variables");
  }

  // Extract folder name from path (e.g., "/test-org" -> "test-org")
  const folderName = folderPath.startsWith("/") ? folderPath.slice(1) : folderPath;

  // Validate that the path is not nested (e.g., "foo/bar" is invalid)
  if (folderName.includes("/")) {
    throw new Error(
      `Nested folder paths are not supported. Expected format: "/org-slug" but got: "${folderPath}"`
    );
  }

  try {
    await client.folders().create({
      name: folderName,
      path: "/", // Parent path (root)
      environment,
      projectId,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Ignore if folder already exists
    if (!errorMessage.includes("already exists")) {
      throw error;
    }
  }
}

/**
 * Creates a new secret in Infisical
 * Uses Write-Only role - cannot read secrets
 *
 * In case of conflict (secret already exists) adds timestamp suffix
 *
 * Note: Folder must exist before creating secrets. Use createFolder() first.
 */
export async function createSecret(options: CreateSecretOptions): Promise<string> {
  const client = await getInfisicalClient();
  const projectId = process.env.INFISICAL_PROJECT_ID;
  const environment = process.env.INFISICAL_ENVIRONMENT || "prod";

  if (!projectId) {
    throw new Error("Missing INFISICAL_PROJECT_ID in environment variables");
  }

  let secretKey = options.secretKey;

  try {
    await client.secrets().createSecret(secretKey, {
      secretValue: options.secretValue,
      environment,
      projectId,
      secretPath: options.secretPath,
      secretComment: options.secretComment,
    });
  } catch (error) {
    // Check if this is a duplicate error (secret already exists)
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (errorMessage.includes("already exists") || errorMessage.includes("duplicate")) {
      // Add timestamp suffix and retry
      secretKey = `${options.secretKey}${generateTimestampSuffix()}`;

      console.log(`[Infisical] Secret exists, using suffix: ${secretKey}`);

      await client.secrets().createSecret(secretKey, {
        secretValue: options.secretValue,
        environment,
        projectId,
        secretPath: options.secretPath,
        secretComment: `${options.secretComment} (duplicate - previous secret exists)`,
      });
    } else {
      // Other error - propagate
      throw error;
    }
  }

  return secretKey;
}

/**
 * Secret data to save
 */
export interface SecretData {
  url: string;
  login?: string;
  password?: string;
  apiToken?: string;
}

/**
 * Result of secret deposit
 */
export interface DepositResult {
  /** Number of saved secrets */
  secretsCount: number;
  /** Names of created keys */
  createdKeys: string[];
}

/**
 * Saves a complete set of secrets for an application
 * Creates secrets: {PREFIX}_URL, {PREFIX}_LOGIN, {PREFIX}_PASSWORD, {PREFIX}_API_TOKEN
 *
 * In case of duplicates, automatically adds timestamp suffix
 */
export async function depositSecrets(
  organizationSlug: string,
  appPrefix: string,
  data: SecretData
): Promise<DepositResult> {
  const secretPath = `/${organizationSlug}`;
  const comment = `Deposited via ISCP Portal - ${new Date().toISOString()}`;
  const createdKeys: string[] = [];

  // Ensure organization folder exists before creating secrets
  await createFolder(secretPath);

  // Always save URL (required)
  const urlKey = await createSecret({
    secretPath,
    secretKey: `${appPrefix}_URL`,
    secretValue: data.url,
    secretComment: comment,
  });
  createdKeys.push(urlKey);

  // Optional: Login
  if (data.login) {
    const loginKey = await createSecret({
      secretPath,
      secretKey: `${appPrefix}_LOGIN`,
      secretValue: data.login,
      secretComment: comment,
    });
    createdKeys.push(loginKey);
  }

  // Optional: Password
  if (data.password) {
    const passwordKey = await createSecret({
      secretPath,
      secretKey: `${appPrefix}_PASSWORD`,
      secretValue: data.password,
      secretComment: comment,
    });
    createdKeys.push(passwordKey);
  }

  // Optional: API Token
  if (data.apiToken) {
    const tokenKey = await createSecret({
      secretPath,
      secretKey: `${appPrefix}_API_TOKEN`,
      secretValue: data.apiToken,
      secretComment: comment,
    });
    createdKeys.push(tokenKey);
  }

  return {
    secretsCount: createdKeys.length,
    createdKeys,
  };
}

/**
 * Resets the client - used in tests or when changing credentials
 */
export function resetInfisicalClient(): void {
  infisicalClient = null;
  isAuthenticated = false;
}

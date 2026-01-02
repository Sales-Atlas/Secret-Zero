/**
 * URL Parser Utilities
 *
 * Extracts application names from URLs for secret naming conventions
 * Example: "https://app.pipedrive.com" → "PIPEDRIVE"
 */

/**
 * Extracts the main application name from a URL
 *
 * Logic:
 * 1. Parse the URL and extract hostname
 * 2. Remove common subdomains (app, www, api, etc.)
 * 3. Extract the main domain part (before .com, .io, etc.)
 * 4. Convert to uppercase
 *
 * @param url - Full URL of the application
 * @returns Uppercase application name (e.g., "PIPEDRIVE", "GITHUB")
 *
 * @example
 * extractAppNameFromUrl("https://app.pipedrive.com") // "PIPEDRIVE"
 * extractAppNameFromUrl("https://github.com") // "GITHUB"
 * extractAppNameFromUrl("https://api.stripe.com") // "STRIPE"
 */
export function extractAppNameFromUrl(url: string): string {
  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname;

    // Split hostname into parts
    const parts = hostname.split(".");

    // Remove TLD (.com, .io, .co.uk, etc.)
    // Handle both standard TLDs and country-code TLDs
    let domainParts = parts;
    if (parts.length >= 2) {
      // Remove last part (TLD)
      domainParts = parts.slice(0, -1);

      // If there's a country code (e.g., .co.uk), remove another part
      if (domainParts.length >= 2 && domainParts[domainParts.length - 1].length === 2) {
        domainParts = domainParts.slice(0, -1);
      }
    }

    // Common subdomains to ignore
    const ignoredSubdomains = ["app", "www", "api", "web", "portal", "admin", "dashboard"];

    // Filter out ignored subdomains and get the main domain
    const mainDomainParts = domainParts.filter(
      part => !ignoredSubdomains.includes(part.toLowerCase())
    );

    // Get the last remaining part (the main domain)
    const appName = mainDomainParts[mainDomainParts.length - 1];

    if (!appName) {
      throw new Error("Could not extract application name from URL");
    }

    // Convert to uppercase for secret naming convention
    return appName.toUpperCase();
  } catch (error) {
    throw new Error(
      `Invalid URL format: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Validates if a URL is well-formed
 *
 * @param url - URL to validate
 * @returns true if URL is valid
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

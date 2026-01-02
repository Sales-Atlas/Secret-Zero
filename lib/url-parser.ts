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
      const tld = parts[parts.length - 1];
      // Remove last part (TLD)
      domainParts = parts.slice(0, -1);

      // Known second-level country-code domains (e.g., .co in .co.uk, .com in .com.au)
      const secondLevelCCTLDs = ['co', 'com', 'ac', 'gov', 'edu', 'org', 'net', 'mil', 'nom', 'sch'];
      const potentialSecondLevel = domainParts[domainParts.length - 1];

      // Only strip if it's a known second-level domain AND TLD is a 2-char country code
      if (
        domainParts.length >= 2 &&
        secondLevelCCTLDs.includes(potentialSecondLevel.toLowerCase()) &&
        tld.length === 2
      ) {
        domainParts = domainParts.slice(0, -1);
      }
    }

    // Common subdomains to ignore
    const ignoredSubdomains = ["app", "www", "api", "web", "portal", "admin", "dashboard"];

    // Filter out ignored subdomains only if we have multiple parts
    // If we only have one part, it's the main domain (e.g., "app.com" → keep "app")
    let mainDomainParts: string[];
    if (domainParts.length === 1) {
      // Single part - this is the main domain, don't filter it
      mainDomainParts = domainParts;
    } else {
      // Multiple parts - filter out ignored subdomains (e.g., "app.pipedrive.com" → "pipedrive")
      mainDomainParts = domainParts.filter(
        part => !ignoredSubdomains.includes(part.toLowerCase())
      );
    }

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

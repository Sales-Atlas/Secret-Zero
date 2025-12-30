/**
 * Next.js Instrumentation
 * 
 * This file is executed on Next.js server startup.
 * We use it to initialize the Taint API for environment variables.
 * 
 * @see https://nextjs.org/docs/app/guides/instrumentation
 */

export async function register() {
  // Taint API only works in Node.js environment (not Edge)
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { taintEnvironmentSecrets } = await import("./lib/taint");
    taintEnvironmentSecrets();
  }
}

/**
 * React Taint API Integration
 *
 * Marks sensitive environment variables as "tainted" to prevent
 * them from being accidentally sent to client components.
 *
 * @see https://react.dev/reference/react/experimental_taintObjectReference
 */

import { experimental_taintObjectReference as taintObjectReference } from "react";
import { env } from "@/env";

/**
 * Taints all sensitive environment variables
 * Called during Next.js initialization (instrumentation.ts)
 */
export function taintEnvironmentSecrets(): void {
  // Taint the entire env object to prevent accidental client exposure
  taintObjectReference(
    "Do not pass environment secrets to client components",
    env
  );

  // Also taint the process.env object
  taintObjectReference(
    "Do not pass process.env to client components",
    process.env
  );

  console.log("[Security] Environment secrets marked as tainted");
}

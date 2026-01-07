"use client";

import { useEffect, useState, useTransition, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authenticateDiscoveryAction, selectOrganizationAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Lock, Building2, ArrowRight, AlertCircle, Loader2 } from "lucide-react";

interface DiscoveredOrganization {
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
}

export default function AuthenticatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [error, setError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const [organizations, setOrganizations] = useState<DiscoveredOrganization[]>([]);
  const [intermediateToken, setIntermediateToken] = useState<string | null>(null);

  // Guard to prevent re-execution of authentication
  const hasAuthenticatedRef = useRef(false);

  // Get token from URL
  const token = searchParams.get("token");
  const tokenType = searchParams.get("stytch_token_type");

  const handleSelectOrganization = useCallback(async (
    organizationId: string,
    ist?: string
  ) => {
    const tokenToUse = ist || intermediateToken;

    if (!tokenToUse) {
      setError("Missing session token");
      return;
    }

    startTransition(async () => {
      const result = await selectOrganizationAction(tokenToUse, organizationId);

      if (result.success) {
        router.push(`/deposit/${result.data?.organizationSlug}`);
      } else {
        setError(result.error || "Organization selection error");
      }
    });
  }, [intermediateToken, router]);

  useEffect(() => {
    // Prevent re-execution after successful authentication
    if (hasAuthenticatedRef.current) {
      return;
    }

    if (!token) {
      setError("Missing token in URL. Please use the link from your email.");
      setIsAuthenticating(false);
      return;
    }

    if (tokenType !== "discovery") {
      setError("Invalid token type.");
      setIsAuthenticating(false);
      return;
    }

    // Mark as authenticated to prevent re-execution
    hasAuthenticatedRef.current = true;

    // Authenticate token
    startTransition(async () => {
      const result = await authenticateDiscoveryAction(token);

      if (result.success && result.data) {
        setIntermediateToken(result.data.intermediateSessionToken);
        setOrganizations(result.data.discoveredOrganizations);

        // If only one organization, select automatically
        if (result.data.discoveredOrganizations.length === 1) {
          await handleSelectOrganization(
            result.data.discoveredOrganizations[0].organizationId,
            result.data.intermediateSessionToken
          );
        }
      } else {
        setError(result.error || "Authentication error");
      }

      setIsAuthenticating(false);
    });
    // handleSelectOrganization is intentionally not in dependencies to prevent re-execution
    // when intermediateToken changes. The token is passed directly as a parameter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, tokenType]);

  // Loading state
  if (isAuthenticating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md p-8">
          <div className="text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold text-foreground">
                Verifying...
              </h1>
              <p className="text-muted-foreground">
                Verifying your login link
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md p-8">
          <div className="text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold text-foreground">
                Login Error
              </h1>
              <p className="text-muted-foreground">{error}</p>
            </div>
            <Button
              onClick={() => router.push("/login")}
              variant="secondary"
            >
              Return to login
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Organization selection
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md p-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold text-foreground">
                Select Organization
              </h1>
              <p className="text-muted-foreground">
                Which organization do you want to log in to?
              </p>
            </div>
          </div>

          {/* Organizations list */}
          <div className="space-y-3">
            {organizations.map((org) => (
              <button
                key={org.organizationId}
                onClick={() => handleSelectOrganization(org.organizationId)}
                disabled={isPending}
                className="w-full p-4 flex items-center gap-4 bg-muted border border-border rounded-lg hover:bg-accent hover:border-accent-foreground/20 transition-all group disabled:opacity-50"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium text-foreground">
                    {org.organizationName}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {org.organizationSlug}
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
              </button>
            ))}
          </div>

          {organizations.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                No organizations found associated with your account.
              </p>
              <Button
                onClick={() => router.push("/login")}
                variant="secondary"
                className="mt-4"
              >
                Return to login
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

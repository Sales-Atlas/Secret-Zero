"use client";

import { useEffect, useState, useTransition } from "react";
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

  // Get token from URL
  const token = searchParams.get("token");
  const tokenType = searchParams.get("stytch_token_type");

  useEffect(() => {
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
  }, [token, tokenType]);

  const handleSelectOrganization = async (
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
  };

  // Loading state
  if (isAuthenticating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        <Card className="w-full max-w-md p-8 bg-slate-800/50 border-slate-700 backdrop-blur-sm">
          <div className="text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold text-white">
                Verifying...
              </h1>
              <p className="text-slate-400">
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        <Card className="w-full max-w-md p-8 bg-slate-800/50 border-slate-700 backdrop-blur-sm">
          <div className="text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold text-white">
                Login Error
              </h1>
              <p className="text-slate-400">{error}</p>
            </div>
            <Button
              onClick={() => router.push("/login")}
              className="bg-slate-700 hover:bg-slate-600 text-white"
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <Card className="w-full max-w-md p-8 bg-slate-800/50 border-slate-700 backdrop-blur-sm">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center">
              <Lock className="w-8 h-8 text-blue-400" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold text-white">
                Select Organization
              </h1>
              <p className="text-slate-400">
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
                className="w-full p-4 flex items-center gap-4 bg-slate-900/50 border border-slate-600 rounded-lg hover:bg-slate-700/50 hover:border-slate-500 transition-all group disabled:opacity-50"
              >
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-blue-400" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium text-white">
                    {org.organizationName}
                  </div>
                  <div className="text-sm text-slate-500">
                    {org.organizationSlug}
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-white transition-colors" />
              </button>
            ))}
          </div>

          {organizations.length === 0 && (
            <div className="text-center py-8">
              <p className="text-slate-400">
                No organizations found associated with your account.
              </p>
              <Button
                onClick={() => router.push("/login")}
                className="mt-4 bg-slate-700 hover:bg-slate-600 text-white"
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

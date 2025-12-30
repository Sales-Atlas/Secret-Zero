import { Suspense } from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { verifySessionJwt } from "@/lib/stytch";
import { SecretForm } from "@/components/forms/secret-form";
import { Card } from "@/components/ui/card";
import { Lock, Shield, CheckCircle } from "lucide-react";

interface DepositPageProps {
  params: Promise<{
    orgSlug: string;
  }>;
}

async function getSession() {
  const cookieStore = await cookies();
  const sessionJwt = cookieStore.get("stytch_session_jwt")?.value;
  
  if (!sessionJwt) {
    return null;
  }

  try {
    return await verifySessionJwt(sessionJwt);
  } catch {
    return null;
  }
}

export default async function DepositPage({ params }: DepositPageProps) {
  const { orgSlug } = await params;
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  // Verify that URL slug matches the session
  if (session.organizationSlug !== orgSlug) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="mx-auto w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center">
            <Lock className="w-10 h-10 text-emerald-400" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold text-white">
              Secure Credential Transfer
            </h1>
            <p className="text-slate-400 max-w-md mx-auto">
              Your data will be encrypted in your browser and securely
              transferred to our vault.
            </p>
          </div>
        </div>

        {/* Security badges */}
        <div className="flex flex-wrap justify-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-full">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span className="text-sm text-slate-300">E2E Encryption</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-full">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span className="text-sm text-slate-300">Zero-Trust</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-full">
            <Lock className="w-4 h-4 text-emerald-400" />
            <span className="text-sm text-slate-300">SOC2 Compliant</span>
          </div>
        </div>

        {/* Form Card */}
        <Card className="p-8 bg-slate-800/50 border-slate-700 backdrop-blur-sm">
          <Suspense
            fallback={
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
              </div>
            }
          >
            <SecretForm
              organizationSlug={session.organizationSlug}
              userEmail={session.email}
            />
          </Suspense>
        </Card>

        {/* Info */}
        <div className="text-center space-y-2">
          <p className="text-sm text-slate-500">
            Logged in as <span className="text-slate-300">{session.email}</span>
          </p>
          <p className="text-xs text-slate-600">
            Your data is encrypted before leaving your browser.
            No intermediary has access to it.
          </p>
        </div>
      </div>
    </div>
  );
}

import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { Lock, Shield, CheckCircle, AlertCircle } from 'lucide-react';

import { env } from '@/env';
import { verifySessionJwt } from '@/lib/stytch';
import { SecretForm } from '@/components/forms/secret-form';
import { Card } from '@/components/ui/card';

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

  const publicKey = env.NEXT_PUBLIC_SERVER_PUBLIC_KEY;

  // Check for required configuration before rendering form
  if (!publicKey) {
    return (
      <div className="min-h-screen bg-background py-12 px-4">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="mx-auto w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center">
              <AlertCircle className="w-10 h-10 text-destructive" />
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold text-foreground">
                Configuration Error
              </h1>
              <p className="text-muted-foreground max-w-md mx-auto">
                The server encryption key is not configured. Please contact your administrator.
              </p>
            </div>
          </div>

          <Card className="p-8">
            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                Missing environment variable: <code className="text-foreground bg-muted px-2 py-1 rounded">NEXT_PUBLIC_SERVER_PUBLIC_KEY</code>
              </p>
              <p className="text-xs text-muted-foreground">
                This variable is required for client-side encryption. Please configure it in your environment settings.
              </p>
            </div>
          </Card>

          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Logged in as <span className="text-foreground">{session.email}</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
            <Lock className="w-10 h-10 text-primary" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold text-foreground">
              Secure Credential Transfer
            </h1>
            <p className="text-muted-foreground max-w-md mx-auto">
              Your data will be encrypted in your browser and securely
              transferred to our vault.
            </p>
          </div>
        </div>

        {/* Security badges */}
        <div className="flex flex-wrap justify-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-full">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-sm text-foreground">E2E Encryption</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-full">
            <CheckCircle className="w-4 h-4 text-primary" />
            <span className="text-sm text-foreground">Zero-Trust</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-full">
            <Lock className="w-4 h-4 text-primary" />
            <span className="text-sm text-foreground">Secure Design</span>
          </div>
        </div>

        {/* Form Card */}
        <Card className="p-8">
          <Suspense
            fallback={
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            }
          >
            <SecretForm
              organizationSlug={session.organizationSlug}
              publicKey={publicKey}
            />
          </Suspense>
        </Card>

        {/* Info */}
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Logged in as <span className="text-foreground">{session.email}</span>
          </p>
          <p className="text-xs text-muted-foreground">
            Your data is encrypted before leaving your browser.
            No intermediary has access to it.
          </p>
        </div>
      </div>
    </div>
  );
}

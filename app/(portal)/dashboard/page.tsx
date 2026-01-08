import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { verifySessionJwt } from "@/lib/stytch";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, ArrowRight } from "lucide-react";
import Link from "next/link";
import { LogoutButton } from "@/components/auth/logout-button";

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

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
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
              Welcome to Secure Portal
            </h1>
            <p className="text-muted-foreground">
              Logged in as <span className="text-foreground">{session.email}</span>
            </p>
          </div>
        </div>

        {/* Main Action Card */}
        <Card className="p-8">
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-foreground">
                Transfer Credentials
              </h2>
              <p className="text-muted-foreground">
                Click below to securely transfer credentials
                for an external application.
              </p>
            </div>

            <Link href={`/deposit/${session.organizationSlug}`}>
              <Button className="w-full font-medium py-6 text-lg">
                Start Deposit
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </Card>

        {/* Organization Info */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Organization</p>
              <p className="text-foreground font-medium">{session.organizationSlug}</p>
            </div>
            <LogoutButton />
          </div>
        </Card>

        {/* Security note */}
        <p className="text-center text-sm text-muted-foreground">
          All data is encrypted end-to-end.
          Your passwords are never stored in plain text.
        </p>
      </div>
    </div>
  );
}

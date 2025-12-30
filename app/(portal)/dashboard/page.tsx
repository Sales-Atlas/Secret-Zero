import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { verifySessionJwt } from "@/lib/stytch";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, ArrowRight, LogOut } from "lucide-react";
import Link from "next/link";
import { logoutAction } from "@/actions/auth";

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="mx-auto w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center">
            <Lock className="w-10 h-10 text-emerald-400" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold text-white">
              Welcome to Secret Portal
            </h1>
            <p className="text-slate-400">
              Logged in as <span className="text-white">{session.email}</span>
            </p>
          </div>
        </div>

        {/* Main Action Card */}
        <Card className="p-8 bg-slate-800/50 border-slate-700 backdrop-blur-sm">
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-white">
                Transfer Credentials
              </h2>
              <p className="text-slate-400">
                Click below to securely transfer credentials
                for an external application.
              </p>
            </div>

            <Link href={`/deposit/${session.organizationSlug}`}>
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-6 text-lg">
                Start Deposit
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </Card>

        {/* Organization Info */}
        <Card className="p-6 bg-slate-800/30 border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Organization</p>
              <p className="text-white font-medium">{session.organizationSlug}</p>
            </div>
            <form action={logoutAction}>
              <Button
                type="submit"
                variant="ghost"
                className="text-slate-400 hover:text-white hover:bg-slate-700"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </form>
          </div>
        </Card>

        {/* Security note */}
        <p className="text-center text-sm text-slate-500">
          All data is encrypted end-to-end.
          Your passwords are never stored in plain text.
        </p>
      </div>
    </div>
  );
}

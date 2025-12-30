import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { Lock, Shield, Key, ArrowRight, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default async function HomePage() {
  // Check if user is logged in
  const cookieStore = await cookies();
  const sessionJwt = cookieStore.get("stytch_session_jwt")?.value;

  // If logged in, redirect to dashboard
  if (sessionJwt) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center space-y-8">
          {/* Logo/Icon */}
          <div className="mx-auto w-24 h-24 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-emerald-500/20">
            <Lock className="w-12 h-12 text-white" />
          </div>

          {/* Title */}
          <div className="space-y-4">
            <h1 className="text-5xl font-bold text-white tracking-tight">
              Secure Secret Portal
            </h1>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Securely transfer your credentials to our vault.
              End-to-end encryption protects your data at every step.
            </p>
          </div>

          {/* CTA */}
          <div className="pt-4">
            <Link href="/login">
              <Button
                size="lg"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-8 py-6 text-lg rounded-xl shadow-lg shadow-emerald-500/25 transition-all hover:shadow-emerald-500/40"
              >
                Get Started
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="mt-24 grid md:grid-cols-3 gap-8">
          <Card className="p-8 bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <div className="space-y-4">
              <div className="w-14 h-14 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <Shield className="w-7 h-7 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-white">
                E2E Encryption
              </h3>
              <p className="text-slate-400">
                Data is encrypted in your browser before transmission.
                No intermediary has access to your secrets.
              </p>
            </div>
          </Card>

          <Card className="p-8 bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <div className="space-y-4">
              <div className="w-14 h-14 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                <Key className="w-7 h-7 text-emerald-400" />
              </div>
              <h3 className="text-xl font-semibold text-white">
                Zero-Trust
              </h3>
              <p className="text-slate-400">
                Write-Only architecture ensures that even in case of
                system compromise, your data remains secure.
              </p>
            </div>
          </Card>

          <Card className="p-8 bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <div className="space-y-4">
              <div className="w-14 h-14 bg-purple-500/20 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-7 h-7 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-white">
                SOC2 Compliant
              </h3>
              <p className="text-slate-400">
                System meets SOC2, ISO 27001, and GDPR requirements.
                Full auditability of all operations.
              </p>
            </div>
          </Card>
        </div>

        {/* How it works */}
        <div className="mt-24">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            How It Works
          </h2>
          
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: 1, title: "Login", desc: "Sign in via magic link sent to your email" },
              { step: 2, title: "Fill the Form", desc: "Enter application credentials" },
              { step: 3, title: "Encryption", desc: "Data is encrypted in your browser" },
              { step: 4, title: "Secure Storage", desc: "We store them in our vault" },
            ].map((item) => (
              <div key={item.step} className="text-center space-y-3">
                <div className="mx-auto w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center text-xl font-bold text-emerald-400">
                  {item.step}
                </div>
                <h3 className="font-semibold text-white">{item.title}</h3>
                <p className="text-sm text-slate-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8 mt-24">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-slate-500">
          <p>
            Secure Secret Portal • AES-256-GCM + RSA-2048 Encryption
          </p>
        </div>
      </footer>
    </div>
  );
}

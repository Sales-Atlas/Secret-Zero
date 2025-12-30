import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { Lock, Shield, Key, ArrowRight, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default async function HomePage() {
  // Sprawdź czy użytkownik jest zalogowany
  const cookieStore = await cookies();
  const sessionJwt = cookieStore.get("stytch_session_jwt")?.value;

  // Jeśli zalogowany, przekieruj do dashboard
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
              Bezpiecznie przekaż dane dostępowe do naszego skarbca.
              Szyfrowanie end-to-end chroni Twoje dane na każdym kroku.
            </p>
          </div>

          {/* CTA */}
          <div className="pt-4">
            <Link href="/login">
              <Button
                size="lg"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-8 py-6 text-lg rounded-xl shadow-lg shadow-emerald-500/25 transition-all hover:shadow-emerald-500/40"
              >
                Rozpocznij
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
                Szyfrowanie E2E
              </h3>
              <p className="text-slate-400">
                Dane są szyfrowane w Twojej przeglądarce przed wysłaniem.
                Nikt pośredniczący nie ma do nich dostępu.
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
                Architektura Write-Only gwarantuje, że nawet w przypadku
                kompromitacji systemu, dane pozostają bezpieczne.
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
                System spełnia wymagania SOC2, ISO 27001 i RODO.
                Pełna audytowalność wszystkich operacji.
              </p>
            </div>
          </Card>
        </div>

        {/* How it works */}
        <div className="mt-24">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Jak to działa?
          </h2>
          
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: 1, title: "Logowanie", desc: "Zaloguj się przez magic link wysłany na email" },
              { step: 2, title: "Wypełnij formularz", desc: "Podaj dane dostępowe do aplikacji" },
              { step: 3, title: "Szyfrowanie", desc: "Dane są szyfrowane w przeglądarce" },
              { step: 4, title: "Bezpieczny zapis", desc: "Zapisujemy je w naszym skarbcu" },
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
            Secure Secret Portal • Szyfrowanie AES-256-GCM + RSA-2048
          </p>
        </div>
      </footer>
    </div>
  );
}
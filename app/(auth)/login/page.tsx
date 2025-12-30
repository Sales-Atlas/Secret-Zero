"use client";

import { useState, useTransition } from "react";
import { sendMagicLinkAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Lock, Mail, ArrowRight, CheckCircle } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }

    startTransition(async () => {
      const result = await sendMagicLinkAction(email);
      
      if (result.success) {
        setSuccess(true);
      } else {
        // Always show the same message (Opaque Errors)
        setSuccess(true);
      }
    });
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        <Card className="w-full max-w-md p-8 bg-slate-800/50 border-slate-700 backdrop-blur-sm">
          <div className="text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-emerald-400" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold text-white">
                Check your inbox
              </h1>
              <p className="text-slate-400">
                If you have an account, we&apos;ve sent a login link to{" "}
                <span className="text-white font-medium">{email}</span>
              </p>
            </div>

            <div className="pt-4 border-t border-slate-700">
              <p className="text-sm text-slate-500">
                The link expires in 30 minutes. Check your spam folder if you don&apos;t see the message.
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

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
                Secure Secret Portal
              </h1>
              <p className="text-slate-400">
                Securely transfer your credentials
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <Field
              label="Email address"
              description="Use your work email address"
            >
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john.doe@company.com"
                  className="pl-10 bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-500"
                  disabled={isPending}
                  required
                />
              </div>
            </Field>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={isPending}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3"
            >
              {isPending ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Sending...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Send login link
                  <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="pt-6 border-t border-slate-700">
            <p className="text-center text-sm text-slate-500">
              After clicking the link in the email, you will be redirected
              to the credential deposit form.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

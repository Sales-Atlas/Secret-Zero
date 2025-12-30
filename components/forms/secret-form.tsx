"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { depositFormSchema, type DepositFormData } from "@/schemas/deposit";
import { encryptPayload } from "@/lib/crypto";
import { depositSecretAction } from "@/actions/deposit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import {
  Globe,
  User,
  KeyRound,
  Key,
  Send,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
} from "lucide-react";

interface SecretFormProps {
  organizationSlug: string;
  userEmail: string;
}

export function SecretForm({ organizationSlug, userEmail }: SecretFormProps) {
  const [isPending, startTransition] = useTransition();
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showToken, setShowToken] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<DepositFormData>({
    resolver: zodResolver(depositFormSchema),
    defaultValues: {
      url: "",
      login: "",
      password: "",
      apiToken: "",
    },
  });

  const onSubmit = async (data: DepositFormData) => {
    setSubmitStatus("idle");
    setErrorMessage(null);

    startTransition(async () => {
      try {
        // Get public key
        const publicKey = process.env.NEXT_PUBLIC_SERVER_PUBLIC_KEY;
        
        if (!publicKey) {
          throw new Error("Missing server public key");
        }

        // Encrypt data in browser
        const encryptedPayload = await encryptPayload(
          {
            url: data.url,
            login: data.login || undefined,
            password: data.password || undefined,
            apiToken: data.apiToken || undefined,
          },
          publicKey
        );

        // Send encrypted data to server
        const result = await depositSecretAction({
          ...encryptedPayload,
          organizationSlug,
        });

        if (result.success) {
          setSubmitStatus("success");
          reset();
        } else {
          setSubmitStatus("error");
          setErrorMessage(result.error || "An error occurred");
        }
      } catch (error) {
        console.error("Encryption error:", error);
        setSubmitStatus("error");
        setErrorMessage("Data encryption error");
      }
    });
  };

  if (submitStatus === "success") {
    return (
      <div className="text-center space-y-6 py-8">
        <div className="mx-auto w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center">
          <CheckCircle className="w-10 h-10 text-emerald-400" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-white">
            Data submitted successfully
          </h2>
          <p className="text-slate-400">
            Your credentials have been securely saved in our vault.
          </p>
        </div>
        <Button
          onClick={() => setSubmitStatus("idle")}
          className="bg-slate-700 hover:bg-slate-600 text-white"
        >
          Add more credentials
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* URL - required */}
      <Field
        label="Application URL"
        description="Full address of login page or API"
        invalid={!!errors.url}
        error={errors.url?.message}
      >
        <div className="relative">
          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <Input
            {...register("url")}
            type="url"
            placeholder="https://app.example.com"
            className="pl-10 bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-emerald-500"
            disabled={isPending}
          />
        </div>
      </Field>

      {/* Login - optional */}
      <Field
        label="Login"
        description="Username or email address (optional)"
        invalid={!!errors.login}
        error={errors.login?.message}
      >
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <Input
            {...register("login")}
            type="text"
            placeholder="admin@example.com"
            className="pl-10 bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-emerald-500"
            disabled={isPending}
          />
        </div>
      </Field>

      {/* Password - optional */}
      <Field
        label="Password"
        description="Application password (optional)"
        invalid={!!errors.password}
        error={errors.password?.message}
      >
        <div className="relative">
          <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <Input
            {...register("password")}
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            className="pl-10 pr-10 bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-emerald-500"
            disabled={isPending}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
          >
            {showPassword ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        </div>
      </Field>

      {/* API Token - optional */}
      <Field
        label="API Token"
        description="API key or access token (optional)"
        invalid={!!errors.apiToken}
        error={errors.apiToken?.message}
      >
        <div className="relative">
          <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <Input
            {...register("apiToken")}
            type={showToken ? "text" : "password"}
            placeholder="sk-xxx..."
            className="pl-10 pr-10 bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-emerald-500"
            disabled={isPending}
          />
          <button
            type="button"
            onClick={() => setShowToken(!showToken)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
          >
            {showToken ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        </div>
      </Field>

      {/* Error message */}
      {submitStatus === "error" && errorMessage && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-400 font-medium">Submission error</p>
            <p className="text-red-400/80 text-sm">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Submit button */}
      <Button
        type="submit"
        disabled={isPending}
        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3"
      >
        {isPending ? (
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Encrypting and sending...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Send className="w-4 h-4" />
            Send securely
          </span>
        )}
      </Button>

      {/* Security note */}
      <p className="text-xs text-slate-500 text-center">
        By clicking &quot;Send&quot;, your data will be encrypted in your browser
        before transmission. Only the recipient can decrypt it.
      </p>
    </form>
  );
}

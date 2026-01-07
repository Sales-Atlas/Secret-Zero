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
  publicKey: string;
}

export function SecretForm({ organizationSlug, publicKey }: SecretFormProps) {
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
        // Validate public key is available
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
        console.error(
          '[SecretForm] Encryption error:',
          error instanceof Error ? error.message : 'Unknown error'
        );
        setSubmitStatus("error");
        setErrorMessage("Data encryption error");
      }
    });
  };

  if (submitStatus === "success") {
    return (
      <div className="text-center space-y-6 py-8">
        <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
          <CheckCircle className="w-10 h-10 text-primary" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-foreground">
            Data submitted successfully
          </h2>
          <p className="text-muted-foreground">
            Your credentials have been securely saved in our vault.
          </p>
        </div>
        <Button
          onClick={() => setSubmitStatus("idle")}
          variant="default"
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
        description="Full address of login page or API (https:// optional)"
        invalid={!!errors.url}
        error={errors.url?.message}
      >
        <div className="relative">
          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            {...register("url")}
            type="text"
            inputMode="url"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            placeholder="app.example.com"
            className="pl-10"
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
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            {...register("login")}
            type="text"
            placeholder="admin@example.com"
            className="pl-10"
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
          <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            {...register("password")}
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            className="pl-10 pr-10"
            disabled={isPending}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
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
          <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            {...register("apiToken")}
            type={showToken ? "text" : "password"}
            placeholder="sk-xxx..."
            className="pl-10 pr-10"
            disabled={isPending}
          />
          <button
            type="button"
            onClick={() => setShowToken(!showToken)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
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
        <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-destructive font-medium">Submission error</p>
            <p className="text-destructive/80 text-sm">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Submit button */}
      <Button
        type="submit"
        disabled={isPending}
        className="w-full font-medium py-3"
      >
        {isPending ? (
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
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
      <p className="text-xs text-muted-foreground text-center">
        By clicking &quot;Send&quot;, your data will be encrypted in your browser
        before transmission. Only the recipient can decrypt it.
      </p>
    </form>
  );
}

import Link from "next/link";
import Image from "next/image";
import { clientEnv } from "@/env";

/**
 * Application Footer Component
 *
 * Displays logo (clickable link), company name, and privacy policy link.
 * All configuration is pulled from environment variables with sensible fallbacks.
 */
export function Footer() {
  const logoPath = clientEnv.NEXT_PUBLIC_FOOTER_LOGO_PATH.trim();
  const rawLogoUrl = clientEnv.NEXT_PUBLIC_FOOTER_LOGO_URL;
  const rawPrivacyUrl = clientEnv.NEXT_PUBLIC_FOOTER_PRIVACY_URL;

  const isRemoteLogoPath = /^https?:\/\//i.test(logoPath);

  const logoUrl =
    rawLogoUrl === ""
      ? null
      : rawLogoUrl ?? clientEnv.NEXT_PUBLIC_APP_URL ?? "/";

  const privacyUrl =
    rawPrivacyUrl === ""
      ? null
      : rawPrivacyUrl ?? clientEnv.NEXT_PUBLIC_APP_URL ?? "/";
  const companyName = clientEnv.NEXT_PUBLIC_FOOTER_COMPANY_NAME;

  const logo =
    logoPath.length > 0 ? (
      isRemoteLogoPath ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoPath}
          alt={companyName}
          width={132}
          height={24}
          className="h-6 w-auto"
          loading="lazy"
          decoding="async"
        />
      ) : (
        <Image
          src={logoPath}
          alt={companyName}
          width={132}
          height={24}
          className="h-6 w-auto"
          priority={false}
        />
      )
    ) : null;

  return (
    <footer className="w-full border-t bg-card">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          {/* Logo - Left */}
          {logo ? (
            logoUrl ? (
              <Link href={logoUrl} className="flex-shrink-0">
                {logo}
              </Link>
            ) : (
              <div className="flex-shrink-0">
                {logo}
              </div>
            )
          ) : null}

          {/* Company Name - Center */}
          <p className="text-sm text-muted-foreground">
            {companyName}
          </p>

          {/* Privacy Policy Link - Right */}
          {privacyUrl ? (
            <Link
              href={privacyUrl}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Privacy Policy
            </Link>
          ) : (
            <span
              aria-disabled="true"
              className="text-sm text-muted-foreground"
            >
              Privacy Policy
            </span>
          )}
        </div>
      </div>
    </footer>
  );
}

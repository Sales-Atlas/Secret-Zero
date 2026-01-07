import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Secure Secret Portal",
  description: "Securely transfer your credentials to our vault",
  robots: "noindex, nofollow", // Do not index - internal application
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased bg-slate-900 text-slate-100">
        {children}
      </body>
    </html>
  );
}

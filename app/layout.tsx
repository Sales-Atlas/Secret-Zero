import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-sans",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Secure Secret Portal | ISCP",
  description: "Bezpiecznie przekaż dane dostępowe do naszego skarbca",
  robots: "noindex, nofollow", // Nie indeksuj - aplikacja wewnętrzna
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans antialiased bg-slate-900 text-slate-100">
        {children}
      </body>
    </html>
  );
}

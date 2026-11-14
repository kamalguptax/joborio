import type { Metadata } from "next";
import { Geist_Mono, Manrope } from "next/font/google";
import "./globals.css";
import SiteChrome from "@/components/SiteChrome";
import CookieConsent from "@/components/cookies/CookieConsent";
import { APP_NAME } from "@/lib/config";

/** Single brand family — weights used site-wide. */
const brand = Manrope({
  subsets: ["latin"],
  variable: "--font-brand",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: APP_NAME, template: `%s | ${APP_NAME}` },
  description:
    "Find jobs, creators and opportunities. Earn USD on verified clicks and registrations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${brand.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-body antialiased">
        <SiteChrome>{children}</SiteChrome>
        <CookieConsent />
      </body>
    </html>
  );
}

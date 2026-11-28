import type { Metadata } from "next";
import { Geist_Mono, Manrope, Young_Serif } from "next/font/google";
import "./globals.css";
import SiteChrome from "@/components/SiteChrome";
import CookieConsent from "@/components/cookies/CookieConsent";
import ChatWidget from "@/components/chatbot/ChatWidget";
import { APP_NAME } from "@/lib/config";

/** Single brand family — weights used site-wide. */
const brand = Manrope({
  subsets: ["latin"],
  variable: "--font-brand",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

/** Display serif used only for editorial section headings (e.g. creators timeline). */
const serif = Young_Serif({
  subsets: ["latin"],
  variable: "--font-serif",
  weight: "400",
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: APP_NAME, template: `%s | ${APP_NAME}` },
  description:
    "Find opportunities. Grow your career. Earn on verified clicks and registrations with Upclift.",
  icons: {
    icon: [{ url: "/favicon.ico" }, { url: "/images/upclift-icon.png", type: "image/png" }],
    apple: "/images/upclift-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${brand.variable} ${serif.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-body antialiased">
        <SiteChrome>{children}</SiteChrome>
        <ChatWidget />
        <CookieConsent />
      </body>
    </html>
  );
}

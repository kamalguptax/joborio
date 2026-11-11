import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "CreatorHub",
  description: "Creator-led hiring and monetization platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="text-white antialiased">
        <Header />

          <main className="text-white">{children}</main>

        <Footer />
      </body>
    </html>
  );
}

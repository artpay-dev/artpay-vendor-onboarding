import type { Metadata } from "next";
import { Inter, Inter_Tight } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import Logo from "@/components/Logo";
import Script from "next/script";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "artpay Onboarding",
  description: "artpay on boarding application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it">
      <body
        className={`${inter.variable} ${interTight.variable} antialiased`}
      >
        <header className="border-b bg-background">
          <div className="container mx-auto px-6 h-14 flex items-center">
            <Logo />
          </div>
        </header>
        {children}
        <Toaster />
        <Script
          src="https://embed.tawk.to/67ee9c6e38d5da19111fcda7/1inu164qh"
          strategy="lazyOnload"
          crossOrigin="*"
          charSet="UTF-8"
        />
      </body>
    </html>
  );
}

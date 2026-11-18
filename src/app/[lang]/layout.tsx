import type { Metadata } from "next";
import "./globals.css";
import "@sarunyu/system-one/styles.css";
// After the design system's stylesheet, always — it overrides that sheet's sizes.
import "./typography.css";
import { Noto_Sans_Thai } from "next/font/google";
import { cn } from "@/lib/utils";

const notoSansThai = Noto_Sans_Thai({
  subsets: ["thai", "latin"],
  weight: ["400", "600", "700"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Yuanta Agent Portal",
  description: "AI-Powered Relationship Manager Platform for Wealth Management",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th" className={cn("h-full", "font-sans", notoSansThai.variable)}>
      <body className="h-full bg-background antialiased">{children}</body>
    </html>
  );
}

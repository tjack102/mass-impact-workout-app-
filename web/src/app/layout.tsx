import type { Metadata } from "next";
import type { Viewport } from "next";
import { JetBrains_Mono, Source_Sans_3, Teko } from "next/font/google";
import { cookies } from "next/headers";
import { AppShell } from "@/components/app-shell";
import "./globals.css";

const teko = Teko({
  variable: "--font-display",
  subsets: ["latin"],
});

const sourceSans = Source_Sans_3({
  variable: "--font-ui",
  subsets: ["latin"],
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Mass Impact",
    template: "%s | Mass Impact",
  },
  description: "Shared workout PWA for fast in-session logging and planning.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icon.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Mass Impact",
  },
};

export const viewport: Viewport = {
  themeColor: "#0B0D10",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const initialUnlocked = cookieStore.get("mi_household_unlocked")?.value === "1";
  const initialOwnerUnlocked = cookieStore.get("mi_owner_unlocked")?.value === "1";

  return (
    <html lang="en">
      <body className={`${teko.variable} ${sourceSans.variable} ${mono.variable}`}>
        <AppShell initialUnlocked={initialUnlocked} initialOwnerUnlocked={initialOwnerUnlocked}>
          {children}
        </AppShell>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import type { Viewport } from "next";
import {
  Barlow_Condensed,
  Bebas_Neue,
  Black_Ops_One,
  DM_Sans,
  Exo_2,
  IBM_Plex_Mono,
  JetBrains_Mono,
  Orbitron,
  Source_Sans_3,
  Share_Tech_Mono,
  Teko,
} from "next/font/google";
import { AppShell } from "@/components/app-shell";
import "./globals.css";

const teko = Teko({ variable: "--font-teko", subsets: ["latin"] });
const sourceSans = Source_Sans_3({ variable: "--font-source-sans", subsets: ["latin"] });
const jetbrainsMono = JetBrains_Mono({ variable: "--font-jetbrains-mono", subsets: ["latin"] });
const blackOpsOne = Black_Ops_One({ variable: "--font-black-ops-one", weight: "400", subsets: ["latin"] });
const barlowCondensed = Barlow_Condensed({
  variable: "--font-barlow-condensed",
  weight: ["400", "600"],
  subsets: ["latin"],
});
const shareTechMono = Share_Tech_Mono({ variable: "--font-share-tech-mono", weight: "400", subsets: ["latin"] });
const orbitron = Orbitron({ variable: "--font-orbitron", subsets: ["latin"] });
const exo2 = Exo_2({ variable: "--font-exo2", subsets: ["latin"] });
const bebasNeue = Bebas_Neue({ variable: "--font-bebas-neue", weight: "400", subsets: ["latin"] });
const dmSans = DM_Sans({ variable: "--font-dm-sans", subsets: ["latin"] });
const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  weight: ["400", "500"],
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${teko.variable} ${sourceSans.variable} ${jetbrainsMono.variable} ${blackOpsOne.variable} ${barlowCondensed.variable} ${shareTechMono.variable} ${orbitron.variable} ${exo2.variable} ${bebasNeue.variable} ${dmSans.variable} ${ibmPlexMono.variable}`}
      >
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var t=localStorage.getItem('mi_theme');if(t){var m={'iron-ledger':'#0B0D10','warzone':'#0a0a0a','neon-overload':'#08080f','concrete':'#d4cfc8'};var c=m[t];if(c){document.documentElement.setAttribute('data-theme',t);var e=document.querySelector('meta[name=\"theme-color\"]');if(e)e.setAttribute('content',c)}}}catch(e){}",
          }}
        />
        <AppShell>
          {children}
        </AppShell>
      </body>
    </html>
  );
}

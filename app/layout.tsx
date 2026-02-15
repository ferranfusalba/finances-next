import type { Metadata, Viewport } from "next";
import { SessionProvider } from "next-auth/react";
import localFont from "next/font/local";

import { auth } from "@/auth";
import "./globals.css";

import BottomNav from "@/components/nav/BottomNav/BottomNav";
import TopNav from "@/components/nav/TopNav/TopNav";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";

import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: "Finances",
  description: "Personal finance management",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Finances",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1.0,
  maximumScale: 1.0,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

const ibmPlexSans = localFont({
  src: "../public/fonts/IBM_Plex_Sans/IBMPlexSans-VariableFont_wdth,wght.ttf",
  weight: "400",
  style: "normal",
  variable: "--font-ibm-plex-sans",
});

const ibmPlexMono = localFont({
  src: [
    {
      path: "../public/fonts/IBM_Plex_Mono/IBMPlexMono-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/IBM_Plex_Mono/IBMPlexMono-Italic.ttf",
      weight: "400",
      style: "italic",
    },
    {
      path: "../public/fonts/IBM_Plex_Mono/IBMPlexMono-Bold.ttf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../public/fonts/IBM_Plex_Mono/IBMPlexMono-BoldItalic.ttf",
      weight: "700",
      style: "italic",
    },
  ],
  variable: "--font-ibm-plex-mono",
});

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const serverSession = await auth();

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${ibmPlexSans.variable} ${ibmPlexMono.variable}`}
    >
      <body>
        <ServiceWorkerRegister />
        <SessionProvider session={serverSession}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <header className="fixed top-0 w-full z-10">
              <TopNav />
            </header>
            <main className="pt-16 pb-16 md:pb-12 h-screen">
              <Toaster />
              {children}
            </main>
            <footer
              className={`fixed bottom-0 w-full h-auto ${!serverSession?.user ? "hidden" : ""}`}
            >
              <BottomNav />
            </footer>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}

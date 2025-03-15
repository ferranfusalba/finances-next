import type { Metadata, Viewport } from "next";
import { SessionProvider } from "next-auth/react";
import localFont from "next/font/local";

import { auth } from "@/auth";
import "./globals.css";

import BottomNav from "@/components/nav/BottomNav/BottomNav";
import TopNav from "@/components/nav/TopNav/TopNav";

import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: "Finances Next",
  description: "Generated by create next app",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1.0,
  maximumScale: 1.0,
  userScalable: false,
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
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link
          rel="icon"
          href="/icon?<generated>"
          type="image/<generated>"
          sizes="<generated>"
        />
        <link
          rel="apple-touch-icon"
          href="/apple-icon?<generated>"
          type="image/<generated>"
          sizes="<generated>"
        />
      </head>
      <body>
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
            {serverSession?.user && (
              <footer className="fixed bottom-0 w-full h-auto">
                <BottomNav />
              </footer>
            )}
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}

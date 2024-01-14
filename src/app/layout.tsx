import TabBar from "@/components/TabBar/TabBar";
import "./globals.css";
import type { Metadata } from "next";
import { Inter, IBM_Plex_Sans } from "next/font/google";
import TopBar from "@/components/TopBar/TopBar";
import { SessionProvider } from "next-auth/react";
import { auth } from "@/auth";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });
const ibm = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  style: ["italic", "normal"],
});

export const metadata: Metadata = {
  title: "Finances Next",
  description: "Generated by create next app",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  return (
    <html lang="en">
      <body className={`${ibm.className} bg-slate-800 text-slate-100`}>
        <SessionProvider session={session}>
          <header className="top-bar">
            <TopBar />
          </header>
          <main>
            <Toaster />
            {children}
          </main>
          <footer className="absolute bottom-0 w-full">
            <TabBar />
          </footer>
        </SessionProvider>
      </body>
    </html>
  );
}

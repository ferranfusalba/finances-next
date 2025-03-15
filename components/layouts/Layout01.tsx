import React from "react";

export default function Layout01({ children }: { children: React.ReactNode }) {
  return (
    <main className="layout-01 pt-11 h-screen-main-mobile md:h-screen-main-desktop">
      {children}
    </main>
  );
}

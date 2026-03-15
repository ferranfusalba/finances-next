import React from "react";

export default function Layout01({ children }: { children: React.ReactNode }) {
  return (
    <main className="layout-01 flex-1">
      {children}
    </main>
  );
}

import React from "react";

export default function Layout01({ children }: { children: React.ReactNode }) {
  return (
    <main className="h-full-main-mobile md:h-full-main pt-11">{children}</main>
  );
}

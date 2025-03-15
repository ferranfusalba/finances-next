import React from "react";

export default function Layout02b({ children }: { children: React.ReactNode }) {
  return (
    <div className="layout-02b pb-20 w-full flex flex-col justify-start items-start">
      {children}
    </div>
  );
}

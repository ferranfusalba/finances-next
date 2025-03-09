import React from "react";

export default function Layout02b({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-full w-full flex justify-center items-center pb-20 md:pb-12">
      {children}
    </div>
  );
}

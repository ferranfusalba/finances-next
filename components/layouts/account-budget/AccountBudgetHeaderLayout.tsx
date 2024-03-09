import React from "react";

export default function AccountBudgetHeaderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="grid grid-cols-12 py-6">{children}</div>;
}

import React from "react";

export default function AccountBudgetTableLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="py-2">{children}</div>;
}

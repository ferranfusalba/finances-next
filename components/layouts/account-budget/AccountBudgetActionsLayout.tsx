import React from "react";

export default function AccountBudgetActionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="flex justify-between py-2">{children}</div>;
}

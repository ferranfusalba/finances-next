"use client";

import { useState } from "react";
import { FitToWidth } from "@carbon/icons-react";

import { Button } from "@/components/ui/button";

export default function AccountTransactionExpandable({
  actions,
  children,
}: {
  actions: React.ReactNode;
  children: React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <div className="layout-02a1 m-auto w-11/12 xl:w-9/12">
        <div className="flex justify-between py-2">
          <div className="flex gap-2">{actions}</div>
          <Button
            variant={expanded ? "default" : "outline"}
            size="icon"
            onClick={() => setExpanded(!expanded)}
            className="hidden select-none xl:flex"
          >
            <FitToWidth />
          </Button>
        </div>
      </div>
      <div
        className={`m-auto pb-20 transition-[width] duration-300 ease-in-out ${
          expanded ? "w-full px-4" : "w-11/12 xl:w-9/12"
        }`}
      >
        <div className="py-2">{children}</div>
      </div>
    </>
  );
}

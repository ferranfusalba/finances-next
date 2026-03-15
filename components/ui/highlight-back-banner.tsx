"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "@carbon/icons-react";

import { Button } from "@/components/ui/button";

export default function HighlightBackBanner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const highlightId = searchParams.get("highlightId");
  const fromLabel = searchParams.get("fromLabel");

  if (!highlightId || !fromLabel) return null;

  return (
    <div className="fixed top-0 w-full z-20 flex items-center gap-2 bg-slate-700 px-4 py-1.5 select-none pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">
      <Button
        variant="ghost"
        size="sm"
        className="gap-2 text-slate-200 hover:text-white"
        onClick={() => router.back()}
      >
        <ArrowLeft className="h-4 w-4" />
        Go back to {fromLabel}
      </Button>
    </div>
  );
}

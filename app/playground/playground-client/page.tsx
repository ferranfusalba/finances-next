"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import Layout02b from "@/components/layouts/Layout02b";

const PlaygroundClientPage = () => {
  return (
    <Layout02b>
      {/* Toast Notifications */}
      <div className="m-2 flex flex-wrap gap-2">
        <Button
          variant="outline"
          onClick={() => toast("Default notification", { description: "This is a default toast" })}
        >
          Toast Default
        </Button>
        <Button
          variant="outline"
          onClick={() => toast.success("Success notification", { description: "This is a success toast" })}
        >
          Toast Success
        </Button>
        <Button
          variant="outline"
          onClick={() => toast.error("Error notification", { description: "This is an error toast" })}
        >
          Toast Error
        </Button>
        <Button
          variant="outline"
          onClick={() => toast.warning("Warning notification", { description: "This is a warning toast" })}
        >
          Toast Warning
        </Button>
        <Button
          variant="outline"
          onClick={() => toast.info("Info notification", { description: "This is an info toast" })}
        >
          Toast Info
        </Button>
        <Button
          variant="outline"
          onClick={() => toast.loading("Loading notification", { description: "This is a loading toast" })}
        >
          Toast Loading
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            toast.promise(new Promise((resolve) => setTimeout(resolve, 2000)), {
              loading: "Loading...",
              success: "Promise resolved!",
              error: "Promise rejected!",
            });
          }}
        >
          Toast Promise
        </Button>
      </div>
      <div className="m-2">
        <span className="font-mono p-1 mx-2 rounded-md bg-sky-300 text-yellow-400">
          ARS
        </span>
        <span className="font-mono p-1 mx-2 border-solid border-2 rounded-md border-sky-300 text-yellow-400">
          ARS
        </span>
        <span className="font-mono p-1 mx-2 border-solid border-2 rounded-md border-sky-300 text-slate-50">
          ARS
        </span>
      </div>
      <div className="m-2">
        <span className="font-mono p-1 mx-2 rounded-md bg-blue-950 text-slate-50">
          AUD
        </span>
        <span className="font-mono p-1 mx-2 border-solid border-2 rounded-md border-blue-950 text-slate-50">
          AUD
        </span>
      </div>
      <div className="m-2">
        <span className="font-mono p-1 mx-2 rounded-md bg-red-600 text-slate-50">
          CAD
        </span>
        <span className="font-mono p-1 mx-2 border-solid border-2 rounded-md border-red-600 text-slate-50">
          CAD
        </span>
      </div>
      <div className="m-2">
        <span className="font-mono p-1 mx-2 rounded-md bg-red-700 text-slate-50">
          CHF
        </span>
        <span className="font-mono p-1 mx-2 border-solid border-2 rounded-md border-red-700 text-slate-50">
          CHF
        </span>
      </div>
      <div className="m-2">
        <span className="font-mono p-1 mx-2 rounded-md bg-blue-800 text-amber-300">
          EUR
        </span>
        <span className="font-mono p-1 mx-2 border-solid border-2 rounded-md border-blue-800 text-amber-300">
          EUR
        </span>
        <span className="font-mono p-1 mx-2 border-solid border-2 rounded-md border-blue-800 text-slate-50">
          EUR
        </span>
      </div>
      <div className="m-2">
        <span className="font-mono p-1 mx-2 rounded-md bg-blue-950 text-red-600">
          NZD
        </span>
        <span className="font-mono p-1 mx-2 border-solid border-2 rounded-md border-blue-950 text-red-600">
          NZD
        </span>
        <span className="font-mono p-1 mx-2 border-solid border-2 rounded-md border-blue-950 text-slate-50">
          NZD
        </span>
      </div>
      <div className="m-2">
        <span className="font-mono p-1 mx-2 rounded-md bg-lime-900 text-slate-50">
          USD
        </span>
        <span className="font-mono p-1 mx-2 border-solid border-2 rounded-md border-lime-900 text-slate-50">
          USD
        </span>
      </div>
    </Layout02b>
  );
};

export default PlaygroundClientPage;

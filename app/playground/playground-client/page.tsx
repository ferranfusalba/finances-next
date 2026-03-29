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
    </Layout02b>
  );
};

export default PlaygroundClientPage;

import { Button } from "@/components/ui/button";
import Link from "next/link";

export const SettingsSidebar = () => {
  return (
    <aside className="w-80 p-6">
      <div className="py-2">
        <Button asChild>
          <Link href="/settings">Settings</Link>
        </Button>
      </div>
      <div className="py-2">
        <Button asChild>
          <Link href="/settings/server">Server</Link>
        </Button>
      </div>
      <div className="py-2">
        <Button asChild>
          <Link href="/settings/client">Client</Link>
        </Button>
      </div>
      <div className="py-2">
        <Button asChild>
          <Link href="/settings/admin">Admin</Link>
        </Button>
      </div>
    </aside>
  );
};

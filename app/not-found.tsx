import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function NotFound() {
  return (
    <section className="h-full w-full flex flex-col gap-2 justify-center items-center">
      <h1>404</h1>
      <Link href="/">
        <Button>Return</Button>
      </Link>
    </section>
  );
}

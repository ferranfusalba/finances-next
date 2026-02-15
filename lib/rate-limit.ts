import { headers } from "next/headers";

interface RateLimitEntry {
  timestamps: number[];
}

const stores = new Map<string, Map<string, RateLimitEntry>>();

export function createRateLimiter(options: {
  name: string;
  interval: number;
  maxRequests: number;
}) {
  if (!stores.has(options.name)) {
    stores.set(options.name, new Map());
  }
  const store = stores.get(options.name)!;

  return {
    check(key: string): { success: boolean } {
      const now = Date.now();
      const windowStart = now - options.interval;

      const entry = store.get(key);
      const timestamps = entry
        ? entry.timestamps.filter((t) => t > windowStart)
        : [];

      if (timestamps.length >= options.maxRequests) {
        store.set(key, { timestamps });
        return { success: false };
      }

      timestamps.push(now);
      store.set(key, { timestamps });
      return { success: true };
    },
  };
}

export async function getClientIp(): Promise<string> {
  const headersList = await headers();
  return (
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
  );
}

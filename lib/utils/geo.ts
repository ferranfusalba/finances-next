import { headers } from "next/headers";

/**
 * Detects the user's country code (ISO 3166-1 alpha-2) server-side.
 *
 * 1. Vercel geo header (production/preview)
 * 2. Cloudflare trace endpoint (local dev fallback)
 * 3. ipapi.co endpoint (second fallback)
 *
 * Returns empty string if all methods fail.
 */
export async function detectCountry(): Promise<string> {
  // 1. Vercel geo header
  const headersList = await headers();
  const vercelCountry = headersList.get("x-vercel-ip-country");
  if (vercelCountry) return vercelCountry;

  // 2. Cloudflare trace
  try {
    const res = await fetch("https://1.1.1.1/cdn-cgi/trace", {
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      const text = await res.text();
      const match = text.match(/loc=([A-Z]{2})/);
      if (match) return match[1];
    }
  } catch {
    // fall through
  }

  // 3. ipapi.co
  try {
    const res = await fetch("https://ipapi.co/country_code/", {
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      const code = (await res.text()).trim();
      if (/^[A-Z]{2}$/.test(code)) return code;
    }
  } catch {
    // fall through
  }

  return "";
}

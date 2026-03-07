import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";

const MAPBOX_ACCESS_TOKEN = process.env.MAPBOX_ACCESS_TOKEN;

export async function GET(request: NextRequest) {
  const user = await currentUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!MAPBOX_ACCESS_TOKEN) {
    return NextResponse.json(
      { error: "Mapbox is not configured" },
      { status: 500 }
    );
  }

  const query = request.nextUrl.searchParams.get("q");
  if (!query || query.length < 2) {
    return NextResponse.json({ suggestions: [] });
  }

  const sessionToken = request.nextUrl.searchParams.get("session_token") ?? "";
  const proximity = request.nextUrl.searchParams.get("proximity") ?? "";

  const params = new URLSearchParams({
    q: query,
    access_token: MAPBOX_ACCESS_TOKEN,
    session_token: sessionToken,
    limit: "5",
    language: "en",
    types: "poi,address,place",
  });

  if (proximity) {
    params.set("proximity", proximity);
  }

  const res = await fetch(
    `https://api.mapbox.com/search/searchbox/v1/suggest?${params.toString()}`
  );

  if (!res.ok) {
    return NextResponse.json(
      { error: "Mapbox API error" },
      { status: res.status }
    );
  }

  const data = await res.json();

  const suggestions = (data.suggestions ?? []).map(
    (s: {
      mapbox_id: string;
      name: string;
      full_address?: string;
      place_formatted?: string;
    }) => ({
      mapboxId: s.mapbox_id,
      name: s.name,
      address: s.full_address || s.place_formatted || "",
    })
  );

  return NextResponse.json({ suggestions });
}

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

  const mapboxId = request.nextUrl.searchParams.get("id");
  if (!mapboxId) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const sessionToken = request.nextUrl.searchParams.get("session_token") ?? "";

  const params = new URLSearchParams({
    access_token: MAPBOX_ACCESS_TOKEN,
    session_token: sessionToken,
  });

  const res = await fetch(
    `https://api.mapbox.com/search/searchbox/v1/retrieve/${mapboxId}?${params.toString()}`
  );

  if (!res.ok) {
    return NextResponse.json(
      { error: "Mapbox API error" },
      { status: res.status }
    );
  }

  const data = await res.json();
  const feature = data.features?.[0];

  if (!feature) {
    return NextResponse.json({ error: "Place not found" }, { status: 404 });
  }

  const [lng, lat] = feature.geometry.coordinates;

  return NextResponse.json({
    location: {
      name: feature.properties.name ?? "",
      address: feature.properties.full_address ?? feature.properties.place_formatted ?? "",
      lat,
      lng,
      placeId: mapboxId,
    },
  });
}

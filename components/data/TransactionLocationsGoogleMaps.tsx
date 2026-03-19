"use client";

import { useMemo, useCallback, useState } from "react";
import {
  APIProvider,
  Map,
  AdvancedMarker,
  InfoWindow,
} from "@vis.gl/react-google-maps";

import type { LocationWithTransactions } from "@/lib/data";
import { currency as formatCurrency } from "@/lib/utils";

interface Props {
  locations: LocationWithTransactions[];
  userLocale?: string;
  mapStyle?: string;
}

const MAP_TYPE_IDS: Record<string, string> = {
  roadmap: "roadmap",
  satellite: "satellite",
  hybrid: "hybrid",
  terrain: "terrain",
};

export default function TransactionLocationsGoogleMaps({
  locations,
  userLocale = "en-US",
  mapStyle = "roadmap",
}: Props) {
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);

  const center = useMemo(() => {
    if (locations.length === 0) return { lat: 40, lng: 0 };
    const avgLat =
      locations.reduce((sum, l) => sum + l.location.lat, 0) / locations.length;
    const avgLng =
      locations.reduce((sum, l) => sum + l.location.lng, 0) / locations.length;
    return { lat: avgLat, lng: avgLng };
  }, [locations]);

  const handleMarkerClick = useCallback((placeId: string) => {
    setSelectedPlaceId((prev) => (prev === placeId ? null : placeId));
  }, []);

  if (locations.length === 0) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        No transactions with location data found
      </div>
    );
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

  return (
    <APIProvider apiKey={apiKey}>
      <Map
        defaultCenter={center}
        defaultZoom={6}
        mapTypeId={MAP_TYPE_IDS[mapStyle] ?? "roadmap"}
        mapId="transaction-locations"
        className="h-[calc(100vh-16rem)] md:h-[calc(100vh-14rem)] w-full rounded-md"
      >
        {locations.map((loc) => {
          const count = loc.transactions.length;
          const totalAmount = loc.transactions.reduce(
            (sum, t) => sum + t.amount,
            0,
          );
          const cur = loc.transactions[0]?.currency ?? "EUR";
          const size = Math.min(12 + count * 4, 40);
          const isSelected = selectedPlaceId === loc.location.placeId;

          return (
            <AdvancedMarker
              key={loc.location.placeId}
              position={{
                lat: loc.location.lat,
                lng: loc.location.lng,
              }}
              onClick={() => handleMarkerClick(loc.location.placeId)}
            >
              <div
                style={{
                  width: `${size}px`,
                  height: `${size}px`,
                  borderRadius: "50%",
                  backgroundColor: `#${loc.dominantColor}99`,
                  border: `2px solid #${loc.dominantColor}`,
                  cursor: "pointer",
                }}
              />
              {isSelected && (
                <InfoWindow
                  anchor={null}
                  position={{
                    lat: loc.location.lat,
                    lng: loc.location.lng,
                  }}
                  onCloseClick={() => setSelectedPlaceId(null)}
                >
                  <div className="text-sm">
                    <p className="font-semibold">{loc.location.name}</p>
                    {loc.location.address && (
                      <p className="text-slate-500">{loc.location.address}</p>
                    )}
                    <p className="mt-1">
                      {count} transaction{count !== 1 ? "s" : ""} &middot;{" "}
                      {formatCurrency(userLocale, cur).format(totalAmount)}
                    </p>
                    {loc.transactions[0]?.category && (
                      <p className="text-slate-500">{loc.transactions[0].category}</p>
                    )}
                  </div>
                </InfoWindow>
              )}
            </AdvancedMarker>
          );
        })}
      </Map>
    </APIProvider>
  );
}

"use client";

import { useMemo } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

import type { LocationWithTransactions } from "@/lib/data";
import { currency as formatCurrency } from "@/lib/utils";

interface Props {
  locations: LocationWithTransactions[];
  userLocale?: string;
  mapStyle?: string;
}

export default function TransactionLocationsMap({
  locations,
  userLocale = "en-US",
  mapStyle = "streets-v12",
}: Props) {
  const center = useMemo<[number, number]>(() => {
    if (locations.length === 0) return [40, 0];
    const avgLat =
      locations.reduce((sum, l) => sum + l.location.lat, 0) / locations.length;
    const avgLng =
      locations.reduce((sum, l) => sum + l.location.lng, 0) / locations.length;
    return [avgLat, avgLng];
  }, [locations]);

  if (locations.length === 0) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        No transactions with location data found
      </div>
    );
  }

  return (
    <MapContainer
      key={mapStyle}
      center={center}
      zoom={6}
      className="h-[calc(100vh-16rem)] md:h-[calc(100vh-14rem)] w-full rounded-md"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.mapbox.com/">Mapbox</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url={`https://api.mapbox.com/styles/v1/mapbox/${mapStyle}/tiles/{z}/{x}/{y}?access_token=${process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}`}
        tileSize={512}
        zoomOffset={-1}
      />
      {locations.map((loc) => {
        const count = loc.transactions.length;
        const totalAmount = loc.transactions.reduce(
          (sum, t) => sum + t.amount,
          0,
        );
        const cur = loc.transactions[0]?.currency ?? "EUR";

        return (
          <CircleMarker
            key={loc.location.placeId}
            center={[loc.location.lat, loc.location.lng]}
            radius={Math.min(6 + count * 2, 20)}
            pathOptions={{
              color: `#${loc.dominantColor}`,
              fillColor: `#${loc.dominantColor}`,
              fillOpacity: 0.6,
            }}
          >
            <Popup>
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
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}

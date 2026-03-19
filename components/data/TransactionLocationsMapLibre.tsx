"use client";

import { useEffect, useMemo, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import type { LocationWithTransactions } from "@/lib/data";
import { currency as formatCurrency } from "@/lib/utils";

interface Props {
  locations: LocationWithTransactions[];
  userLocale?: string;
  mapStyle?: string;
}

export default function TransactionLocationsMapLibre({
  locations,
  userLocale = "en-US",
  mapStyle = "streets-v2",
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  const center = useMemo<[number, number]>(() => {
    if (locations.length === 0) return [0, 40];
    const avgLng =
      locations.reduce((sum, l) => sum + l.location.lng, 0) / locations.length;
    const avgLat =
      locations.reduce((sum, l) => sum + l.location.lat, 0) / locations.length;
    return [avgLng, avgLat];
  }, [locations]);

  useEffect(() => {
    if (!containerRef.current || locations.length === 0) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: `https://api.maptiler.com/maps/${mapStyle}/style.json?key=${process.env.NEXT_PUBLIC_MAPTILER_API_KEY}`,
      center,
      zoom: 5,
    });

    mapRef.current = map;

    map.on("load", () => {
      for (const loc of locations) {
        const count = loc.transactions.length;
        const totalAmount = loc.transactions.reduce(
          (sum, t) => sum + t.amount,
          0,
        );
        const cur = loc.transactions[0]?.currency ?? "EUR";

        const el = document.createElement("div");
        const size = Math.min(12 + count * 4, 40);
        el.style.width = `${size}px`;
        el.style.height = `${size}px`;
        el.style.borderRadius = "50%";
        const color = loc.dominantColor;
        el.style.backgroundColor = `#${color}99`;
        el.style.border = `2px solid #${color}`;
        el.style.cursor = "pointer";

        const popupContent = [
          `<div class="text-sm">`,
          `<p style="font-weight:600">${loc.location.name}</p>`,
          loc.location.address
            ? `<p style="color:#64748b">${loc.location.address}</p>`
            : "",
          `<p style="margin-top:4px">${count} transaction${count !== 1 ? "s" : ""} · ${formatCurrency(userLocale, cur).format(totalAmount)}</p>`,
          loc.transactions[0]?.category
            ? `<p style="color:#64748b">${loc.transactions[0].category}</p>`
            : "",
          `</div>`,
        ].join("");

        const popup = new maplibregl.Popup({ offset: size / 2 }).setHTML(
          popupContent,
        );

        new maplibregl.Marker({ element: el })
          .setLngLat([loc.location.lng, loc.location.lat])
          .setPopup(popup)
          .addTo(map);
      }
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [locations, center, userLocale, mapStyle]);

  if (locations.length === 0) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        No transactions with location data found
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-[calc(100vh-16rem)] md:h-[calc(100vh-14rem)] w-full rounded-md"
    />
  );
}

"use client";

import { useEffect, useMemo, useRef } from "react";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import OSM from "ol/source/OSM";
import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import Overlay from "ol/Overlay";
import { fromLonLat } from "ol/proj";
import { Circle, Fill, Stroke, Style } from "ol/style";
import "ol/ol.css";

import type { LocationWithTransactions } from "@/lib/data";
import { currency as formatCurrency } from "@/lib/utils";

interface Props {
  locations: LocationWithTransactions[];
  userLocale?: string;
}

export default function TransactionLocationsOpenLayers({
  locations,
  userLocale = "en-US",
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);

  const center = useMemo<[number, number]>(() => {
    if (locations.length === 0) return [0, 40];
    const avgLng =
      locations.reduce((sum, l) => sum + l.location.lng, 0) / locations.length;
    const avgLat =
      locations.reduce((sum, l) => sum + l.location.lat, 0) / locations.length;
    return [avgLng, avgLat];
  }, [locations]);

  useEffect(() => {
    if (!containerRef.current || !popupRef.current || locations.length === 0)
      return;

    const features = locations.map((loc) => {
      const count = loc.transactions.length;
      const totalAmount = loc.transactions.reduce(
        (sum, t) => sum + t.amount,
        0,
      );
      const cur = loc.transactions[0]?.currency ?? "EUR";
      const radius = Math.min(6 + count * 2, 20);

      const color = loc.dominantColor;
      const category = loc.transactions[0]?.category ?? "";

      const feature = new Feature({
        geometry: new Point(fromLonLat([loc.location.lng, loc.location.lat])),
        name: loc.location.name,
        address: loc.location.address,
        count,
        totalAmount,
        currency: cur,
        category,
      });

      feature.setStyle(
        new Style({
          image: new Circle({
            radius,
            fill: new Fill({ color: `#${color}99` }),
            stroke: new Stroke({ color: `#${color}`, width: 2 }),
          }),
        }),
      );

      return feature;
    });

    const vectorSource = new VectorSource({ features });

    const overlay = new Overlay({
      element: popupRef.current,
      autoPan: true,
    });

    const map = new Map({
      target: containerRef.current,
      layers: [
        new TileLayer({ source: new OSM() }),
        new VectorLayer({ source: vectorSource }),
      ],
      overlays: [overlay],
      view: new View({
        center: fromLonLat(center),
        zoom: 6,
      }),
    });

    mapRef.current = map;

    map.on("singleclick", (e) => {
      const feature = map.forEachFeatureAtPixel(e.pixel, (f) => f);
      if (feature) {
        const name = feature.get("name") as string;
        const address = feature.get("address") as string;
        const count = feature.get("count") as number;
        const totalAmount = feature.get("totalAmount") as number;
        const cur = feature.get("currency") as string;

        const category = feature.get("category") as string;

        popupRef.current!.innerHTML = [
          `<div class="text-sm bg-white text-black p-2 rounded shadow-md">`,
          `<p style="font-weight:600">${name}</p>`,
          address ? `<p style="color:#64748b">${address}</p>` : "",
          `<p style="margin-top:4px">${count} transaction${count !== 1 ? "s" : ""} · ${formatCurrency(userLocale, cur).format(totalAmount)}</p>`,
          category ? `<p style="color:#64748b">${category}</p>` : "",
          `</div>`,
        ].join("");

        const geometry = feature.getGeometry();
        if (geometry) {
          const point = geometry as Point;
          overlay.setPosition(point.getCoordinates());
        }
      } else {
        overlay.setPosition(undefined);
      }
    });

    map.on("pointermove", (e) => {
      const hit = map.forEachFeatureAtPixel(e.pixel, () => true);
      map.getTargetElement().style.cursor = hit ? "pointer" : "";
    });

    return () => {
      map.setTarget(undefined);
      mapRef.current = null;
    };
  }, [locations, center, userLocale]);

  if (locations.length === 0) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        No transactions with location data found
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className="h-[calc(100vh-16rem)] md:h-[calc(100vh-14rem)] w-full rounded-md"
      />
      <div ref={popupRef} />
    </div>
  );
}

"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

import type { LocationWithTransactions } from "@/lib/data";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

type MapProvider = "mapbox" | "carto" | "maptiler" | "osm" | "google";

const styleOptions: Record<MapProvider, { value: string; label: string }[]> = {
  mapbox: [
    { value: "streets-v12", label: "Streets" },
    { value: "satellite-streets-v12", label: "Satellite" },
    { value: "outdoors-v12", label: "Outdoors" },
    { value: "light-v11", label: "Light" },
    { value: "dark-v11", label: "Dark" },
    { value: "navigation-day-v1", label: "Navigation" },
  ],
  carto: [
    { value: "dark_all", label: "Dark" },
    { value: "light_all", label: "Light" },
    { value: "voyager", label: "Voyager" },
  ],
  maptiler: [
    { value: "streets-v2", label: "Streets" },
    { value: "satellite", label: "Satellite" },
    { value: "hybrid", label: "Hybrid" },
    { value: "topo-v2", label: "Topo" },
    { value: "basic-v2", label: "Basic" },
    { value: "dataviz-dark", label: "Dark" },
    { value: "outdoor-v2", label: "Outdoor" },
  ],
  google: [
    { value: "roadmap", label: "Roadmap" },
    { value: "satellite", label: "Satellite" },
    { value: "hybrid", label: "Hybrid" },
    { value: "terrain", label: "Terrain" },
  ],
  osm: [],
};

const defaultStyles: Record<MapProvider, string> = {
  mapbox: "streets-v12",
  carto: "dark_all",
  maptiler: "streets-v2",
  google: "roadmap",
  osm: "",
};

const MapboxMap = dynamic(
  () => import("@/components/data/TransactionLocationsMap"),
  { ssr: false },
);

const CartoMap = dynamic(
  () => import("@/components/data/TransactionLocationsMapCarto"),
  { ssr: false },
);

const MapTilerMap = dynamic(
  () => import("@/components/data/TransactionLocationsMapLibre"),
  { ssr: false },
);

const GoogleMap = dynamic(
  () => import("@/components/data/TransactionLocationsGoogleMaps"),
  { ssr: false },
);

const OsmMap = dynamic(
  () => import("@/components/data/TransactionLocationsOpenLayers"),
  { ssr: false },
);

interface Props {
  locations: LocationWithTransactions[];
  userLocale?: string;
}

export default function TransactionLocationsMapLoader({
  locations,
  userLocale,
}: Props) {
  const [provider, setProvider] = useState<MapProvider>("mapbox");
  const [styles, setStyles] = useState<Record<MapProvider, string>>(defaultStyles);

  const currentStyle = styles[provider];
  const options = styleOptions[provider];

  const handleProviderChange = (val: string) => {
    if (val) setProvider(val as MapProvider);
  };

  const handleStyleChange = (val: string) => {
    if (val) setStyles((prev) => ({ ...prev, [provider]: val }));
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <ToggleGroup
          type="single"
          value={provider}
          onValueChange={handleProviderChange}
          className="select-none overflow-x-auto max-w-full w-fit"
        >
          <ToggleGroupItem value="mapbox" size="sm">
            Mapbox
          </ToggleGroupItem>
          <ToggleGroupItem value="carto" size="sm">
            CARTO
          </ToggleGroupItem>
          <ToggleGroupItem value="maptiler" size="sm">
            MapTiler
          </ToggleGroupItem>
          <ToggleGroupItem value="google" size="sm">
            Google Maps
          </ToggleGroupItem>
          <ToggleGroupItem value="osm" size="sm">
            OpenStreetMap
          </ToggleGroupItem>
        </ToggleGroup>

        {options.length > 0 && (
          <ToggleGroup
            type="single"
            value={currentStyle}
            onValueChange={handleStyleChange}
            className="select-none overflow-x-auto max-w-full w-fit"
          >
            {options.map((opt) => (
              <ToggleGroupItem key={opt.value} value={opt.value} size="sm">
                {opt.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        )}
      </div>

      {provider === "mapbox" && (
        <MapboxMap
          locations={locations}
          userLocale={userLocale}
          mapStyle={currentStyle}
        />
      )}
      {provider === "carto" && (
        <CartoMap
          locations={locations}
          userLocale={userLocale}
          mapStyle={currentStyle}
        />
      )}
      {provider === "maptiler" && (
        <MapTilerMap
          locations={locations}
          userLocale={userLocale}
          mapStyle={currentStyle}
        />
      )}
      {provider === "google" && (
        <GoogleMap
          locations={locations}
          userLocale={userLocale}
          mapStyle={currentStyle}
        />
      )}
      {provider === "osm" && (
        <OsmMap locations={locations} userLocale={userLocale} />
      )}
    </div>
  );
}

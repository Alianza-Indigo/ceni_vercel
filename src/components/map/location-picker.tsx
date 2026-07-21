"use client";

import * as React from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

const TILE_URL =
  process.env.NEXT_PUBLIC_TILE_URL ?? "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

/**
 * Click-to-set location picker. The map is an optional aid: the manual
 * latitude/longitude fields rendered by the parent are the accessible path.
 */
export function LocationPicker({
  latitude,
  longitude,
  onChange,
}: {
  latitude: number | null;
  longitude: number | null;
  onChange: (lat: number, lng: number) => void;
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const mapRef = React.useRef<maplibregl.Map | null>(null);
  const markerRef = React.useRef<maplibregl.Marker | null>(null);
  const onChangeRef = React.useRef(onChange);
  onChangeRef.current = onChange;

  React.useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: "raster",
            tiles: [TILE_URL],
            tileSize: 256,
            attribution:
              '© <a href="https://www.openstreetmap.org/copyright">colaboradores de OpenStreetMap</a>',
          },
        },
        layers: [{ id: "osm", type: "raster", source: "osm" }],
      },
      center: [longitude ?? -102.0, latitude ?? 23.8],
      zoom: latitude !== null && longitude !== null ? 13 : 4.5,
      attributionControl: { compact: false },
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }));
    map.on("click", (event) => {
      const { lat, lng } = event.lngLat;
      onChangeRef.current(Number(lat.toFixed(6)), Number(lng.toFixed(6)));
    });
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- init once; updates handled below
  }, []);

  React.useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (latitude === null || longitude === null) {
      markerRef.current?.remove();
      markerRef.current = null;
      return;
    }
    if (!markerRef.current) {
      markerRef.current = new maplibregl.Marker({ color: "#1b1f5a" })
        .setLngLat([longitude, latitude])
        .addTo(map);
    } else {
      markerRef.current.setLngLat([longitude, latitude]);
    }
  }, [latitude, longitude]);

  return (
    <div>
      <div
        ref={containerRef}
        role="application"
        aria-label="Mapa para elegir la ubicación. Haz clic en el punto donde está tu organización. También puedes escribir la latitud y longitud en los campos de abajo."
        className="h-72 w-full overflow-hidden rounded-xl border border-border"
      />
      <p className="mt-2 text-sm text-muted-ink">
        Haz clic en el mapa para fijar la ubicación, o escribe la latitud y longitud en
        los campos de abajo. Ambos caminos funcionan igual.
      </p>
    </div>
  );
}

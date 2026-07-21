"use client";

import * as React from "react";
import Link from "next/link";
import maplibregl from "maplibre-gl";
import type { FeatureCollection } from "geojson";
import "maplibre-gl/dist/maplibre-gl.css";
import type { CertStatus } from "@prisma/client";
import type { DirectoryEntry } from "./directory-explorer";
import { LEVEL_LABELS, LINE_LABELS, ORG_NETWORK_STATUS_LABELS } from "@/lib/domain";
import { StatusBadge } from "@/components/cert/status-badge";

const TILE_URL =
  process.env.NEXT_PUBLIC_TILE_URL ?? "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

const LEVEL_COLORS: Record<string, string> = {
  AFILIADA: "#2f7d6e",
  BRONCE: "#8c5a2b",
  PLATA: "#5f6570",
  ORO: "#c9a227",
};

export function DirectoryMap({ entries }: { entries: DirectoryEntry[] }) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const mapRef = React.useRef<maplibregl.Map | null>(null);
  const [ready, setReady] = React.useState(false);
  const [selected, setSelected] = React.useState<DirectoryEntry | null>(null);

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
      center: [-102.0, 23.8],
      zoom: 5,
      attributionControl: { compact: false },
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }));
    map.on("load", () => setReady(true));
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  React.useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;

    const data: FeatureCollection = {
      type: "FeatureCollection",
      features: entries
        .filter((e) => e.latitude !== null && e.longitude !== null)
        .map((e) => ({
          type: "Feature",
          geometry: { type: "Point", coordinates: [e.longitude!, e.latitude!] },
          properties: { id: e.id, marker: e.level ?? "AFILIADA" },
        })),
    };

    const existing = map.getSource("orgs") as maplibregl.GeoJSONSource | undefined;
    if (existing) {
      existing.setData(data);
      return;
    }

    map.addSource("orgs", {
      type: "geojson",
      data,
      cluster: true,
      clusterMaxZoom: 12,
      clusterRadius: 44,
    });
    map.addLayer({
      id: "clusters",
      type: "circle",
      source: "orgs",
      filter: ["has", "point_count"],
      paint: {
        "circle-color": "#1b1f5a",
        "circle-radius": ["step", ["get", "point_count"], 16, 5, 20, 10, 26],
        "circle-stroke-width": 2,
        "circle-stroke-color": "#ffffff",
      },
    });
    map.addLayer({
      id: "cluster-count",
      type: "symbol",
      source: "orgs",
      filter: ["has", "point_count"],
      layout: {
        "text-field": ["get", "point_count_abbreviated"],
        "text-size": 13,
      },
      paint: { "text-color": "#ffffff" },
    });
    map.addLayer({
      id: "org-points",
      type: "circle",
      source: "orgs",
      filter: ["!", ["has", "point_count"]],
      paint: {
        "circle-color": [
          "match",
          ["get", "marker"],
          "AFILIADA",
          LEVEL_COLORS.AFILIADA,
          "BRONCE",
          LEVEL_COLORS.BRONCE,
          "PLATA",
          LEVEL_COLORS.PLATA,
          "ORO",
          LEVEL_COLORS.ORO,
          "#1b1f5a",
        ],
        "circle-radius": 9,
        "circle-stroke-width": 2.5,
        "circle-stroke-color": "#ffffff",
      },
    });

    map.on("click", "clusters", async (event) => {
      const features = map.queryRenderedFeatures(event.point, { layers: ["clusters"] });
      const clusterId = features[0]?.properties?.cluster_id as number | undefined;
      const source = map.getSource("orgs") as maplibregl.GeoJSONSource;
      if (clusterId === undefined) return;
      const zoom = await source.getClusterExpansionZoom(clusterId);
      const geometry = features[0].geometry;
      if (geometry.type === "Point") {
        map.easeTo({
          center: geometry.coordinates as [number, number],
          zoom,
          duration: 200,
        });
      }
    });

    map.on("click", "org-points", (event) => {
      const id = event.features?.[0]?.properties?.id as string | undefined;
      if (id) {
        const entry = entriesRef.current.find((e) => e.id === id) ?? null;
        setSelected(entry);
      }
    });
    map.on("mouseenter", "org-points", () => {
      map.getCanvas().style.cursor = "pointer";
    });
    map.on("mouseleave", "org-points", () => {
      map.getCanvas().style.cursor = "";
    });
  }, [entries, ready]);

  const entriesRef = React.useRef(entries);
  React.useEffect(() => {
    entriesRef.current = entries;
    setSelected((current) =>
      current && !entries.some((e) => e.id === current.id) ? null : current,
    );
  }, [entries]);

  return (
    <div>
      <div
        ref={containerRef}
        role="application"
        aria-label="Mapa de organizaciones de la red CENI en Mexico. Los detalles tambien estan disponibles en la vista de lista."
        className="h-[480px] w-full overflow-hidden rounded-xl border border-border"
      />
      <p className="mt-2 text-sm text-muted-ink">
        Color del marcador: verde = Afiliada, cafe = Bronce, gris = Plata, dorado =
        Oro. Los numeros agrupan organizaciones cercanas.
      </p>
      {selected && (
        <div
          role="region"
          aria-label={`Organizacion seleccionada: ${selected.name}`}
          className="mt-3 rounded-xl border border-border bg-card p-4"
        >
          <h3 className="font-bold text-indigo">{selected.name}</h3>
          <p className="text-sm text-muted-ink">
            {selected.city}, {selected.state}
            {selected.category === "CERTIFICADA" && selected.line && selected.level
              ? ` - ${LINE_LABELS[selected.line]} - Nivel ${LEVEL_LABELS[selected.level]}`
              : " - Red CENI"}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            {selected.category === "AFILIADA" ? (
              <span className="inline-flex min-h-7 items-center rounded-full bg-surface px-3 text-xs font-bold text-indigo">
                {ORG_NETWORK_STATUS_LABELS.AFILIADA}
              </span>
            ) : (
              <StatusBadge status={selected.status as CertStatus} />
            )}
            {selected.folio && (
              <Link
                href={`/verificar/${selected.folio}`}
                className="text-sm font-bold text-indigo underline underline-offset-4"
              >
                Verificar folio {selected.folio}
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

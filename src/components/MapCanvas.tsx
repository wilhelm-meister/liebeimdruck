"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { StyleSpecification } from "maplibre-gl";

type Props = {
  style: StyleSpecification;
  center: [number, number]; // [lon, lat]
  resizeSignal: string; // ändert sich, wenn sich die Canvas-Größe ändert
  clipUnit?: string; // normalisierter clip-path (Kartenform); leer = Rechteck
  onMove?: (
    center: [number, number],
    zoom: number,
    bounds: [number, number, number, number], // [west, south, east, north]
  ) => void;
};

export default function MapCanvas({ style, center, resizeSignal, clipUnit, onMove }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  // onMove über Ref, damit der Init-Effekt nicht neu laufen muss
  const onMoveRef = useRef(onMove);
  useEffect(() => {
    onMoveRef.current = onMove;
  });

  // Karte einmalig initialisieren
  useEffect(() => {
    if (!containerRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style,
      center,
      zoom: 12,
      attributionControl: false,
      dragRotate: false,
      pitchWithRotate: false,
    });
    map.touchZoomRotate.disableRotation();
    mapRef.current = map;

    const handleMove = () => {
      const c = map.getCenter();
      const b = map.getBounds();
      onMoveRef.current?.([c.lng, c.lat], map.getZoom(), [
        b.getWest(),
        b.getSouth(),
        b.getEast(),
        b.getNorth(),
      ]);
    };
    map.on("moveend", handleMove);
    map.on("load", handleMove); // Anfangszustand erfassen

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Stil aktualisieren (Detailstufe / Beschriftung)
  const firstStyle = useRef(true);
  useEffect(() => {
    if (firstStyle.current) {
      firstStyle.current = false;
      return;
    }
    mapRef.current?.setStyle(style);
  }, [style]);

  // Neuen Ort anfliegen
  const firstCenter = useRef(true);
  useEffect(() => {
    if (firstCenter.current) {
      firstCenter.current = false;
      return;
    }
    mapRef.current?.flyTo({ center, zoom: 12, duration: 900, essential: true });
  }, [center]);

  // Größe nach Layout-Änderung (Format / Vorschau) neu berechnen
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const id = requestAnimationFrame(() => {
      map.resize();
      // Neuer Ausschnitt nach Größenänderung (z. B. Formatwechsel) melden
      const c = map.getCenter();
      const b = map.getBounds();
      onMoveRef.current?.([c.lng, c.lat], map.getZoom(), [
        b.getWest(),
        b.getSouth(),
        b.getEast(),
        b.getNorth(),
      ]);
    });
    return () => cancelAnimationFrame(id);
  }, [resizeSignal]);

  const btn =
    "grid h-8 w-8 place-items-center text-lg leading-none text-ink/70 transition hover:bg-paper";

  return (
    <div className="absolute inset-0">
      {clipUnit && (
        <svg width="0" height="0" className="absolute" aria-hidden>
          <defs>
            <clipPath id="posterShapeClip" clipPathUnits="objectBoundingBox">
              <path d={clipUnit} />
            </clipPath>
          </defs>
        </svg>
      )}
      <div
        ref={containerRef}
        className="h-full w-full"
        style={
          clipUnit
            ? { clipPath: "url(#posterShapeClip)", WebkitClipPath: "url(#posterShapeClip)" }
            : undefined
        }
      />
      <div className="absolute left-3 top-3 z-10 flex flex-col overflow-hidden rounded-md border border-line bg-white shadow-sm">
        <button aria-label="Hineinzoomen" className={btn} onClick={() => mapRef.current?.zoomIn()}>
          +
        </button>
        <span className="h-px bg-line" />
        <button aria-label="Herauszoomen" className={btn} onClick={() => mapRef.current?.zoomOut()}>
          −
        </button>
      </div>
    </div>
  );
}

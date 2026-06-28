"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { StyleSpecification } from "maplibre-gl";

type Props = {
  style: StyleSpecification;
  center: [number, number]; // [lon, lat]
  resizeSignal: string; // ändert sich, wenn sich die Canvas-Größe ändert
  clipUnit?: string; // normalisierter clip-path (Kartenform); leer = Rechteck
  outlineMm?: number; // Konturstärke der Form in mm (0 = ohne Linie)
  outlineColor?: string; // Konturfarbe
  boxMmHeight?: number; // Höhe der Kartenfläche in mm (für mm→px-Umrechnung)
  onMove?: (
    center: [number, number],
    zoom: number,
    bounds: [number, number, number, number], // [west, south, east, north]
  ) => void;
};

export default function MapCanvas({ style, center, resizeSignal, clipUnit, outlineMm, outlineColor, boxMmHeight, onMove }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [boxPx, setBoxPx] = useState(0); // gemessene Pixel-Höhe der Kartenfläche

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

  // Pixel-Höhe der Kartenfläche verfolgen (für die mm→px-Umrechnung der Kontur)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setBoxPx(el.clientHeight);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
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

  // Konturstärke in Bildschirm-Pixeln (mit Sichtbarkeits-Minimum, damit auch
  // eine Haarlinie in der Vorschau zu sehen ist).
  const strokePx =
    clipUnit && outlineMm && outlineMm > 0 && boxMmHeight && boxPx
      ? Math.max(0.75, (outlineMm * boxPx) / boxMmHeight)
      : 0;

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
      {/* Form-Kontur (Rand) – Stroke-Overlay über der geclippten Karte */}
      {clipUnit && strokePx > 0 && (
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          style={{ zIndex: 30 }}
          viewBox="0 0 1 1"
          preserveAspectRatio="none"
          aria-hidden
        >
          <path
            d={clipUnit}
            fill="none"
            stroke={outlineColor ?? "#1a1a1a"}
            strokeWidth={strokePx}
            vectorEffect="non-scaling-stroke"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </svg>
      )}
      <div className="absolute left-3 top-3 z-40 flex flex-col overflow-hidden rounded-md border border-line bg-white shadow-sm">
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

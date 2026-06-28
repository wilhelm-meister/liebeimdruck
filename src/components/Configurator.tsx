"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Sidebar from "./Sidebar";
import PosterFrame from "./PosterFrame";
import { buildMapStyle, type Detail, type Labels } from "@/lib/mapStyle";
import { formatCoords } from "@/lib/format";
import { exportPosterPng } from "@/lib/exportPoster";
import { exportPosterPdf } from "@/lib/vectorPoster";
import type { FormatId } from "@/lib/posterLayout";
import type { ShapeId } from "@/lib/shapes";
import { getTheme, buildCustomTheme, DEFAULT_CUSTOM, type CustomColors } from "@/lib/themes";
import type { Place } from "@/lib/photon";

// MapLibre nur im Browser laden (kein SSR)
const MapCanvas = dynamic(() => import("./MapCanvas"), { ssr: false });

const BREMEN: Place = {
  name: "Bremen",
  context: "Freie Hansestadt Bremen · Deutschland",
  center: [8.8071646, 53.0758196],
};

type Orientation = "portrait" | "landscape";

// — Vertikale Werkzeug-Leiste (nur „Karte" aktiv in dieser Ausbaustufe) —
const RAIL = [
  { key: "karte", label: "Karte", active: true, icon: "M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2ZM9 4v14M15 6v14" },
  { key: "layout", label: "Layout", active: false, icon: "M4 4h16v16H4zM4 10h16M10 10v10" },
  { key: "text", label: "Text", active: false, icon: "M5 6h14M12 6v13" },
  { key: "marker", label: "Marker", active: false, icon: "M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11ZM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" },
  { key: "fotos", label: "Fotos", active: false, icon: "M3 7h4l2-2h6l2 2h4v12H3zM12 16a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" },
  { key: "produkt", label: "Produkt", active: false, icon: "M12 3 4 7v10l8 4 8-4V7zM4 7l8 4 8-4M12 11v10" },
];

function IconRail({ onLocked }: { onLocked: () => void }) {
  return (
    <nav className="flex w-[78px] shrink-0 flex-col items-center gap-1 border-r border-line bg-white py-3">
      {RAIL.map((it) => (
        <button
          key={it.key}
          onClick={it.active ? undefined : onLocked}
          className={`flex w-full flex-col items-center gap-1 py-2 text-[11px] transition ${
            it.active
              ? "border-l-2 border-mint-strong bg-mint/40 text-mint-ink"
              : "border-l-2 border-transparent text-ink/45 hover:text-ink/70"
          }`}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
            <path d={it.icon} />
          </svg>
          {it.label}
        </button>
      ))}
    </nav>
  );
}

export default function Configurator() {
  const [place, setPlace] = useState<Place>(BREMEN);
  const [view, setView] = useState<{
    center: [number, number];
    zoom: number;
    bounds: [number, number, number, number] | null;
  }>({
    center: BREMEN.center,
    zoom: 12,
    bounds: null,
  });
  const [detail, setDetail] = useState<Detail>("roads");
  const [labels, setLabels] = useState<Labels>("none");
  const [orientation, setOrientation] = useState<Orientation>("portrait");
  const [preview, setPreview] = useState(false);
  const [busy, setBusy] = useState<"" | "png" | "pdf">("");
  const [format, setFormat] = useState<FormatId>("30x40");
  const [shape, setShape] = useState<ShapeId>("none");
  const [themeId, setThemeId] = useState("klassik");
  const [customColors, setCustomColors] = useState<CustomColors>(DEFAULT_CUSTOM);
  const theme = useMemo(
    () => (themeId === "custom" ? buildCustomTheme(customColors) : getTheme(themeId)),
    [themeId, customColors],
  );
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const tileKey = process.env.NEXT_PUBLIC_MAPTILER_KEY || undefined;
  const style = useMemo(
    () => buildMapStyle({ detail, labels, theme, tileKey }),
    [detail, labels, theme, tileKey],
  );

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3200);
  }, []);

  const handleSelect = useCallback((p: Place) => {
    setPlace(p);
    setView((v) => ({ ...v, center: p.center, zoom: 12 }));
  }, []);

  const handleMove = useCallback(
    (center: [number, number], zoom: number, bounds: [number, number, number, number]) => {
      setView({ center, zoom, bounds });
    },
    [],
  );

  const handleCustomChange = useCallback((key: keyof CustomColors, value: string) => {
    setCustomColors((c) => ({ ...c, [key]: value }));
    setThemeId("custom");
  }, []);

  const handleCustomOpen = useCallback(() => {
    if (themeId !== "custom") {
      // aktuelle Theme-Farben als Startpunkt übernehmen
      const t = getTheme(themeId);
      setCustomColors({ bg: t.bg, water: t.water, road: t.roadMajor, building: t.building, label: t.label });
      setThemeId("custom");
    }
  }, [themeId]);

  const coords = formatCoords(view.center[1], view.center[0]);
  const resizeSignal = `${orientation}-${preview}-${format}`;

  const handleDownloadPng = useCallback(async () => {
    if (busy) return;
    setBusy("png");
    try {
      await exportPosterPng({
        style,
        center: view.center,
        zoom: view.zoom,
        bounds: view.bounds,
        orientation,
        format,
        shape,
        title: place.name,
        coords,
      });
    } catch {
      showToast("PNG-Download fehlgeschlagen – bitte erneut versuchen.");
    } finally {
      setBusy("");
    }
  }, [busy, style, view, orientation, format, shape, place.name, coords, showToast]);

  const handleDownloadPdf = useCallback(async () => {
    if (busy) return;
    setBusy("pdf");
    try {
      await exportPosterPdf({
        detail,
        labels,
        tileKey,
        bounds: view.bounds,
        zoom: view.zoom,
        orientation,
        title: place.name,
        coords,
        format,
        shape,
        theme,
      });
    } catch (e) {
      showToast(
        e instanceof Error && e.message.includes("Ausschnitt")
          ? "Karte lädt noch – bitte einen Moment warten."
          : "PDF-Erzeugung fehlgeschlagen – bitte erneut versuchen.",
      );
    } finally {
      setBusy("");
    }
  }, [busy, detail, labels, tileKey, view, orientation, place.name, coords, format, shape, theme, showToast]);

  return (
    <div className="relative flex flex-1 overflow-hidden">
      {!preview && (
        <>
          <Sidebar
            detail={detail}
            setDetail={setDetail}
            labels={labels}
            setLabels={setLabels}
            orientation={orientation}
            setOrientation={setOrientation}
            onSelectPlace={handleSelect}
            onPreview={() => setPreview(true)}
            onDownloadPng={handleDownloadPng}
            onDownloadPdf={handleDownloadPdf}
            busy={busy}
            format={format}
            setFormat={setFormat}
            shape={shape}
            setShape={setShape}
            themeId={themeId}
            setThemeId={setThemeId}
            customColors={customColors}
            onCustomChange={handleCustomChange}
            onCustomOpen={handleCustomOpen}
            onStub={() =>
              showToast("Bestellfunktion folgt – aktuell ist nur der Konfigurator aktiv.")
            }
          />
          <IconRail
            onLocked={() =>
              showToast("Dieser Bereich kommt in einer späteren Ausbaustufe.")
            }
          />
        </>
      )}

      <main className="relative flex flex-1 items-center justify-center bg-paper p-6 md:p-10">
        {preview ? (
          <button
            onClick={() => setPreview(false)}
            className="absolute right-6 top-4 z-10 flex items-center gap-1.5 rounded-md border border-line bg-white px-3 py-1.5 text-sm text-ink/70 transition hover:text-ink"
          >
            ✕ Schließen
          </button>
        ) : (
          <button
            onClick={handleDownloadPng}
            disabled={busy !== ""}
            className="absolute right-6 top-4 z-10 flex items-center gap-1.5 text-sm text-ink/60 transition hover:text-ink disabled:opacity-60"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3v12m0 0 4-4m-4 4-4-4M4 19h16" />
            </svg>
            {busy === "png" ? "Erzeuge…" : "Speichern (PNG)"}
          </button>
        )}

        <PosterFrame title={place.name} coords={coords} format={format} orientation={orientation} shape={shape} enlarged={preview}>
          <MapCanvas style={style} center={place.center} resizeSignal={resizeSignal} onMove={handleMove} />
        </PosterFrame>

        <p className="pointer-events-none absolute bottom-3 right-4 text-[10px] text-ink/35">
          Karten: © OpenStreetMap-Mitwirkende · OpenFreeMap
        </p>
      </main>

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-ink px-4 py-2.5 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}

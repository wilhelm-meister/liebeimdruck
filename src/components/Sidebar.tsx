"use client";

import { useState, type ReactNode } from "react";
import LocationSearch from "./LocationSearch";
import type { Detail, Labels } from "@/lib/mapStyle";
import { FORMATS, getFormat, type FormatId } from "@/lib/posterLayout";
import type { ShapeId } from "@/lib/shapes";
import { THEMES, type Theme, type CustomColors } from "@/lib/themes";
import type { Place } from "@/lib/photon";

type Orientation = "portrait" | "landscape";

type Props = {
  detail: Detail;
  setDetail: (d: Detail) => void;
  labels: Labels;
  setLabels: (l: Labels) => void;
  orientation: Orientation;
  setOrientation: (o: Orientation) => void;
  onSelectPlace: (p: Place) => void;
  onPreview: () => void;
  onDownloadPng: () => void;
  onDownloadPdf: () => void;
  busy: "" | "png" | "pdf";
  format: FormatId;
  setFormat: (f: FormatId) => void;
  shape: ShapeId;
  setShape: (s: ShapeId) => void;
  themeId: string;
  setThemeId: (id: string) => void;
  customColors: CustomColors;
  onCustomChange: (key: keyof CustomColors, value: string) => void;
  onCustomOpen: () => void;
  onStub: () => void;
};

const CUSTOM_ROWS: { key: keyof CustomColors; label: string }[] = [
  { key: "bg", label: "Land" },
  { key: "water", label: "Wasser" },
  { key: "road", label: "Straßen" },
  { key: "building", label: "Gebäude" },
  { key: "label", label: "Beschriftung" },
];

function ThemeSwatch({ theme, active, onClick }: { theme: Theme; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title={theme.name}
      className={`h-10 w-10 overflow-hidden rounded-full transition ${
        active ? "ring-2 ring-mint-strong ring-offset-2" : "ring-1 ring-line hover:ring-ink/40"
      }`}
    >
      <svg viewBox="0 0 40 40" className="h-full w-full">
        <rect width="40" height="40" fill={theme.bg} />
        <path d="M-2 27 L42 31" stroke={theme.water} strokeWidth="8" fill="none" />
        <path d="M12 -2 L21 42" stroke={theme.roadMajor} strokeWidth="2.6" fill="none" />
        <path d="M-2 15 L42 11" stroke={theme.roadMajor} strokeWidth="2.6" fill="none" />
        <path d="M-2 22 L42 24" stroke={theme.roadMinor} strokeWidth="1" fill="none" />
      </svg>
    </button>
  );
}

function OptionCard({
  active,
  onClick,
  icon,
  label,
  disabled,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
  disabled?: boolean;
  badge?: string;
}) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`relative flex flex-1 flex-col items-center justify-center gap-2 rounded-lg border px-2 py-3 text-center text-[12px] leading-tight transition ${
        active
          ? "border-mint-strong bg-mint text-mint-ink"
          : disabled
            ? "cursor-not-allowed border-line bg-white text-ink/30"
            : "border-line bg-white text-ink/70 hover:border-ink/30"
      }`}
    >
      <span className={active ? "text-mint-ink" : disabled ? "text-ink/25" : "text-ink/60"}>{icon}</span>
      {label}
      {badge && (
        <span className="absolute -top-1.5 right-1 rounded-full bg-ink/10 px-1.5 py-0.5 text-[8px] font-medium text-ink/50">
          {badge}
        </span>
      )}
    </button>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h3 className="mb-3 text-center text-[13px] font-semibold uppercase tracking-[0.12em] text-ink/80">
      {children}
    </h3>
  );
}

// — Icons —
const I = { width: 24, height: 24, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.4 } as const;
const IconRoads = () => (
  <svg {...I}>
    <path d="M7 3 4 21M17 3l3 18M12 4.5v3M12 11v2.5M12 17v2.5" strokeLinecap="round" />
  </svg>
);
const IconRoadsBuildings = () => (
  <svg {...I}>
    <path d="M5 3 3.5 21M11 4v2.5M11 10v2.5M11 16v2.5" strokeLinecap="round" />
    <rect x="14.5" y="11" width="6.5" height="10" rx="0.5" />
    <path d="M16.7 11v10M18.8 11v10" />
  </svg>
);
const IconBuildings = () => (
  <svg {...I}>
    <rect x="4" y="4" width="7" height="7" rx="0.5" />
    <rect x="13" y="4" width="7" height="7" rx="0.5" />
    <rect x="4" y="13" width="7" height="7" rx="0.5" />
    <rect x="13" y="13" width="7" height="7" rx="0.5" />
  </svg>
);
const IconNoLabel = () => (
  <svg {...I}>
    <path d="M5.5 19 12 6l6.5 13M8.5 14.5h7" strokeLinecap="round" />
    <path d="M4 5 20 20" strokeLinecap="round" />
  </svg>
);
const IconLabel = () => (
  <svg {...I}>
    <path d="M5 6.5h14M12 6.5V19" strokeLinecap="round" />
  </svg>
);
const IconPortrait = () => (
  <svg {...I}>
    <rect x="7" y="3" width="10" height="18" rx="1.2" />
  </svg>
);
const IconLandscape = () => (
  <svg {...I}>
    <rect x="3" y="7" width="18" height="10" rx="1.2" />
  </svg>
);
// — Kartenform-Icons —
const IconShapeNone = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
    <rect x="4" y="4" width="16" height="16" rx="1.5" />
  </svg>
);
const IconShapeHeart = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 21s-7.5-4.9-9.3-9.2C1.4 8.5 3.3 5 7 5c2.1 0 3.6 1.3 5 3 1.4-1.7 2.9-3 5-3 3.7 0 5.6 3.5 4.3 6.8C19.5 16.1 12 21 12 21Z" />
  </svg>
);
const IconShapeHouse = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 3 1.5 11h3V21h6v-6h3v6h6V11h3L12 3Z" />
  </svg>
);
const IconShapeCircle = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="12" r="9" />
  </svg>
);
const IconShapeBorder = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
    <path d="M5 6 9 4l5 2 5-1v9l-4 4-6-2-4 2z" />
  </svg>
);
const IconEye = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="2.6" />
  </svg>
);
const IconCart = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
    <path d="M3 4h2l2.2 11.2a1 1 0 0 0 1 .8h8.2a1 1 0 0 0 1-.8L20 8H6" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="9.5" cy="20" r="1.3" />
    <circle cx="17.5" cy="20" r="1.3" />
  </svg>
);
const IconDownload = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
    <path d="M12 3v12m0 0 4-4m-4 4-4-4M4 19h16" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const Spinner = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="animate-spin">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" opacity="0.25" />
    <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);
const IconPdf = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M14 3H6.5A1.5 1.5 0 0 0 5 4.5v15A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5V8z" strokeLinejoin="round" />
    <path d="M14 3v5h5" strokeLinejoin="round" />
  </svg>
);

export default function Sidebar({
  detail,
  setDetail,
  labels,
  setLabels,
  orientation,
  setOrientation,
  onSelectPlace,
  onPreview,
  onDownloadPng,
  onDownloadPdf,
  busy,
  format,
  setFormat,
  shape,
  setShape,
  themeId,
  setThemeId,
  customColors,
  onCustomChange,
  onCustomOpen,
  onStub,
}: Props) {
  const fmt = getFormat(format);
  const isCustom = themeId === "custom";
  const themeName = isCustom ? "Eigene Farben" : THEMES.find((t) => t.id === themeId)?.name ?? "";
  const [customOpen, setCustomOpen] = useState(false);
  return (
    <aside className="flex h-full w-[360px] shrink-0 flex-col border-r border-line bg-white">
      <div className="flex-1 overflow-y-auto px-5 py-5">
        {/* Kopf */}
        <div className="mb-4 flex items-center justify-center gap-2">
          <h2 className="text-center text-[15px] font-semibold uppercase tracking-[0.14em] text-ink">
            Wähle deinen Ort
          </h2>
          <span className="flex items-center gap-1 text-[11px] text-ink/40">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <circle cx="12" cy="12" r="9" />
              <path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.8.4-1 .8-1 1.7M12 17h.01" strokeLinecap="round" />
            </svg>
            Hilfe
          </span>
        </div>

        <LocationSearch onSelect={onSelectPlace} />

        {/* Kartendetails */}
        <div className="mt-7">
          <SectionTitle>Kartendetails</SectionTitle>
          <div className="flex gap-2">
            <OptionCard active={detail === "roads"} onClick={() => setDetail("roads")} icon={<IconRoads />} label="Straßen" />
            <OptionCard active={detail === "roads_buildings"} onClick={() => setDetail("roads_buildings")} icon={<IconRoadsBuildings />} label="Straßen & Gebäude" />
            <OptionCard active={detail === "buildings"} onClick={() => setDetail("buildings")} icon={<IconBuildings />} label="Gebäude" />
          </div>
        </div>

        {/* Beschriftung */}
        <div className="mt-4">
          <div className="flex gap-2">
            <OptionCard active={labels === "none"} onClick={() => setLabels("none")} icon={<IconNoLabel />} label="Keine Beschriftung" />
            <OptionCard active={labels === "places"} onClick={() => setLabels("places")} icon={<IconLabel />} label="Orte beschriften" />
          </div>
        </div>

        {/* Ausrichtung */}
        <div className="mt-7">
          <SectionTitle>Ausrichtung</SectionTitle>
          <div className="flex gap-2">
            <OptionCard active={orientation === "portrait"} onClick={() => setOrientation("portrait")} icon={<IconPortrait />} label="Hochformat" />
            <OptionCard active={orientation === "landscape"} onClick={() => setOrientation("landscape")} icon={<IconLandscape />} label="Querformat" />
          </div>
        </div>

        {/* Kartenform */}
        <div className="mt-7">
          <SectionTitle>Kartenform</SectionTitle>
          <div className="flex gap-1.5">
            <OptionCard active={shape === "none"} onClick={() => setShape("none")} icon={<IconShapeNone />} label="Ohne" />
            <OptionCard active={shape === "heart"} onClick={() => setShape("heart")} icon={<IconShapeHeart />} label="Herz" />
            <OptionCard active={shape === "house"} onClick={() => setShape("house")} icon={<IconShapeHouse />} label="Haus" />
            <OptionCard active={shape === "circle"} onClick={() => setShape("circle")} icon={<IconShapeCircle />} label="Kreis" />
            <OptionCard active={false} onClick={() => {}} icon={<IconShapeBorder />} label="Grenzen" disabled badge="bald" />
          </div>
        </div>

        {/* Format / Größe */}
        <div className="mt-7">
          <SectionTitle>Format</SectionTitle>
          <div className="relative">
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value as FormatId)}
              className="w-full cursor-pointer appearance-none rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none transition hover:border-ink/30 focus:border-ink/50"
            >
              {FORMATS.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>
            <svg
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink/50"
              width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
            >
              <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="mt-2 text-center text-[11px] text-ink/45">
            Bestimmt Vorschau, PNG und PDF · Vektor-PDF skaliert verlustfrei
          </p>
        </div>

        {/* Farben */}
        <div className="mt-7">
          <SectionTitle>Farben</SectionTitle>
          <div className="grid grid-cols-5 justify-items-center gap-2.5">
            {THEMES.map((t) => (
              <ThemeSwatch key={t.id} theme={t} active={themeId === t.id} onClick={() => setThemeId(t.id)} />
            ))}
          </div>
          <p className="mt-2 text-center text-[11px] text-ink/55">{themeName}</p>

          <button
            onClick={() => {
              onCustomOpen();
              setCustomOpen((o) => !o);
            }}
            className={`mt-3 w-full rounded-md border py-2 text-sm transition ${
              isCustom
                ? "border-mint-strong bg-mint text-mint-ink"
                : "border-line text-ink/70 hover:border-ink/30"
            }`}
          >
            Eigene Farben
          </button>

          {customOpen && (
            <div className="mt-2 space-y-2 rounded-lg border border-line p-3">
              {CUSTOM_ROWS.map((row) => (
                <label
                  key={row.key}
                  className="flex cursor-pointer items-center justify-between text-[13px] text-ink/75"
                >
                  {row.label}
                  <input
                    type="color"
                    value={customColors[row.key]}
                    onChange={(e) => onCustomChange(row.key, e.target.value)}
                    className="h-7 w-12 cursor-pointer rounded border border-line bg-white p-0.5"
                  />
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer: Aktionen + Preis */}
      <div className="shrink-0 border-t border-line px-4 py-3">
        <div className="flex gap-2">
          <button
            onClick={onPreview}
            className="flex flex-1 items-center justify-center gap-2 rounded-md border border-line py-2.5 text-sm text-ink/75 transition hover:border-ink/30"
          >
            <IconEye />
            Vorschau
          </button>
          <button
            onClick={onStub}
            className="flex flex-1 items-center justify-center rounded-md border border-line py-2.5 text-sm text-ink/75 transition hover:border-ink/30"
          >
            Weiter →
          </button>
        </div>

        <div className="mt-2 grid grid-cols-2 gap-2">
          <button
            onClick={onDownloadPng}
            disabled={busy !== ""}
            className="flex items-center justify-center gap-2 rounded-md border border-line py-2.5 text-sm text-ink/75 transition hover:border-ink/30 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {busy === "png" ? <Spinner /> : <IconDownload />}
            {busy === "png" ? "Erzeuge…" : "PNG"}
          </button>
          <button
            onClick={onDownloadPdf}
            disabled={busy !== ""}
            className="flex items-center justify-center gap-2 rounded-md border border-line py-2.5 text-sm text-ink/75 transition hover:border-ink/30 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {busy === "pdf" ? <Spinner /> : <IconPdf />}
            {busy === "pdf" ? "Erzeuge…" : "PDF"}
          </button>
        </div>

        <div className="mt-3 flex items-end justify-between">
          <div>
            <p className="text-sm font-medium text-ink">Poster {fmt.label}</p>
            <p className="text-[11px] text-ink/50">inklusive Versand und ges. MwSt.</p>
          </div>
          <p className="text-lg font-semibold text-ink">{fmt.price} €</p>
        </div>

        <button
          onClick={onStub}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-md bg-mint-strong py-3 text-sm font-medium text-mint-ink transition hover:brightness-[0.97]"
        >
          <IconCart />
          Zum Warenkorb hinzufügen
        </button>
      </div>
    </aside>
  );
}

// Gemeinsame Poster-Geometrie für Bildschirm-Vorschau UND Export (PNG/PDF),
// damit beide garantiert denselben Ausschnitt und dieselben Proportionen zeigen.

export type FormatId = "30x40" | "50x70" | "70x100" | "a2" | "a1";
export type Orientation = "portrait" | "landscape";

export type PosterFormat = {
  id: FormatId;
  label: string; // ausführlich (Dropdown)
  short: string; // kurz (Footer/Chips)
  w: number; // cm (Hochformat-Breite)
  h: number; // cm (Hochformat-Höhe)
  price: number; // € (Demo)
};

export const FORMATS: PosterFormat[] = [
  { id: "30x40", label: "30 × 40 cm", short: "30×40", w: 30, h: 40, price: 27 },
  { id: "50x70", label: "50 × 70 cm", short: "50×70", w: 50, h: 70, price: 39 },
  { id: "70x100", label: "70 × 100 cm", short: "70×100", w: 70, h: 100, price: 59 },
  { id: "a2", label: "A2 · 42 × 59,4 cm", short: "A2", w: 42, h: 59.4, price: 33 },
  { id: "a1", label: "A1 · 59,4 × 84 cm", short: "A1", w: 59.4, h: 84, price: 49 },
];

// Randanteile, bezogen auf die Seiten-(Poster-)Breite
export const LAYOUT = { side: 0.066, top: 0.066, band: 0.175 };

export function getFormat(id: FormatId): PosterFormat {
  return FORMATS.find((f) => f.id === id) ?? FORMATS[0];
}

export type BorderStyle = "none" | "single" | "double";

// Rahmen-Linie am Posterrand, bezogen auf die kürzere Seite
const BORDER = { inset: 0.045, gap: 0.013, weight: 0.0035 };

/**
 * Rahmen-Rechtecke (dünne Linie am Posterrand) in denselben Einheiten wie
 * pageW/pageH. Leer = kein Rahmen. „double" = zwei verschachtelte Linien.
 */
export function borderRects(pageW: number, pageH: number, style: BorderStyle) {
  if (style === "none") return [] as { x: number; y: number; w: number; h: number; weight: number }[];
  const s = Math.min(pageW, pageH);
  const o = s * BORDER.inset;
  const weight = s * BORDER.weight;
  const rects = [{ x: o, y: o, w: pageW - 2 * o, h: pageH - 2 * o, weight }];
  if (style === "double") {
    const g = s * BORDER.gap;
    rects.push({ x: o + g, y: o + g, w: pageW - 2 * (o + g), h: pageH - 2 * (o + g), weight: weight * 0.7 });
  }
  return rects;
}

/** Seitenmaße in cm, je nach Ausrichtung. */
export function pageDimsCm(id: FormatId, orientation: Orientation): { w: number; h: number } {
  const f = getFormat(id);
  return orientation === "portrait" ? { w: f.w, h: f.h } : { w: f.h, h: f.w };
}

/** Karten-Rechteck (Position + Größe) innerhalb der Seite, in denselben Einheiten wie pageW/pageH. */
export function posterRect(pageW: number, pageH: number) {
  const side = pageW * LAYOUT.side;
  const top = pageW * LAYOUT.top;
  const band = pageW * LAYOUT.band;
  return {
    side,
    top,
    band,
    rectX: side,
    rectY: top,
    rectW: pageW - 2 * side,
    rectH: pageH - top - band,
  };
}

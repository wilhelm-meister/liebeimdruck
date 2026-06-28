import type { StyleSpecification } from "maplibre-gl";
import { pageDimsCm, posterRect, type FormatId, type Orientation } from "./posterLayout";
import { maskPath, type ShapeId } from "./shapes";

type ExportOpts = {
  style: StyleSpecification;
  center: [number, number]; // [lon, lat]
  zoom: number;
  bounds?: [number, number, number, number] | null; // [west, south, east, north]
  orientation: Orientation;
  format: FormatId;
  shape: ShapeId;
  title: string;
  coords: string;
};

function fontFamilyOf(selector: string, fallback: string): string {
  const el = document.querySelector(selector);
  if (!el) return fallback;
  const f = getComputedStyle(el).fontFamily;
  return f && f.length > 0 ? f : fallback;
}

function slug(s: string): string {
  return s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "") || "poster";
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Rendert das aktuelle Poster als PNG in höherer Auflösung. Seitenverhältnis und
 * Ausschnitt entsprechen exakt der Vorschau (gewähltes Format + gerahmte Bounds).
 */
export async function exportPosterPng(opts: ExportOpts): Promise<void> {
  const { style, center, zoom, bounds, orientation, format, shape, title, coords } = opts;
  const maplibregl = (await import("maplibre-gl")).default;

  // Poster-Geometrie (Pixel) aus dem gewählten Format
  const cm = pageDimsCm(format, orientation);
  const POSTER_W = 2400;
  const POSTER_H = Math.round((POSTER_W * cm.h) / cm.w);
  const { side, top, band, rectW, rectH } = posterRect(POSTER_W, POSTER_H);
  const mapW = Math.round(rectW);
  const mapH = Math.round(rectH);

  const pixelRatio = 2;
  const hidden = document.createElement("div");
  hidden.style.position = "absolute";
  hidden.style.left = "-10000px";
  hidden.style.top = "0";
  hidden.style.width = `${Math.round(mapW / pixelRatio)}px`;
  hidden.style.height = `${Math.round(mapH / pixelRatio)}px`;
  document.body.appendChild(hidden);

  const map = new maplibregl.Map({
    container: hidden,
    style,
    ...(bounds
      ? {
          bounds: [
            [bounds[0], bounds[1]],
            [bounds[2], bounds[3]],
          ] as [[number, number], [number, number]],
          fitBoundsOptions: { padding: 0 },
        }
      : { center, zoom }),
    interactive: false,
    attributionControl: false,
    preserveDrawingBuffer: true,
    pixelRatio,
    fadeDuration: 0,
  });

  try {
    await new Promise<void>((resolve) => {
      let done = false;
      const finish = () => {
        if (!done) {
          done = true;
          resolve();
        }
      };
      map.once("idle", finish);
      setTimeout(finish, 9000);
    });
    await document.fonts?.ready;

    const mapCanvas = map.getCanvas();
    const cv = document.createElement("canvas");
    cv.width = POSTER_W;
    cv.height = POSTER_H;
    const ctx = cv.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D nicht verfügbar");

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, POSTER_W, POSTER_H);
    ctx.drawImage(mapCanvas, Math.round(side), Math.round(top), mapW, mapH);

    // Kartenform: alles außerhalb der Form weiß übermalen
    const mp = maskPath(shape, Math.round(side), Math.round(top), mapW, mapH);
    if (mp) {
      ctx.fillStyle = "#ffffff";
      ctx.fill(new Path2D(mp), "evenodd");
    }

    const serif = fontFamilyOf(".poster-title", "Georgia, 'Times New Roman', serif");
    const sans = fontFamilyOf(".poster-coords", "system-ui, sans-serif");
    const cx = POSTER_W / 2;
    const setSpacing = (px: number) => {
      (ctx as unknown as { letterSpacing: string }).letterSpacing = `${px}px`;
    };

    const titleSize = Math.round(POSTER_W * 0.05);
    const titleY = top + mapH + band * 0.46;
    ctx.fillStyle = "#232323";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `500 ${titleSize}px ${serif}`;
    setSpacing(Math.round(titleSize * 0.16));
    ctx.fillText(title.toUpperCase(), cx, titleY);

    const coordSize = Math.round(POSTER_W * 0.016);
    ctx.fillStyle = "rgba(35,35,35,0.6)";
    ctx.font = `400 ${coordSize}px ${sans}`;
    setSpacing(Math.round(coordSize * 0.28));
    ctx.fillText(coords, cx, titleY + titleSize * 0.92);

    setSpacing(0);
    const footSize = Math.round(POSTER_W * 0.011);
    const footY = POSTER_H - Math.round(side * 0.5);
    ctx.fillStyle = "rgba(35,35,35,0.4)";
    ctx.font = `400 ${footSize}px ${sans}`;
    ctx.textAlign = "left";
    ctx.fillText(`${cm.w} × ${cm.h} cm`, Math.round(side), footY);
    ctx.textAlign = "right";
    ctx.fillText("© OpenStreetMap-Mitwirkende", POSTER_W - Math.round(side), footY);

    const blob = await new Promise<Blob | null>((res) => cv.toBlob(res, "image/png"));
    if (!blob) throw new Error("PNG-Erzeugung fehlgeschlagen");
    triggerDownload(blob, `${slug(title)}-poster-${format}.png`);
  } finally {
    map.remove();
    hidden.remove();
  }
}

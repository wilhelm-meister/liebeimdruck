import { tileSourceUrl, type Detail, type Labels } from "./mapStyle";
import {
  pageDimsCm,
  posterRect,
  borderRects,
  type FormatId,
  type Orientation,
  type BorderStyle,
} from "./posterLayout";
import { hasShape, maskPath, shapePath, type ShapeId } from "./shapes";
import type { Theme } from "./themes";

type Opts = {
  detail: Detail;
  labels: Labels;
  tileKey?: string;
  bounds: [number, number, number, number] | null; // [west, south, east, north]
  zoom: number; // aktuelle Anzeige-Zoomstufe (für gleiche Dichte wie am Bildschirm)
  orientation: Orientation;
  title: string;
  coords: string;
  format: FormatId;
  shape: ShapeId;
  border: BorderStyle;
  theme: Theme;
};

// Straßen-Hierarchie wie am Bildschirm (Farben kommen aus dem Theme).
// „Lärm"-Klassen (service/track/path/pedestrian/pier) werden bewusst weggelassen.
const ROAD = [
  { classes: ["minor", "living_street"], w: 0.14 },
  { classes: ["secondary", "tertiary"], w: 0.3 },
  { classes: ["motorway", "trunk", "primary"], w: 0.5 },
];
const PLACE_SIZE: Record<string, number> = {
  city: 0.013,
  town: 0.0105,
  village: 0.009,
  suburb: 0.0085,
  quarter: 0.0075,
  neighbourhood: 0.0072,
};

function project(lng: number, lat: number): { x: number; y: number } {
  const x = (lng + 180) / 360;
  const s = Math.sin((lat * Math.PI) / 180);
  const y = 0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI);
  return { x, y };
}

function tileRange(b: [number, number, number, number], z: number) {
  const n = 2 ** z;
  const tl = project(b[0], b[3]);
  const br = project(b[2], b[1]);
  const xMin = Math.floor(tl.x * n);
  const xMax = Math.floor(br.x * n);
  const yMin = Math.floor(tl.y * n);
  const yMax = Math.floor(br.y * n);
  return { xMin, xMax, yMin, yMax, count: (xMax - xMin + 1) * (yMax - yMin + 1) };
}

async function fetchAll(urls: string[], concurrency = 10): Promise<(Uint8Array | null)[]> {
  const out: (Uint8Array | null)[] = new Array(urls.length).fill(null);
  let i = 0;
  async function worker() {
    while (i < urls.length) {
      const idx = i++;
      try {
        const res = await fetch(urls[idx]);
        out[idx] = res.ok ? new Uint8Array(await res.arrayBuffer()) : null;
      } catch {
        out[idx] = null;
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, urls.length) }, worker));
  return out;
}

function slug(s: string): string {
  return s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "") || "poster";
}

function esc(s: string): string {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Baut das Poster als echtes Vektor-SVG. Wichtig: dieselbe Zoomstufe und dasselbe
 * Karten-Rechteck wie die Bildschirm-Vorschau, damit das Ergebnis identisch aussieht.
 */
export async function buildPosterSvg(opts: Opts): Promise<SVGSVGElement> {
  const { detail, labels, tileKey, bounds, zoom, orientation, title, coords, format, shape, border, theme } = opts;
  if (!bounds) throw new Error("Kein Kartenausschnitt verfügbar – bitte kurz warten.");

  const PbfMod: any = await import("pbf");
  const VTMod: any = await import("@mapbox/vector-tile");
  const PbfReader = PbfMod.PbfReader ?? PbfMod.default;
  const VectorTile = VTMod.VectorTile;

  // Seite (mm) + Karten-Rechteck aus der gemeinsamen Layout-Grundlage
  const cm = pageDimsCm(format, orientation);
  const pageW = cm.w * 10;
  const pageH = cm.h * 10;
  const { side, band, rectX, rectY, rectW, rectH } = posterRect(pageW, pageH);
  const lineScale = Math.pow(pageW / 300, 0.7);

  // Kacheln in der ANGEZEIGTEN Zoomstufe (gleiche Dichte wie am Bildschirm)
  const tj: any = await (await fetch(tileSourceUrl(tileKey))).json();
  const tmpl: string = tj.tiles[0];
  const maxzoom: number = Math.min(tj.maxzoom ?? 14, 14);
  let Z = Math.max(10, Math.min(Math.round(zoom), maxzoom));
  while (Z > 10 && tileRange(bounds, Z).count > 90) Z--;
  const range = tileRange(bounds, Z);
  const tiles: { tx: number; ty: number }[] = [];
  for (let tx = range.xMin; tx <= range.xMax; tx++) {
    for (let ty = range.yMin; ty <= range.yMax; ty++) tiles.push({ tx, ty });
  }
  const urls = tiles.map((t) =>
    tmpl.replace("{z}", String(Z)).replace("{x}", String(t.tx)).replace("{y}", String(t.ty)),
  );
  const bufs = await fetchAll(urls, 10);

  // Projektion: gerahmte Bounds aufs Kartenrechteck einpassen (seitenrichtig)
  const pTL = project(bounds[0], bounds[3]);
  const pBR = project(bounds[2], bounds[1]);
  let wMinX = pTL.x, wMaxX = pBR.x, wMinY = pTL.y, wMaxY = pBR.y;
  let ww = wMaxX - wMinX, wh = wMaxY - wMinY;
  const rectAspect = rectW / rectH;
  if (ww / wh < rectAspect) {
    const newW = wh * rectAspect, cx = (wMinX + wMaxX) / 2;
    wMinX = cx - newW / 2; wMaxX = cx + newW / 2; ww = newW;
  } else {
    const newH = ww / rectAspect, cy = (wMinY + wMaxY) / 2;
    wMinY = cy - newH / 2; wMaxY = cy + newH / 2; wh = newH;
  }

  const r = (v: number) => Math.round(v * 10) / 10;
  const showRoads = detail === "roads" || detail === "roads_buildings";
  const showBuildings = detail === "roads_buildings" || detail === "buildings";
  const buildingColor = detail === "buildings" ? theme.buildingStrong : theme.building;
  const roadColors = [theme.roadMinor, theme.roadMedium, theme.roadMajor];

  let waterD = "", waterwayD = "", buildingD = "";
  const roadD = ["", "", ""];
  const labelsArr: { X: number; Y: number; name: string; size: number }[] = [];
  const seenPlace = new Set<string>();

  const cullMinX = rectX - 3, cullMaxX = rectX + rectW + 3, cullMinY = rectY - 3, cullMaxY = rectY + rectH + 3;

  for (let ti = 0; ti < tiles.length; ti++) {
    const buf = bufs[ti];
    if (!buf) continue;
    const { tx, ty } = tiles[ti];
    const n = 2 ** Z;
    let tile: any;
    try {
      tile = new VectorTile(new PbfReader(buf));
    } catch {
      continue;
    }

    const toX = (px: number, ext: number) => rectX + (((tx + px / ext) / n) - wMinX) / ww * rectW;
    const toY = (py: number, ext: number) => rectY + (((ty + py / ext) / n) - wMinY) / wh * rectH;

    const subpaths = (geom: any[], ext: number, closed: boolean): string => {
      let d = "";
      for (const ring of geom) {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        const xs: number[] = new Array(ring.length);
        const ys: number[] = new Array(ring.length);
        for (let k = 0; k < ring.length; k++) {
          const X = toX(ring[k].x, ext), Y = toY(ring[k].y, ext);
          xs[k] = X; ys[k] = Y;
          if (X < minX) minX = X;
          if (X > maxX) maxX = X;
          if (Y < minY) minY = Y;
          if (Y > maxY) maxY = Y;
        }
        if (maxX < cullMinX || minX > cullMaxX || maxY < cullMinY || minY > cullMaxY) continue;
        d += "M" + r(xs[0]) + " " + r(ys[0]);
        for (let k = 1; k < xs.length; k++) d += "L" + r(xs[k]) + " " + r(ys[k]);
        if (closed) d += "Z";
      }
      return d;
    };

    const water = tile.layers["water"];
    if (water) for (let i = 0; i < water.length; i++) { const f = water.feature(i); waterD += subpaths(f.loadGeometry(), f.extent, true); }

    const wlayer = tile.layers["waterway"];
    if (wlayer) for (let i = 0; i < wlayer.length; i++) { const f = wlayer.feature(i); waterwayD += subpaths(f.loadGeometry(), f.extent, false); }

    if (showBuildings) {
      const bl = tile.layers["building"];
      if (bl) for (let i = 0; i < bl.length; i++) { const f = bl.feature(i); buildingD += subpaths(f.loadGeometry(), f.extent, true); }
    }

    if (showRoads) {
      const tl = tile.layers["transportation"];
      if (tl) for (let i = 0; i < tl.length; i++) {
        const f = tl.feature(i);
        const cls = f.properties.class as string;
        let gi = -1;
        for (let g = 0; g < ROAD.length; g++) if (ROAD[g].classes.includes(cls)) { gi = g; break; }
        if (gi < 0) continue;
        roadD[gi] += subpaths(f.loadGeometry(), f.extent, false);
      }
    }

    if (labels === "places") {
      const pl = tile.layers["place"];
      if (pl) for (let i = 0; i < pl.length; i++) {
        const f = pl.feature(i);
        const sz = PLACE_SIZE[f.properties.class as string];
        if (!sz) continue;
        const p = f.loadGeometry()[0]?.[0];
        if (!p) continue;
        const X = toX(p.x, f.extent), Y = toY(p.y, f.extent);
        if (X < rectX || X > rectX + rectW || Y < rectY || Y > rectY + rectH) continue;
        const name = (f.properties["name:de"] || f.properties.name) as string;
        if (!name || seenPlace.has(name)) continue;
        seenPlace.add(name);
        labelsArr.push({ X, Y, name, size: sz * pageW });
      }
    }
  }

  // — SVG —
  const cx = pageW / 2;
  const parts: string[] = [];
  parts.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${r(pageW)} ${r(pageH)}">`);
  parts.push(`<rect x="0" y="0" width="${r(pageW)}" height="${r(pageH)}" fill="#ffffff"/>`);
  // Kartenhintergrund (Theme) nur im Kartenbereich – Ränder bleiben weiß
  parts.push(`<rect x="${r(rectX)}" y="${r(rectY)}" width="${r(rectW)}" height="${r(rectH)}" fill="${theme.bg}"/>`);
  if (waterD) parts.push(`<path d="${waterD}" fill="${theme.water}" fill-rule="evenodd"/>`);
  if (waterwayD) parts.push(`<path d="${waterwayD}" fill="none" stroke="${theme.water}" stroke-width="${r(0.28 * lineScale)}" stroke-linecap="round" stroke-linejoin="round"/>`);
  if (showBuildings && buildingD) parts.push(`<path d="${buildingD}" fill="${buildingColor}" fill-rule="evenodd"/>`);
  if (showRoads) roadD.forEach((d, gi) => { if (d) parts.push(`<path d="${d}" fill="none" stroke="${roadColors[gi]}" stroke-width="${r(ROAD[gi].w * lineScale)}" stroke-linecap="round" stroke-linejoin="round"/>`); });

  // weiße Ränder maskieren Überstand
  parts.push(`<rect x="0" y="0" width="${r(pageW)}" height="${r(rectY)}" fill="#ffffff"/>`);
  parts.push(`<rect x="0" y="${r(rectY + rectH)}" width="${r(pageW)}" height="${r(pageH - rectY - rectH)}" fill="#ffffff"/>`);
  parts.push(`<rect x="0" y="${r(rectY)}" width="${r(rectX)}" height="${r(rectH)}" fill="#ffffff"/>`);
  parts.push(`<rect x="${r(rectX + rectW)}" y="${r(rectY)}" width="${r(pageW - rectX - rectW)}" height="${r(rectH)}" fill="#ffffff"/>`);

  // Kartenform: Karte auf die Form ausstanzen (Rechteck mit Form als Loch, weiß) + Kontur
  if (hasShape(shape)) {
    parts.push(`<path d="${maskPath(shape, rectX, rectY, rectW, rectH)}" fill="#ffffff" fill-rule="evenodd"/>`);
    parts.push(`<path d="${shapePath(shape, rectX, rectY, rectW, rectH)}" fill="none" stroke="#1a1a1a" stroke-width="${r(0.4 * lineScale)}" stroke-linejoin="round"/>`);
  }

  for (const L of labelsArr) {
    parts.push(`<text x="${r(L.X)}" y="${r(L.Y + L.size * 0.35)}" font-family="helvetica" font-size="${r(L.size)}" fill="${theme.label}" text-anchor="middle">${esc(L.name)}</text>`);
  }

  const titleSize = pageW * 0.05;
  const titleBaseline = rectY + rectH + band * 0.44 + titleSize * 0.34;
  const trackedTitle = title.toUpperCase().split("").map(esc).join(" ");
  parts.push(`<text x="${r(cx)}" y="${r(titleBaseline)}" font-family="times" font-size="${r(titleSize)}" fill="#232323" text-anchor="middle">${trackedTitle}</text>`);

  const coordSize = pageW * 0.0125;
  parts.push(`<text x="${r(cx)}" y="${r(titleBaseline + titleSize * 0.7)}" font-family="helvetica" font-size="${r(coordSize)}" fill="#5a5a5a" text-anchor="middle">${esc(coords)}</text>`);

  const footSize = pageW * 0.0062;
  const footY = pageH - side * 0.45;
  parts.push(`<text x="${r(side)}" y="${r(footY)}" font-family="helvetica" font-size="${r(footSize)}" fill="#9a9a9a">© OpenStreetMap-Mitwirkende</text>`);
  parts.push(`<text x="${r(pageW - side)}" y="${r(footY)}" font-family="helvetica" font-size="${r(footSize)}" fill="#9a9a9a" text-anchor="end">${cm.w} × ${cm.h} cm</text>`);

  // Rahmen (Posterrand)
  for (const b of borderRects(pageW, pageH, border)) {
    parts.push(`<rect x="${r(b.x)}" y="${r(b.y)}" width="${r(b.w)}" height="${r(b.h)}" fill="none" stroke="#1a1a1a" stroke-width="${r(b.weight)}"/>`);
  }
  parts.push(`</svg>`);

  const doc = new DOMParser().parseFromString(parts.join(""), "image/svg+xml");
  return doc.documentElement as unknown as SVGSVGElement;
}

/** Baut das Vektor-SVG und speichert es als echtes Vektor-PDF (Seitengröße = gewähltes Format). */
export async function exportPosterPdf(opts: Opts): Promise<void> {
  const svgEl = await buildPosterSvg(opts);
  svgEl.style.position = "absolute";
  svgEl.style.left = "-10000px";
  svgEl.style.top = "0";
  document.body.appendChild(svgEl);
  try {
    const { jsPDF } = await import("jspdf");
    const { svg2pdf } = await import("svg2pdf.js");
    const cm = pageDimsCm(opts.format, opts.orientation);
    const pageW = cm.w * 10;
    const pageH = cm.h * 10;
    const doc = new jsPDF({
      orientation: pageW > pageH ? "l" : "p",
      unit: "mm",
      format: [pageW, pageH],
      compress: true,
    });
    await svg2pdf(svgEl, doc, { x: 0, y: 0, width: pageW, height: pageH });
    const url = doc.output("bloburl");
    const a = document.createElement("a");
    a.href = url as unknown as string;
    a.download = `${slug(opts.title)}-poster-${opts.format}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  } finally {
    svgEl.remove();
  }
}

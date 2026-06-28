// Kartenformen: die Karte wird in eine Form „ausgestanzt" (außen weiß).
// Eine gemeinsame Definition für Vorschau, PNG und PDF.

export type ShapeId = "none" | "heart" | "house" | "circle" | "border";

const r2 = (n: number) => Math.round(n * 100) / 100;

function heart(x0: number, y0: number, s: number): string {
  const X = (u: number) => r2(x0 + u * s);
  const Y = (v: number) => r2(y0 + v * s);
  return (
    `M${X(0.5)} ${Y(0.98)} C${X(0.5)} ${Y(0.98)} ${X(0.02)} ${Y(0.62)} ${X(0.02)} ${Y(0.3)} ` +
    `C${X(0.02)} ${Y(0.1)} ${X(0.2)} ${Y(0.02)} ${X(0.32)} ${Y(0.02)} ` +
    `C${X(0.43)} ${Y(0.02)} ${X(0.5)} ${Y(0.13)} ${X(0.5)} ${Y(0.2)} ` +
    `C${X(0.5)} ${Y(0.13)} ${X(0.57)} ${Y(0.02)} ${X(0.68)} ${Y(0.02)} ` +
    `C${X(0.8)} ${Y(0.02)} ${X(0.98)} ${Y(0.1)} ${X(0.98)} ${Y(0.3)} ` +
    `C${X(0.98)} ${Y(0.62)} ${X(0.5)} ${Y(0.98)} ${X(0.5)} ${Y(0.98)} Z`
  );
}

function house(x0: number, y0: number, s: number): string {
  const X = (u: number) => r2(x0 + u * s);
  const Y = (v: number) => r2(y0 + v * s);
  return (
    `M${X(0.5)} ${Y(0.02)} L${X(0.98)} ${Y(0.42)} L${X(0.86)} ${Y(0.42)} ` +
    `L${X(0.86)} ${Y(0.98)} L${X(0.14)} ${Y(0.98)} L${X(0.14)} ${Y(0.42)} L${X(0.02)} ${Y(0.42)} Z`
  );
}

/** Pfad der Form, mittig in der Region (x0,y0,W,H) – größtmögliches zentriertes Quadrat. */
export function shapePath(shape: ShapeId, x0: number, y0: number, W: number, H: number, inset = 0.99): string {
  if (shape === "none" || shape === "border") return "";
  const size = Math.min(W, H) * inset;
  const cx = x0 + W / 2;
  const cy = y0 + H / 2;
  if (shape === "circle") {
    const rad = r2(size / 2);
    return `M${r2(cx - size / 2)} ${r2(cy)} a${rad} ${rad} 0 1 0 ${r2(size)} 0 a${rad} ${rad} 0 1 0 ${r2(-size)} 0 Z`;
  }
  const sx = cx - size / 2;
  const sy = cy - size / 2;
  if (shape === "heart") return heart(sx, sy, size);
  if (shape === "house") return house(sx, sy, size);
  return "";
}

/**
 * Weiße Maske: Rechteck mit der Form als „Loch" (Füllregel evenodd).
 * Über die Karte gelegt erscheint die Karte nur innerhalb der Form, außen weiß.
 */
export function maskPath(shape: ShapeId, x0: number, y0: number, W: number, H: number): string {
  const sp = shapePath(shape, x0, y0, W, H);
  if (!sp) return "";
  return `M${r2(x0)} ${r2(y0)} H${r2(x0 + W)} V${r2(y0 + H)} H${r2(x0)} Z ${sp}`;
}

export function hasShape(shape: ShapeId): boolean {
  return shape === "heart" || shape === "house" || shape === "circle";
}

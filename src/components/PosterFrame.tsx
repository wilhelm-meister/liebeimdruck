import type { ReactNode } from "react";
import { LAYOUT, pageDimsCm, posterRect, type FormatId, type Orientation } from "@/lib/posterLayout";
import { hasShape, maskPath, type ShapeId } from "@/lib/shapes";

type Props = {
  title: string;
  coords: string;
  format: FormatId;
  orientation: Orientation;
  shape: ShapeId;
  enlarged?: boolean;
  children: ReactNode; // die Karte (MapCanvas)
};

export default function PosterFrame({ title, coords, format, orientation, shape, enlarged, children }: Props) {
  const { w, h } = pageDimsCm(format, orientation);
  const { rectW, rectH } = posterRect(w, h);

  const maxVH = enlarged ? 90 : 82;
  const maxVW = enlarged ? 92 : 60;
  const ratioHW = (h / w).toFixed(4); // Höhe / Breite

  // Maske für die Kartenform (gleiches Seitenverhältnis wie die Kartenfläche)
  const vbW = 1000;
  const vbH = Math.round((1000 * rectH) / rectW);
  const mask = hasShape(shape) ? maskPath(shape, 0, 0, vbW, vbH) : "";

  return (
    <div
      className="relative flex flex-col bg-white shadow-[0_10px_45px_rgba(0,0,0,0.12)]"
      style={{
        aspectRatio: `${w} / ${h}`,
        height: `min(${maxVH}vh, calc(${maxVW}vw * ${ratioHW}))`,
      }}
    >
      <div
        className="flex h-full flex-col"
        style={{
          paddingLeft: `${LAYOUT.side * 100}%`,
          paddingRight: `${LAYOUT.side * 100}%`,
          paddingTop: `${LAYOUT.top * 100}%`,
        }}
      >
        {/* Kartenfläche – exakt das Seitenverhältnis, das auch ins PDF/PNG geht */}
        <div className="relative w-full overflow-hidden" style={{ aspectRatio: `${rectW} / ${rectH}` }}>
          {children}
          {mask && (
            <svg
              className="pointer-events-none absolute inset-0 h-full w-full"
              style={{ zIndex: 5 }}
              viewBox={`0 0 ${vbW} ${vbH}`}
              preserveAspectRatio="none"
            >
              <path d={mask} fill="#ffffff" fillRule="evenodd" />
            </svg>
          )}
        </div>

        {/* Titelband füllt den restlichen Platz (= Bandhöhe aus dem Layout) */}
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <h2 className="poster-title font-serif uppercase leading-none tracking-[0.18em] text-ink text-[clamp(1.3rem,3vh,2.6rem)]">
            {title}
          </h2>
          <p className="poster-coords mt-2 text-[clamp(0.5rem,1vh,0.78rem)] tracking-[0.25em] text-ink/60">
            {coords}
          </p>
        </div>
      </div>

      {/* Pflicht-Quellenangabe */}
      <div className="pointer-events-none absolute bottom-1.5 right-3 text-[8px] tracking-wide text-ink/35">
        © OpenStreetMap-Mitwirkende
      </div>
      <div className="pointer-events-none absolute bottom-1.5 left-3 text-[8px] tracking-wide text-ink/35">
        Maßstab ~1:40200
      </div>
    </div>
  );
}

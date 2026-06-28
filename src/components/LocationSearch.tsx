"use client";

import { useEffect, useRef, useState } from "react";
import { searchPlaces, type Place } from "@/lib/photon";

export default function LocationSearch({
  onSelect,
}: {
  onSelect: (place: Place) => void;
}) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Place[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (q.trim().length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const r = await searchPlaces(q);
        setResults(r);
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={boxRef} className="relative">
      <span className="absolute -top-2 left-3 z-10 bg-white px-1 text-[11px] text-ink/50">
        Standort
      </span>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        placeholder="Ort oder Adresse…"
        className="w-full rounded-md border border-ink/30 bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-ink/60"
      />

      {loading && (
        <span className="absolute right-3 top-3 text-[11px] text-ink/40">sucht…</span>
      )}

      {open && results.length > 0 && (
        <ul className="absolute z-30 mt-1 max-h-72 w-full overflow-auto rounded-md border border-line bg-white py-1 shadow-lg">
          {results.map((p, i) => (
            <li key={`${p.name}-${i}`}>
              <button
                onClick={() => {
                  onSelect(p);
                  setQ("");
                  setResults([]);
                  setOpen(false);
                }}
                className="flex w-full flex-col items-start px-3 py-2 text-left transition hover:bg-paper"
              >
                <span className="text-sm font-medium text-ink">{p.name}</span>
                {p.context && <span className="text-[11px] text-ink/50">{p.context}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

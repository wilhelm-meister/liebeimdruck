export type Place = {
  name: string;
  context: string;
  center: [number, number]; // [lon, lat]
  bbox?: [number, number, number, number]; // [west, north, east, south]
};

type PhotonFeature = {
  geometry: { coordinates: [number, number] };
  properties: Record<string, unknown>;
};

/**
 * Ortssuche über Photon (komoot) – kostenlos, OpenStreetMap-basiert, kein API-Key.
 */
export async function searchPlaces(query: string): Promise<Place[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=6&lang=de`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Geocoding fehlgeschlagen");

  const data = (await res.json()) as { features?: PhotonFeature[] };

  return (data.features ?? []).map((f) => {
    const p = f.properties;
    const [lon, lat] = f.geometry.coordinates;

    const str = (k: string): string | undefined => {
      const v = p[k];
      return typeof v === "string" && v.length > 0 ? v : undefined;
    };

    const street = [str("street"), str("housenumber")].filter(Boolean).join(" ");
    const name = str("name") || (street.length > 0 ? street : undefined) || str("city") || "Unbekannt";

    const city = str("city");
    const context = [
      city && city !== name ? city : undefined,
      str("state"),
      str("country"),
    ]
      .filter(Boolean)
      .join(" · ");

    const ext = p.extent as number[] | undefined;
    const bbox =
      Array.isArray(ext) && ext.length === 4
        ? ([ext[0], ext[1], ext[2], ext[3]] as [number, number, number, number])
        : undefined;

    return { name, context, center: [lon, lat] as [number, number], bbox };
  });
}

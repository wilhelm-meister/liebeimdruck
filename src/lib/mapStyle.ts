import type { StyleSpecification, LayerSpecification } from "maplibre-gl";

export type Detail = "roads" | "roads_buildings" | "buildings";
export type Labels = "none" | "places";

type BuildOpts = {
  detail: Detail;
  labels: Labels;
  tileKey?: string;
};

const INK = "#1a1a1a";
const WATER = "#a9c9e8";

/** Quelle der Vektor-Kacheln (gleich für Bildschirm-Stil und PDF-Export). */
export function tileSourceUrl(tileKey?: string): string {
  return tileKey
    ? `https://api.maptiler.com/tiles/v3/tiles.json?key=${tileKey}`
    : "https://tiles.openfreemap.org/planet";
}

/**
 * Baut einen minimalistischen Schwarz-Weiß-Kartenstil im Poster-Look.
 *
 * Datenquelle:
 *  - mit MapTiler-Key  -> MapTiler (OpenMapTiles-Schema)
 *  - ohne Key          -> OpenFreeMap (kostenlos, gleiches Schema)
 * Beides basiert auf OpenStreetMap.
 */
export function buildMapStyle({ detail, labels, tileKey }: BuildOpts): StyleSpecification {
  const tilesUrl = tileSourceUrl(tileKey);
  const glyphs = tileKey
    ? `https://api.maptiler.com/fonts/{fontstack}/{range}.pbf?key=${tileKey}`
    : "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf";

  const showRoads = detail === "roads" || detail === "roads_buildings";
  const showBuildings = detail === "roads_buildings" || detail === "buildings";
  const buildingColor = detail === "buildings" ? "#c9c9c9" : "#ececec";

  const layers: LayerSpecification[] = [
    {
      id: "background",
      type: "background",
      paint: { "background-color": "#ffffff" },
    },
    {
      id: "water",
      type: "fill",
      source: "openmaptiles",
      "source-layer": "water",
      paint: { "fill-color": WATER, "fill-antialias": true },
    },
    {
      id: "waterway",
      type: "line",
      source: "openmaptiles",
      "source-layer": "waterway",
      paint: {
        "line-color": WATER,
        "line-width": ["interpolate", ["linear"], ["zoom"], 10, 0.6, 14, 1.6, 17, 3],
      },
    },
  ];

  if (showBuildings) {
    layers.push({
      id: "building",
      type: "fill",
      source: "openmaptiles",
      "source-layer": "building",
      minzoom: 13,
      paint: {
        "fill-color": buildingColor,
        "fill-outline-color": "#d8d8d8",
        "fill-opacity": ["interpolate", ["linear"], ["zoom"], 13, 0, 14, 0.9],
      },
    });
  }

  if (showRoads) {
    // Reihenfolge: kleine Straßen zuerst, große oben drauf.
    layers.push(
      {
        id: "roads-minor",
        type: "line",
        source: "openmaptiles",
        "source-layer": "transportation",
        filter: [
          "match",
          ["get", "class"],
          ["minor", "service", "track", "path", "pedestrian", "living_street"],
          true,
          false,
        ],
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": "#3a3a3a",
          "line-width": ["interpolate", ["linear"], ["zoom"], 12, 0.25, 14, 0.7, 16, 1.6, 18, 3],
        },
      },
      {
        id: "roads-medium",
        type: "line",
        source: "openmaptiles",
        "source-layer": "transportation",
        filter: ["match", ["get", "class"], ["secondary", "tertiary"], true, false],
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": "#202020",
          "line-width": ["interpolate", ["linear"], ["zoom"], 10, 0.4, 13, 1.4, 15, 2.6, 17, 5],
        },
      },
      {
        id: "roads-major",
        type: "line",
        source: "openmaptiles",
        "source-layer": "transportation",
        filter: ["match", ["get", "class"], ["motorway", "trunk", "primary"], true, false],
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": INK,
          "line-width": ["interpolate", ["linear"], ["zoom"], 8, 0.6, 11, 1.4, 13, 2.6, 15, 4.5, 17, 8],
        },
      },
    );
  }

  if (labels === "places") {
    layers.push({
      id: "place-labels",
      type: "symbol",
      source: "openmaptiles",
      "source-layer": "place",
      filter: [
        "match",
        ["get", "class"],
        ["city", "town", "village", "suburb", "quarter", "neighbourhood"],
        true,
        false,
      ],
      layout: {
        "text-field": ["coalesce", ["get", "name:de"], ["get", "name"]],
        "text-font": ["Noto Sans Regular"],
        "text-size": ["interpolate", ["linear"], ["zoom"], 8, 11, 12, 14, 15, 17],
        "text-letter-spacing": 0.05,
        "text-max-width": 8,
      },
      paint: {
        "text-color": "#2a2a2a",
        "text-halo-color": "#ffffff",
        "text-halo-width": 1.4,
      },
    });
  }

  return {
    version: 8,
    name: "Poster S/W",
    glyphs,
    sources: {
      openmaptiles: { type: "vector", url: tilesUrl },
    },
    layers,
  };
}

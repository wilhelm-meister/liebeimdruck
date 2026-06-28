// Farbthemen für die Karte. Eine Definition steuert Vorschau, PNG und Vektor-PDF.

export type Theme = {
  id: string;
  name: string;
  bg: string; // Kartenhintergrund (Land)
  water: string;
  roadMajor: string;
  roadMedium: string;
  roadMinor: string;
  building: string; // Detailstufe „Straßen & Gebäude"
  buildingStrong: string; // Detailstufe „Gebäude"
  buildingOutline: string;
  label: string;
  labelHalo: string;
};

export const THEMES: Theme[] = [
  {
    id: "klassik",
    name: "Klassik",
    bg: "#ffffff",
    water: "#a9c9e8",
    roadMajor: "#1a1a1a",
    roadMedium: "#3a3a3a",
    roadMinor: "#9a9a9a",
    building: "#ececec",
    buildingStrong: "#c9c9c9",
    buildingOutline: "#d8d8d8",
    label: "#2a2a2a",
    labelHalo: "#ffffff",
  },
  {
    id: "mitternacht",
    name: "Mitternacht",
    bg: "#15171c",
    water: "#243042",
    roadMajor: "#ffffff",
    roadMedium: "#c7ccd4",
    roadMinor: "#525a66",
    building: "#22262f",
    buildingStrong: "#333a46",
    buildingOutline: "#2b303a",
    label: "#ffffff",
    labelHalo: "#15171c",
  },
  {
    id: "marine",
    name: "Marine",
    bg: "#163a66",
    water: "#23528a",
    roadMajor: "#ffffff",
    roadMedium: "#cfddf0",
    roadMinor: "#3f6494",
    building: "#1d4576",
    buildingStrong: "#2a5689",
    buildingOutline: "#1d4576",
    label: "#ffffff",
    labelHalo: "#163a66",
  },
  {
    id: "wald",
    name: "Wald",
    bg: "#34a85f",
    water: "#ffffff",
    roadMajor: "#ffffff",
    roadMedium: "#ffffff",
    roadMinor: "#8ad3a7",
    building: "#2c9a55",
    buildingStrong: "#23823f",
    buildingOutline: "#2c9a55",
    label: "#ffffff",
    labelHalo: "#34a85f",
  },
  {
    id: "lavendel",
    name: "Lavendel",
    bg: "#8c80d8",
    water: "#ffffff",
    roadMajor: "#ffffff",
    roadMedium: "#ffffff",
    roadMinor: "#b6aee8",
    building: "#7f72cf",
    buildingStrong: "#6e60c1",
    buildingOutline: "#7f72cf",
    label: "#ffffff",
    labelHalo: "#8c80d8",
  },
  {
    id: "koralle",
    name: "Koralle",
    bg: "#ec6a5e",
    water: "#ffffff",
    roadMajor: "#ffffff",
    roadMedium: "#ffffff",
    roadMinor: "#f4988f",
    building: "#e35b50",
    buildingStrong: "#d44a40",
    buildingOutline: "#e35b50",
    label: "#ffffff",
    labelHalo: "#ec6a5e",
  },
  {
    id: "sonne",
    name: "Sonne",
    bg: "#f5c63d",
    water: "#fffdf6",
    roadMajor: "#4a3a10",
    roadMedium: "#6e5a1e",
    roadMinor: "#cba83e",
    building: "#eec24a",
    buildingStrong: "#e0b031",
    buildingOutline: "#e0b031",
    label: "#4a3a10",
    labelHalo: "#f5c63d",
  },
  {
    id: "sand",
    name: "Sand",
    bg: "#f3ecdf",
    water: "#bcccd8",
    roadMajor: "#5a4a3a",
    roadMedium: "#8a7a66",
    roadMinor: "#cabfa9",
    building: "#e8dec9",
    buildingStrong: "#d8caac",
    buildingOutline: "#ddd2bb",
    label: "#5a4a3a",
    labelHalo: "#f3ecdf",
  },
];

export function getTheme(id: string): Theme {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}

// — Eigene Farben —
export type CustomColors = {
  bg: string; // Land / Hintergrund
  water: string;
  road: string; // Straßen
  building: string; // Gebäude
  label: string; // Beschriftung
};

export const DEFAULT_CUSTOM: CustomColors = {
  bg: "#1d2b4a",
  water: "#3ecf6f",
  road: "#3ecf6f",
  building: "#27365a",
  label: "#ffffff",
};

function hexToRgb(h: string): [number, number, number] {
  const x = h.replace("#", "");
  return [parseInt(x.slice(0, 2), 16), parseInt(x.slice(2, 4), 16), parseInt(x.slice(4, 6), 16)];
}

function mix(a: string, b: string, t: number): string {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  const ch = (i: number) => {
    const v = Math.round(A[i] + (B[i] - A[i]) * t);
    return Math.max(0, Math.min(255, v)).toString(16).padStart(2, "0");
  };
  return `#${ch(0)}${ch(1)}${ch(2)}`;
}

/** Baut aus 5 Grundfarben ein vollständiges Theme (abgeleitete Töne per Mischung). */
export function buildCustomTheme(c: CustomColors): Theme {
  return {
    id: "custom",
    name: "Eigene Farben",
    bg: c.bg,
    water: c.water,
    roadMajor: c.road,
    roadMedium: c.road,
    roadMinor: mix(c.road, c.bg, 0.5), // hellere Nebenstraßen Richtung Hintergrund
    building: c.building,
    buildingStrong: mix(c.building, "#000000", 0.14),
    buildingOutline: mix(c.building, c.bg, 0.4),
    label: c.label,
    labelHalo: c.bg,
  };
}

function pad2(n: number): string {
  return n < 10 ? "0" + n : "" + n;
}

function degMin(value: number, pos: string, neg: string): string {
  const letter = value >= 0 ? pos : neg;
  const abs = Math.abs(value);
  let deg = Math.floor(abs);
  let min = Math.round((abs - deg) * 60);
  if (min === 60) {
    deg += 1;
    min = 0;
  }
  return `${pad2(deg)}°${pad2(min)}' ${letter}`;
}

/**
 * Formatiert Koordinaten wie auf dem Poster: "53°05' N 08°48' O"
 * (deutsche Himmelsrichtungen: N/S, O/W).
 */
export function formatCoords(lat: number, lon: number): string {
  return `${degMin(lat, "N", "S")} ${degMin(lon, "O", "W")}`;
}

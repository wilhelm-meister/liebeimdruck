# LIEBE IM DRUCK – Kartenposter-Konfigurator

Ein interaktiver Konfigurator für personalisierte Karten-Poster – ähnlich wie Cartida,
aber auf Basis offener Daten (OpenStreetMap) statt Google Maps.

## Warum nicht Google Maps?

1. **Lizenz:** Aus Google-Maps-Kacheln darf man laut Nutzungsbedingungen keine
   verkauften Druckprodukte erstellen. OpenStreetMap (ODbL) erlaubt das mit
   Quellenangabe „© OpenStreetMap-Mitwirkende".
2. **Auflösung:** Google liefert max. ~1280 px – zu wenig für ein Poster in
   Druckqualität (30×40 cm @ 300 dpi ≈ 3500×4700 px).

Deshalb nutzen alle großen Karten-Poster-Shops (Cartida, Mapiful, Grafomap …)
OpenStreetMap. Diese App auch.

## Technik

- **Next.js** (App Router) + **React**
- **MapLibre GL** – Open-Source-Karten-Engine für die Live-Vorschau
- **Karten:** OpenFreeMap (kostenlos, kein API-Key) – optional MapTiler per Key
- **Ortssuche:** Photon (kostenlos, OSM-basiert)

## Starten

```bash
npm install
npm run dev
```

Dann http://localhost:3000 öffnen.

## Konfiguration

Standardmäßig kein API-Key nötig (OpenFreeMap). Für die Produktion optional einen
MapTiler-Key in `.env.local` eintragen (siehe `.env.local.example`).

## Markenname

Der Markenname „LIEBE IM DRUCK" steht in `src/components/TopNav.tsx` (Konstante
`BRAND`) – dort bei Bedarf ändern.

## Nächste Ausbaustufen (bewusst noch nicht enthalten)

- Kartenformen (Herz/Haus/Kreis/Grenzen), 2. Karte, Text-Editor, Fotos
- Warenkorb + Bezahlung (z. B. Stripe)
- Hochauflösendes Druck-PDF (serverseitiges Rendering)

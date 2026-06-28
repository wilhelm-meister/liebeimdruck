/** @type {import('next').NextConfig} */

// Beim GitHub-Pages-Build (Action setzt PAGES=true) wird die Seite unter
// /liebeimdruck ausgeliefert. Lokal (npm run dev) bleibt der Pfad leer.
const isPages = process.env.PAGES === "true";

const nextConfig = {
  reactStrictMode: true,
  output: "export", // statischer Export (out/) für GitHub Pages
  trailingSlash: true,
  images: { unoptimized: true },
  ...(isPages ? { basePath: "/liebeimdruck", assetPrefix: "/liebeimdruck/" } : {}),
};

export default nextConfig;

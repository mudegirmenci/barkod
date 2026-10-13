import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "EsnafPOS - Barkodlu Hızlı Satış ve Stok",
    short_name: "EsnafPOS",
    description:
      "Küçük esnaflar için PWA destekli barkodlu hızlı satış, internetten fiyat araştırma ve stok takip uygulaması",
    start_url: "/",
    display: "standalone",
    background_color: "#020617",
    theme_color: "#10b981",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}

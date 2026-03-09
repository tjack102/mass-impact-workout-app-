import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Mass Impact",
    short_name: "MassImpact",
    description: "Shared household workout tracker with fast runtime logging.",
    start_url: "/",
    display: "standalone",
    background_color: "#0B0D10",
    theme_color: "#0B0D10",
    icons: [
      {
        src: "/icon.svg",
        type: "image/svg+xml",
        sizes: "any",
        purpose: "any",
      },
    ],
  };
}

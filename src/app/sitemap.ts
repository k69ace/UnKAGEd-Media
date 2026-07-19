import type { MetadataRoute } from "next";
import { apps } from "@/lib/apps";
import { site } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${site.url}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${site.url}/apps`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${site.url}/about`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${site.url}/contact`, changeFrequency: "monthly", priority: 0.6 },
  ];

  const appRoutes: MetadataRoute.Sitemap = apps.map((app) => ({
    url: `${site.url}/apps/${app.slug}`,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  return [...staticRoutes, ...appRoutes];
}

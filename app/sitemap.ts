import { getSiteUrl } from "@/utils/site-metadata";
import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  const lastModified = new Date();

  return [
    {
      url: siteUrl,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteUrl}/privacy`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${siteUrl}/terms`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];
}

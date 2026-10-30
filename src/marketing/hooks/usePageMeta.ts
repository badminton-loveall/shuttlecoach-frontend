import { useEffect } from "react";
import { SITE_URL, setCanonical, setMetaTag } from "../utils/meta";

interface PageMeta {
  title: string;
  description: string;
  path: string;
  image?: string;
}

/** Branded 1200×630 share card in /public. */
const DEFAULT_OG_IMAGE = "/og-image.png";

export function usePageMeta({ title, description, path, image = DEFAULT_OG_IMAGE }: PageMeta): void {
  useEffect(() => {
    const fullTitle = title.includes("LoveAll") ? title : `${title} · LoveAll`;
    const url = `${SITE_URL}${path}`;
    document.title = fullTitle;
    setMetaTag("name", "description", description);
    setMetaTag("property", "og:title", fullTitle);
    setMetaTag("property", "og:description", description);
    setMetaTag("property", "og:url", url);
    setMetaTag("property", "og:type", "website");
    setMetaTag("property", "og:site_name", "LoveAll");
    setMetaTag("property", "og:locale", "en_IN");
    // Scrapers need an absolute image URL.
    const imageUrl = image.startsWith("http") ? image : `${SITE_URL}${image}`;
    setMetaTag("property", "og:image", imageUrl);
    setMetaTag("name", "twitter:image", imageUrl);
    setMetaTag("name", "twitter:card", "summary_large_image");
    setMetaTag("name", "twitter:title", fullTitle);
    setMetaTag("name", "twitter:description", description);
    setCanonical(url);
  }, [title, description, path, image]);
}
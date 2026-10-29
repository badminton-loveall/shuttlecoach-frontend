import { useEffect } from "react";
import { images } from "../data/site";
import { SITE_URL, setCanonical, setMetaTag } from "../utils/meta";

interface PageMeta {
  title: string;
  description: string;
  path: string;
  image?: string;
}

const DEFAULT_OG_IMAGE = images.coachJunior.src;

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
    setMetaTag("property", "og:image", image);
    setMetaTag("name", "twitter:card", "summary_large_image");
    setMetaTag("name", "twitter:title", fullTitle);
    setMetaTag("name", "twitter:description", description);
    setCanonical(url);
  }, [title, description, path, image]);
}
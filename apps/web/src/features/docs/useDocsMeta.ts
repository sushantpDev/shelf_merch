import { useEffect } from "react";

type DocsMeta = {
  title: string;
  description: string;
  canonicalPath: string;
  ogTitle?: string;
  ogDescription?: string;
};

function upsertMeta(attr: "name" | "property", key: string, content: string) {
  const selector = `meta[${attr}="${key}"]`;
  let el = document.head.querySelector(selector) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.content = content;
}

function upsertCanonical(href: string) {
  let el = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement("link");
    el.rel = "canonical";
    document.head.appendChild(el);
  }
  el.href = href;
}

/** Sets unique SEO / Open Graph metadata for public documentation pages. */
export function useDocsMeta({
  title,
  description,
  canonicalPath,
  ogTitle,
  ogDescription,
}: DocsMeta) {
  useEffect(() => {
    const prevTitle = document.title;
    const canonical = `https://shelfmerch.io${canonicalPath}`;
    document.title = title;
    upsertMeta("name", "description", description);
    upsertMeta("property", "og:title", ogTitle || title);
    upsertMeta("property", "og:description", ogDescription || description);
    upsertMeta("property", "og:url", canonical);
    upsertMeta("property", "og:type", "website");
    upsertCanonical(canonical);
    return () => {
      document.title = prevTitle;
    };
  }, [title, description, canonicalPath, ogTitle, ogDescription]);
}

export type SourcedPhoto = {
  imageUrl: string;
  photographer: string;
  sourceUrl: string;
  license: "Unsplash License" | "Pexels License";
};

type UnsplashSearchResponse = {
  results: Array<{
    urls: { raw: string; full: string };
    user: { name: string };
    links: { html: string };
  }>;
};

type PexelsSearchResponse = {
  photos: Array<{
    src: { original: string; large2x: string };
    photographer: string;
    url: string;
  }>;
};

const UNSPLASH_KEY = process.env.UNSPLASH_ACCESS_KEY;
const PEXELS_KEY = process.env.PEXELS_API_KEY;

export async function searchUnsplash(
  query: string,
  orientation: "landscape" | "squarish",
): Promise<SourcedPhoto | null> {
  if (!UNSPLASH_KEY) throw new Error("UNSPLASH_ACCESS_KEY missing");
  const url = new URL("https://api.unsplash.com/search/photos");
  url.searchParams.set("query", query);
  url.searchParams.set("orientation", orientation);
  url.searchParams.set("per_page", "5");
  url.searchParams.set("content_filter", "high");
  const res = await fetch(url, { headers: { Authorization: `Client-ID ${UNSPLASH_KEY}` } });
  if (!res.ok) {
    if (res.status === 403) throw new Error(`Unsplash quota exhausted: ${await res.text()}`);
    throw new Error(`Unsplash ${res.status}: ${await res.text()}`);
  }
  const json = (await res.json()) as UnsplashSearchResponse;
  const hit = json.results[0];
  if (!hit) return null;
  return {
    imageUrl: hit.urls.full,
    photographer: hit.user.name,
    sourceUrl: hit.links.html,
    license: "Unsplash License",
  };
}

export async function searchPexels(
  query: string,
  orientation: "landscape" | "square",
): Promise<SourcedPhoto | null> {
  if (!PEXELS_KEY) throw new Error("PEXELS_API_KEY missing");
  const url = new URL("https://api.pexels.com/v1/search");
  url.searchParams.set("query", query);
  url.searchParams.set("orientation", orientation);
  url.searchParams.set("per_page", "5");
  const res = await fetch(url, { headers: { Authorization: PEXELS_KEY } });
  if (!res.ok) {
    if (res.status === 429) throw new Error(`Pexels quota exhausted: ${await res.text()}`);
    throw new Error(`Pexels ${res.status}: ${await res.text()}`);
  }
  const json = (await res.json()) as PexelsSearchResponse;
  const hit = json.photos[0];
  if (!hit) return null;
  return {
    imageUrl: hit.src.original,
    photographer: hit.photographer,
    sourceUrl: hit.url,
    license: "Pexels License",
  };
}

export async function downloadBytes(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download failed ${res.status} for ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

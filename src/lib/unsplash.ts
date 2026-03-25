/**
 * @module unsplash
 * Unsplash API integration for searching background images.
 *
 * Requires VITE_UNSPLASH_ACCESS_KEY to be set for search functionality.
 * Curated favourites work without an API key.
 */

export interface UnsplashPhoto {
  id: string;
  url: string;
  thumb: string;
  alt: string;
}

/** Curated background images — no API key needed. */
export const CURATED_BACKGROUNDS: UnsplashPhoto[] = [
  { id: "c1", url: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200", thumb: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=300", alt: "Starry night mountains" },
  { id: "c2", url: "https://images.unsplash.com/photo-1514905552197-0610a4d8fd73?w=1200", thumb: "https://images.unsplash.com/photo-1514905552197-0610a4d8fd73?w=300", alt: "Neon city lights" },
  { id: "c3", url: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200", thumb: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=300", alt: "Retro computer setup" },
  { id: "c4", url: "https://images.unsplash.com/photo-1457364559154-aa2644600ebb?w=1200", thumb: "https://images.unsplash.com/photo-1457364559154-aa2644600ebb?w=300", alt: "Colorful bubbles" },
  { id: "c5", url: "https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?w=1200", thumb: "https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?w=300", alt: "Sunset ocean" },
  { id: "c6", url: "https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=1200", thumb: "https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=300", alt: "Purple gradient" },
  { id: "c7", url: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=1200", thumb: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=300", alt: "Aurora borealis" },
  { id: "c8", url: "https://images.unsplash.com/photo-1528724467321-cf15249af6d0?w=1200", thumb: "https://images.unsplash.com/photo-1528724467321-cf15249af6d0?w=300", alt: "Vintage cassette tape" },
  { id: "c9", url: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=1200", thumb: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=300", alt: "Old TV static" },
  { id: "c10", url: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200", thumb: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=300", alt: "Matrix rain code" },
  { id: "c11", url: "https://images.unsplash.com/photo-1507400492013-162706c8c05e?w=1200", thumb: "https://images.unsplash.com/photo-1507400492013-162706c8c05e?w=300", alt: "Ocean night" },
  { id: "c12", url: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=1200", thumb: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=300", alt: "Deep space nebula" },
];

/** Default search categories for nostalgia themes. */
export const SEARCH_CATEGORIES = [
  "retro neon", "90s aesthetic", "pixel art", "stars night sky",
  "vaporwave", "vintage computer", "Y2K aesthetic", "sunset gradient",
];

const ACCESS_KEY = import.meta.env.VITE_UNSPLASH_ACCESS_KEY as string | undefined;

/** Whether the Unsplash search API is available (key configured). */
export const isSearchAvailable = !!ACCESS_KEY;

/** Search Unsplash for photos. Requires VITE_UNSPLASH_ACCESS_KEY. */
export async function searchUnsplash(query: string, perPage = 12): Promise<UnsplashPhoto[]> {
  if (!ACCESS_KEY) return [];

  const url = new URL("https://api.unsplash.com/search/photos");
  url.searchParams.set("query", query);
  url.searchParams.set("per_page", String(perPage));
  url.searchParams.set("orientation", "landscape");

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Client-ID ${ACCESS_KEY}` },
  });

  if (!res.ok) return [];

  const data = await res.json();
  return (data.results ?? []).map((p: any) => ({
    id: p.id,
    url: p.urls?.regular ?? p.urls?.full,
    thumb: p.urls?.thumb ?? p.urls?.small,
    alt: p.alt_description ?? p.description ?? "Unsplash photo",
  }));
}

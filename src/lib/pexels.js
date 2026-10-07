const API = "https://api.pexels.com/v1";
const KEY = import.meta.env.VITE_PEXELS_API_KEY;

export const PER_PAGE = 40;

const normalize = (p) => ({
  id: p.id,
  width: p.width,
  height: p.height,
  color: p.avg_color || "#2a2622",
  alt: p.alt || "",
  photographer: p.photographer,
  photographerUrl: p.photographer_url,
  url: p.url,
  original: p.src.original,
});

// Colour filtering needs a subject; this one keeps tone searches graphic.
const TONE_SUBJECT = "minimal";

// Pexels' `next_page` links are malformed (/v1/v1/…), so pages are built by hand.
export async function fetchPhotos({ query, color, page = 1, signal }) {
  if (!KEY) {
    throw new Error("Missing VITE_PEXELS_API_KEY — add it to .env.local");
  }
  const subject = query || (color ? TONE_SUBJECT : "");
  const tone = color ? `&color=${encodeURIComponent(color)}` : "";
  const url = subject
    ? `${API}/search?query=${encodeURIComponent(subject)}${tone}&page=${page}&per_page=${PER_PAGE}`
    : `${API}/curated?page=${page}&per_page=${PER_PAGE}`;

  const res = await fetch(url, { headers: { Authorization: KEY }, signal });
  if (!res.ok) {
    throw new Error(
      res.status === 429
        ? "Too much light — the rate limit was reached. Try again shortly."
        : `The darkroom is offline (Pexels ${res.status}).`
    );
  }
  const data = await res.json();
  return {
    photos: (data.photos || []).map(normalize),
    hasMore: Boolean(data.next_page),
    total: data.total_results ?? null,
  };
}

// Pexels resizes on the fly from the original.
export const photoSrc = (photo, width) =>
  `${photo.original}?auto=compress&cs=tinysrgb&w=${Math.round(width)}`;

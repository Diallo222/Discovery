import { create } from "zustand";
import { fetchPhotos } from "./pexels";
import { writeUrl } from "./url";

let controller = null;
let noticeTimer = null;

const dedupe = (list) => {
  const seen = new Set();
  return list.filter((p) => (seen.has(p.id) ? false : seen.add(p.id)));
};

export const useStore = create((set, get) => ({
  query: "", // "" means Pexels' daily curation
  color: "", // optional Pexels tone filter
  photos: [],
  page: 0,
  hasMore: true,
  total: null,
  status: "idle", // idle | loading | ready | error
  error: null,
  generation: 0, // bumps on every new result set so the field re-develops

  mode: "field", // field | index
  loaded: false, // preloader finished
  loadProgress: 0,
  fieldReady: false,

  searchOpen: false,
  infoOpen: false,
  selected: null, // { photoIndex, origin, rect, tileIndex, lowSrc }
  hovered: -1, // photo index under the pointer in the field
  notice: null,

  kept: loadKept(), // the visitor's roll of favourite prints (full photo records)
  indexTab: "all", // all | kept
  exposure: 0, // EV, -2 … +2

  search: async (raw, color = "") => {
    const query = (raw ?? "").trim();
    controller?.abort();
    controller = new AbortController();
    set({ status: "loading", error: null });
    try {
      const res = await fetchPhotos({ query, color, page: 1, signal: controller.signal });
      if (!res.photos.length) {
        set({ status: "ready" });
        get().notify(`No frames found for “${queryLabel(query, color)}”. Try another subject.`);
        // A dead shared link must not leave the first load with nothing to develop.
        if (!get().photos.length && (query || color)) get().search("");
        return;
      }
      writeUrl(query, color);
      set((s) => ({
        query,
        color,
        photos: dedupe(res.photos),
        page: 1,
        hasMore: res.hasMore,
        total: res.total,
        status: "ready",
        generation: s.generation + 1,
      }));
      remember(query);
    } catch (err) {
      if (err.name === "AbortError") return;
      set({ status: "error", error: err.message });
    }
  },

  loadMore: async () => {
    const { status, hasMore, query, color, page, photos } = get();
    if (status === "loading" || !hasMore || !photos.length) return;
    controller = new AbortController();
    set({ status: "loading" });
    try {
      const res = await fetchPhotos({ query, color, page: page + 1, signal: controller.signal });
      set((s) => ({
        photos: dedupe([...s.photos, ...res.photos]),
        page: page + 1,
        hasMore: res.hasMore,
        status: "ready",
      }));
    } catch (err) {
      if (err.name === "AbortError") return;
      set({ status: "ready" });
      get().notify(err.message);
    }
  },

  notify: (message) => {
    clearTimeout(noticeTimer);
    set({ notice: message });
    noticeTimer = setTimeout(() => set({ notice: null }), 4200);
  },

  setMode: (mode) => set({ mode }),
  setLoaded: () => set({ loaded: true }),
  setLoadProgress: (loadProgress) => set({ loadProgress }),
  setFieldReady: (fieldReady) => set({ fieldReady }),
  setSearchOpen: (searchOpen) => set({ searchOpen }),
  setInfoOpen: (infoOpen) => set({ infoOpen }),
  setHovered: (hovered) => get().hovered !== hovered && set({ hovered }),
  openDetail: (selected) => set({ selected }),
  closeDetail: () => set({ selected: null }),
  setIndexTab: (indexTab) => set({ indexTab }),
  setExposure: (exposure) => set({ exposure }),

  toggleKeep: (photo) =>
    set((s) => {
      const has = s.kept.some((p) => p.id === photo.id);
      const kept = has ? s.kept.filter((p) => p.id !== photo.id) : [photo, ...s.kept].slice(0, KEPT_MAX);
      saveKept(kept);
      return { kept };
    }),
}));

const KEPT_KEY = "discovery:kept";
const KEPT_MAX = 120;

function loadKept() {
  try {
    const kept = JSON.parse(localStorage.getItem(KEPT_KEY));
    return Array.isArray(kept) ? kept : [];
  } catch {
    return [];
  }
}

function saveKept(kept) {
  try {
    localStorage.setItem(KEPT_KEY, JSON.stringify(kept));
  } catch {
    /* storage unavailable — the roll lasts for this visit only */
  }
}

export const isKept = (kept, photo) => Boolean(photo) && kept.some((p) => p.id === photo.id);

const RECENT_KEY = "discovery:recent";

export function getRecent() {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY)) || [];
  } catch {
    return [];
  }
}

function remember(query) {
  if (!query) return;
  try {
    const next = [query, ...getRecent().filter((q) => q.toLowerCase() !== query.toLowerCase())];
    localStorage.setItem(RECENT_KEY, JSON.stringify(next.slice(0, 4)));
  } catch {
    /* storage unavailable — recent searches are a nicety */
  }
}

const capitalize = (text) => text.replace(/(^|\s)\p{L}/gu, (c) => c.toUpperCase());

export const queryLabel = (query, color) => {
  if (query && color) return `${capitalize(query)}, in ${color}`;
  if (query) return capitalize(query);
  if (color) return `${capitalize(color)} tones`;
  return "Today’s curation";
};

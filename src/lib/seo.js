const BASE_TITLE = "Discovery — An Infinite Darkroom";
const BASE_DESCRIPTION =
  "Wander an endless, living contact sheet of photographs and watch them develop in real time.";

const capitalize = (text) => text.replace(/(^|\s)\p{L}/gu, (c) => c.toUpperCase());

function sheetLabel(query, color) {
  if (query && color) return `${capitalize(query)}, in ${color}`;
  if (query) return capitalize(query);
  if (color) return `${capitalize(color)} tones`;
  return "";
}

function setMeta(selector, attr, value) {
  const el = document.querySelector(selector);
  if (el && value) el.setAttribute(attr, value);
}

/** Keep the document title and share tags in sync with the active sheet. */
export function syncDocumentMeta(query = "", color = "") {
  const label = sheetLabel(query, color);
  const title = label ? `${label} — Discovery` : BASE_TITLE;
  const description = label
    ? `Explore “${label}” in Discovery — an infinite darkroom of photographs that develop live.`
    : BASE_DESCRIPTION;

  document.title = title;
  setMeta('meta[name="description"]', "content", description);
  setMeta('meta[property="og:title"]', "content", title);
  setMeta('meta[property="og:description"]', "content", description);
  setMeta('meta[name="twitter:title"]', "content", title);
  setMeta('meta[name="twitter:description"]', "content", description);

  const url = `${window.location.origin}${window.location.pathname}${window.location.search}`;
  setMeta('meta[property="og:url"]', "content", url);
  setMeta('link[rel="canonical"]', "href", `${window.location.origin}${window.location.pathname}`);
}

// The current subject lives in the URL so any sheet can be shared.
export function readUrl() {
  const params = new URLSearchParams(window.location.search);
  return { query: params.get("q") || "", color: params.get("tone") || "" };
}

export function writeUrl(query, color) {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (color) params.set("tone", color);
  const qs = params.toString();
  window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
}

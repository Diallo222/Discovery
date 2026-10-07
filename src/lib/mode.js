import { useStore } from "./store";
import { shutter } from "./shutter";

export function switchMode(next) {
  const s = useStore.getState();
  if (s.mode === next || s.selected || !s.loaded) return;
  shutter(next === "field" ? "The Field" : "The Index", () => {
    useStore.getState().setMode(next);
    window.scrollTo(0, 0);
  });
}

// Jump to the visitor's kept prints, wherever they are.
export function openRoll() {
  const s = useStore.getState();
  s.setIndexTab("kept");
  if (s.mode === "index") window.scrollTo(0, 0);
  else switchMode("index");
}

export const pad = (n, size = 3) => String(n).padStart(size, "0");

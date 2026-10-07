// Mutable state shared between the WebGL field and the DOM layer.
// Lives outside React so per-frame reads/writes never trigger renders.

export const FOV = 40;

export const field = {
  offset: { x: 0, y: 0 },
  target: { x: 0, y: 0 },
  velocity: { x: 0, y: 0 },
  pointer: { x: -9999, y: -9999, inside: false },
  dragging: false,
  travelled: 0,
  locked: false, // an overlay owns input
  rects: [], // per tile screen rects, refreshed every frame
  hiddenTile: -1,
  dim: 0, // 0 → 1 while the detail view is open
};

export function pickTile(x, y) {
  const rects = field.rects;
  for (let i = rects.length - 1; i >= 0; i--) {
    const r = rects[i];
    if (Math.abs(x - r.cx) <= r.w / 2 && Math.abs(y - r.cy) <= r.h / 2) return i;
  }
  return -1;
}

export const toDomRect = (r) => ({
  left: r.cx - r.w / 2,
  top: r.cy - r.h / 2,
  width: r.w,
  height: r.h,
});

// The visible tile showing `photoIndex` closest to the centre of the screen.
export function findTileForPhoto(photoIndex) {
  const cx = window.innerWidth / 2;
  const cy = window.innerHeight / 2;
  let best = -1;
  let bestDist = Infinity;
  field.rects.forEach((r, i) => {
    if (r.photoIndex !== photoIndex) return;
    const inView =
      r.cx + r.w / 2 > 0 && r.cx - r.w / 2 < window.innerWidth &&
      r.cy + r.h / 2 > 0 && r.cy - r.h / 2 < window.innerHeight;
    if (!inView) return;
    const d = Math.hypot(r.cx - cx, r.cy - cy);
    if (d < bestDist) {
      bestDist = d;
      best = i;
    }
  });
  return best;
}

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

function mulberry32(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const tileWidth = (vw) => Math.round(clamp(vw * 0.165, 148, 320));

// A masonry block that tiles infinitely: columns repeat horizontally with
// period W, and each column wraps vertically on its own period, so columns
// of different heights never leave a seam.
export function buildLayout(photos, vw, vh) {
  const n = photos.length;
  const colW = tileWidth(vw);
  const gap = Math.round(colW * 0.15);
  const step = colW + gap;
  // The lens bowl and the camera's lift both reveal more than the viewport,
  // so the block must outgrow it.
  const cols = Math.max(5, Math.ceil((vw * 1.75 + step) / step));
  const W = cols * step;
  const minH = vh * 1.75 + colW * 1.7;
  const rand = mulberry32(photos[0].id + n);

  const tiles = [];
  let p = 0;
  for (let c = 0; c < cols; c++) {
    const column = [];
    let y = 0;
    while (y < minH) {
      const photoIndex = p % n;
      const photo = photos[photoIndex];
      const ratio = clamp(photo.width / photo.height, 0.64, 1.55);
      const h = Math.round(colW / ratio);
      column.push({ photoIndex, w: colW, h, top: y });
      y += h + gap;
      p++;
    }
    const shift = rand() * y;
    for (const t of column) {
      tiles.push({
        ...t,
        x: c * step - W / 2 + colW / 2,
        y: -(t.top + t.h / 2) + shift,
        period: y,
        seed: rand(),
      });
    }
  }
  return { tiles, W, colW };
}

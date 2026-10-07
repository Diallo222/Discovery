import { photoSrc } from "./pexels";

// A 35mm contact sheet, drawn the way a darkroom would print one: strips of
// six frames on black film, sprocket holes, orange edge numbers, portrait
// frames lying on their side — and grease pencil around the keepers.

const EXPOSURES = 36;
const PER_STRIP = 6;
const FRAME_W = 300;
const FRAME_H = 200;
const FRAME_GAP = 14;
const REBATE = 30;
const STRIP_GAP = 26;
const MARGIN = 80;
const HEADER = 175;
const SCALE = 2;

const PAPER = "#ebe6db";
const FILM = "#15120f";
const EDGE = "#f08a24";
const PENCIL = "#d2261a";
const INK = "#1a1714";

const loadImage = (src) =>
  new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    const timer = setTimeout(() => resolve(null), 15000);
    img.onload = () => {
      clearTimeout(timer);
      resolve(img);
    };
    img.onerror = () => {
      clearTimeout(timer);
      resolve(null);
    };
    img.src = src;
  });

// Cover-fit `img` into a w×h box centred on the current origin.
function drawCover(ctx, img, w, h) {
  const s = Math.max(w / img.width, h / img.height);
  const dw = img.width * s;
  const dh = img.height * s;
  ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}

// Two loose, slightly mismatched passes — a hand, not a compass.
function greasePencil(ctx, cx, cy, rx, ry, seed) {
  ctx.save();
  ctx.strokeStyle = PENCIL;
  ctx.lineCap = "round";
  ctx.globalAlpha = 0.88;
  for (let pass = 0; pass < 2; pass++) {
    ctx.lineWidth = pass ? 3 : 5;
    ctx.beginPath();
    const start = seed * 6.28 + pass * 0.4;
    const sweep = Math.PI * 2.15;
    for (let i = 0; i <= 64; i++) {
      const t = start + (i / 64) * sweep;
      const wobble = 1 + Math.sin(t * 3 + seed * 11 + pass) * 0.035;
      const x = cx + Math.cos(t) * rx * wobble;
      const y = cy + Math.sin(t) * ry * wobble + pass * 2;
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.stroke();
  }
  ctx.restore();
}

function wrapText(ctx, text, maxWidth) {
  const lines = [];
  let line = "";
  for (const word of text.split(" ")) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

export async function exportContactSheet({ photos, title, keptIds }) {
  const frames = photos.slice(0, EXPOSURES);
  const images = await Promise.all(frames.map((p) => loadImage(photoSrc(p, 640))));
  await document.fonts.ready;

  const strips = Math.ceil(frames.length / PER_STRIP);
  const stripW = PER_STRIP * FRAME_W + (PER_STRIP + 1) * FRAME_GAP;
  const stripH = FRAME_H + REBATE * 2;
  const credits = [...new Set(frames.map((p) => p.photographer))].join(", ");

  const W = stripW + MARGIN * 2;
  const measure = document.createElement("canvas").getContext("2d");
  measure.font = "13px 'Geist Mono', monospace";
  const creditLines = wrapText(measure, `Photographs courtesy of Pexels — ${credits}`, stripW);
  const H = HEADER + strips * (stripH + STRIP_GAP) + MARGIN + creditLines.length * 20 + 20;

  const canvas = document.createElement("canvas");
  canvas.width = W * SCALE;
  canvas.height = H * SCALE;
  const ctx = canvas.getContext("2d");
  ctx.scale(SCALE, SCALE);

  // Paper, with the faint fall-off of an enlarger's light.
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W / 2, H / 2, W * 0.2, W / 2, H / 2, W * 0.8);
  glow.addColorStop(0, "rgba(255,255,255,0.25)");
  glow.addColorStop(1, "rgba(120,100,80,0.12)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // Header.
  ctx.fillStyle = INK;
  ctx.textBaseline = "alphabetic";
  ctx.font = "italic 64px 'Instrument Serif', Georgia, serif";
  ctx.fillText(title, MARGIN, MARGIN + 44);
  ctx.font = "13px 'Geist Mono', monospace";
  ctx.textAlign = "right";
  const date = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  ctx.fillText("DISCOVERY® — CONTACT SHEET", W - MARGIN, MARGIN + 10);
  ctx.fillText(`${date.toUpperCase()} · ${String(frames.length).padStart(2, "0")} EXPOSURES · ISO 400`, W - MARGIN, MARGIN + 30);
  ctx.textAlign = "left";

  const marks = [];
  for (let s = 0; s < strips; s++) {
    const x0 = MARGIN;
    const y0 = HEADER + s * (stripH + STRIP_GAP);
    ctx.fillStyle = FILM;
    roundRect(ctx, x0, y0, stripW, stripH, 3);

    // Sprocket holes show the paper through the film.
    ctx.fillStyle = PAPER;
    for (let hx = x0 + 10; hx < x0 + stripW - 14; hx += 26) {
      roundRect(ctx, hx, y0 + 4, 13, 8, 2);
      roundRect(ctx, hx, y0 + stripH - 12, 13, 8, 2);
    }

    for (let f = 0; f < PER_STRIP; f++) {
      const i = s * PER_STRIP + f;
      if (i >= frames.length) break;
      const fx = x0 + FRAME_GAP + f * (FRAME_W + FRAME_GAP);
      const fy = y0 + REBATE;
      const img = images[i];

      ctx.save();
      ctx.beginPath();
      ctx.rect(fx, fy, FRAME_W, FRAME_H);
      ctx.clip();
      ctx.fillStyle = frames[i].color;
      ctx.fillRect(fx, fy, FRAME_W, FRAME_H);
      if (img) {
        ctx.translate(fx + FRAME_W / 2, fy + FRAME_H / 2);
        // Portraits were shot with the camera on its side.
        if (img.height > img.width) {
          ctx.rotate(-Math.PI / 2);
          drawCover(ctx, img, FRAME_H, FRAME_W);
        } else drawCover(ctx, img, FRAME_W, FRAME_H);
      }
      ctx.restore();

      // Edge print.
      const n = i + 1;
      ctx.fillStyle = EDGE;
      ctx.font = "11px 'Geist Mono', monospace";
      ctx.fillText(`▸ ${n}`, fx + 4, y0 + REBATE - 5);
      ctx.fillText(`${n}A`, fx + FRAME_W / 2 + 4, y0 + REBATE - 5);
      if (f % 2 === 0) ctx.fillText("DISCOVERY 400 SAFETY FILM", fx + 30, y0 + stripH - 16);

      if (keptIds.has(frames[i].id)) {
        marks.push([fx + FRAME_W / 2, fy + FRAME_H / 2, (i * 0.618) % 1]);
      }
    }
  }

  for (const [cx, cy, seed] of marks) greasePencil(ctx, cx, cy, FRAME_W * 0.56, FRAME_H * 0.62, seed);

  ctx.fillStyle = "rgba(26,23,20,0.62)";
  ctx.font = "13px 'Geist Mono', monospace";
  const footY = HEADER + strips * (stripH + STRIP_GAP) + 30;
  creditLines.forEach((line, i) => ctx.fillText(line, MARGIN, footY + i * 20));

  // A 4K print: JPEG keeps it a few MB instead of a PNG's twenty.
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `discovery-contact-sheet-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}.jpg`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  return frames.length;
}

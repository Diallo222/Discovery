import { useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useStore } from "../lib/store";
import { FOV, field, pickTile, toDomRect } from "../lib/field";
import { setRenderer } from "./textures";
import Tiles from "./Tiles";

const isTyping = (el) => el?.closest?.("input, textarea, [contenteditable], [role=slider]");

function useFieldInput(ref) {
  useEffect(() => {
    const el = ref.current;
    let down = null;
    const active = () => {
      const s = useStore.getState();
      return !field.locked && s.mode === "field" && s.loaded;
    };

    const open = (x, y) => {
      const i = pickTile(x, y);
      const s = useStore.getState();
      if (i < 0 || field.shownPhotos !== s.photos) return;
      const r = field.rects[i];
      s.openDetail({
        photoIndex: r.photoIndex,
        origin: "field",
        tileIndex: i,
        rect: toDomRect(r),
        lowSrc: field.tileSrc(r.photoIndex),
      });
    };

    const onDown = (e) => {
      if (!active() || e.button > 0) return;
      down = {
        lastX: e.clientX,
        lastY: e.clientY,
        moved: 0,
        vx: 0,
        vy: 0,
        t: performance.now(),
        gain: e.pointerType === "touch" ? 1.7 : 1.2,
      };
      el.setPointerCapture(e.pointerId);
    };

    const onMove = (e) => {
      field.pointer.x = e.clientX;
      field.pointer.y = e.clientY;
      field.pointer.inside = true;
      if (!down) return;
      const dx = e.clientX - down.lastX;
      const dy = e.clientY - down.lastY;
      field.target.x += dx * down.gain;
      field.target.y -= dy * down.gain;
      down.moved += Math.abs(dx) + Math.abs(dy);
      if (down.moved > 6) field.dragging = true;
      field.travelled += Math.hypot(dx, dy);
      const now = performance.now();
      const ms = Math.max(now - down.t, 1);
      down.vx = down.vx * 0.5 + (dx / ms) * 0.5;
      down.vy = down.vy * 0.5 + (dy / ms) * 0.5;
      down.lastX = e.clientX;
      down.lastY = e.clientY;
      down.t = now;
    };

    const onUp = (e) => {
      if (!down) return;
      if (field.dragging) {
        // Fling, unless the hand had already come to rest.
        if (performance.now() - down.t < 80) {
          field.target.x += down.vx * 240 * down.gain;
          field.target.y -= down.vy * 240 * down.gain;
        }
      } else if (e.type === "pointerup") {
        open(e.clientX, e.clientY);
      }
      down = null;
      field.dragging = false;
    };

    const onLeave = () => {
      field.pointer.inside = false;
    };

    const onWheel = (e) => {
      if (!active()) return;
      e.preventDefault();
      const k = e.deltaMode === 1 ? 32 : 1;
      const dx = (e.shiftKey ? e.deltaY : e.deltaX) * k;
      const dy = (e.shiftKey ? 0 : e.deltaY) * k;
      field.target.x -= dx;
      field.target.y += dy;
      field.travelled += Math.hypot(dx, dy);
    };

    const onKey = (e) => {
      if (!active() || isTyping(e.target)) return;
      const step = 260;
      const moves = {
        ArrowUp: [0, -step],
        ArrowDown: [0, step],
        ArrowLeft: [step, 0],
        ArrowRight: [-step, 0],
      };
      const m = moves[e.key];
      if (!m) return;
      e.preventDefault();
      field.target.x += m[0];
      field.target.y += m[1];
      field.travelled += step;
    };

    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    el.addEventListener("pointerleave", onLeave);
    el.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKey);
    return () => {
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
      el.removeEventListener("pointerleave", onLeave);
      el.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
    };
  }, [ref]);
}

const MAX_DPR = 1.75;

// Steps the render resolution down on GPUs that can't hold the frame rate.
function AdaptiveDpr() {
  const setDpr = useThree((s) => s.setDpr);
  const meter = useRef({ time: 0, frames: 0, dpr: Math.min(window.devicePixelRatio, MAX_DPR) });
  useFrame((_, delta) => {
    const m = meter.current;
    // Skip the preloader's texture uploads and frames after a hidden tab.
    if (!useStore.getState().loaded || delta > 0.25) {
      m.time = 0;
      m.frames = 0;
      return;
    }
    m.time += delta;
    m.frames++;
    if (m.time < 2) return;
    const fps = m.frames / m.time;
    m.time = 0;
    m.frames = 0;
    if (fps < 45 && m.dpr > 1) {
      m.dpr = Math.max(1, m.dpr - 0.25);
      setDpr(m.dpr);
    }
  });
  return null;
}

export default function Field() {
  const mode = useStore((s) => s.mode);
  const ref = useRef(null);
  useFieldInput(ref);

  return (
    <div
      ref={ref}
      className="field"
      data-hidden={mode !== "field" || undefined}
      role="application"
      aria-label="Photo field. Drag, scroll or use the arrow keys to wander; click a photograph to open it."
    >
      <Canvas
        flat
        dpr={[1, MAX_DPR]}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        frameloop={mode === "field" ? "always" : "never"}
        camera={{ fov: FOV, near: 1, far: 10000, position: [0, 0, 1000] }}
        onCreated={({ gl }) => setRenderer(gl)}
      >
        <Tiles />
        <AdaptiveDpr />
      </Canvas>
    </div>
  );
}

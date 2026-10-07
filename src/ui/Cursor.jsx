import { useEffect, useRef } from "react";
import { useStore } from "../lib/store";
import { field } from "../lib/field";
import { gsap, finePointer, reducedMotion } from "../lib/gsap";
import { pad } from "../lib/mode";

export default function Cursor() {
  return finePointer ? <CursorInner /> : null;
}

function CursorInner() {
  const dot = useRef(null);
  const ring = useRef(null);
  const shape = useRef(null);
  const label = useRef(null);
  const caption = useRef(null);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("has-cursor");
    const ease = reducedMotion ? 0.01 : 1;
    const dx = gsap.quickTo(dot.current, "x", { duration: 0.12 * ease, ease: "power3" });
    const dy = gsap.quickTo(dot.current, "y", { duration: 0.12 * ease, ease: "power3" });
    const rx = gsap.quickTo(ring.current, "x", { duration: 0.55 * ease, ease: "power3" });
    const ry = gsap.quickTo(ring.current, "y", { duration: 0.55 * ease, ease: "power3" });

    let target = null;
    let magnet = null;
    let state = "";
    let raf;

    const release = (el) => gsap.to(el, { x: 0, y: 0, duration: 0.9, ease: "elastic.out(1, 0.4)" });

    const onMove = (e) => {
      dx(e.clientX);
      dy(e.clientY);
      rx(e.clientX);
      ry(e.clientY);
      target = e.target;
      root.dataset.cursorVisible = "";

      const m = e.target.closest?.("[data-magnetic]");
      if (m !== magnet) {
        if (magnet) release(magnet);
        magnet = m;
      }
      if (magnet && !reducedMotion) {
        const r = magnet.getBoundingClientRect();
        gsap.to(magnet, {
          x: (e.clientX - (r.left + r.width / 2)) * 0.3,
          y: (e.clientY - (r.top + r.height / 2)) * 0.35,
          duration: 0.4,
          ease: "power3",
        });
      }
    };
    const onLeave = () => delete root.dataset.cursorVisible;

    const tick = () => {
      const s = useStore.getState();
      let next = "default";
      let text = "";
      let credit = "";
      const el = target?.closest?.("[data-cursor], a, button, input, textarea");
      if (el?.matches("input, textarea") || el?.dataset.cursor === "none") next = "hidden";
      else if (el?.dataset.cursor) [next, text] = ["label", el.dataset.cursor];
      else if (el) next = "link";
      else if (s.mode === "field" && s.loaded && !field.locked && target?.closest?.(".field")) {
        if (field.dragging) next = "grab";
        else if (s.hovered >= 0) {
          [next, text] = ["label", "View"];
          const photo = field.shownPhotos?.[s.hovered];
          if (photo) credit = `N° ${pad(s.hovered + 1)} — ${photo.photographer}`;
        } else [next, text] = ["drag", "Drag"];
      }
      if (next + text + credit !== state) {
        state = next + text + credit;
        shape.current.dataset.state = next;
        dot.current.dataset.state = next;
        label.current.textContent = text;
        if (credit) {
          caption.current.textContent = credit;
          caption.current.dataset.visible = "";
        } else delete caption.current.dataset.visible;
      }
      raf = requestAnimationFrame(tick);
    };
    tick();

    window.addEventListener("pointermove", onMove);
    document.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      root.classList.remove("has-cursor");
    };
  }, []);

  return (
    <div className="cursor" aria-hidden="true">
      <div className="cursor-ring" ref={ring}>
        <div className="cursor-shape" ref={shape}>
          <span ref={label} />
        </div>
        <p className="cursor-caption mono" ref={caption} />
      </div>
      <div className="cursor-dot" ref={dot} />
    </div>
  );
}

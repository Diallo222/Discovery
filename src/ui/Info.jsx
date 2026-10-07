import { useEffect, useRef } from "react";
import { useStore } from "../lib/store";
import { gsap, reducedMotion } from "../lib/gsap";

const CONTROLS = [
  ["Drag · Scroll · Arrows", "Wander the field"],
  ["Click a frame", "Develop it"],
  ["/", "Search the archive"],
  ["← →", "Browse prints"],
  ["K", "Keep a print on your roll"],
  ["[ ]", "Exposure, in thirds of a stop"],
  ["Esc", "Close"],
];

export default function Info() {
  const open = useStore((s) => s.infoOpen);
  const root = useRef(null);

  useEffect(() => {
    const el = root.current;
    const q = gsap.utils.selector(el);
    const speed = reducedMotion ? 0.4 : 1;
    if (open) {
      const tl = gsap
        .timeline()
        .set(el, { visibility: "visible" })
        .fromTo(q(".info-scrim"), { opacity: 0 }, { opacity: 1, duration: 0.6 * speed })
        .fromTo(q(".info-panel"), { xPercent: 100 }, { xPercent: 0, duration: 1 * speed, ease: "expo.inOut" }, 0)
        .fromTo(q(".info-rise"), { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9 * speed, ease: "expo.out", stagger: 0.05 }, 0.45 * speed);
      const onKey = (e) => e.key === "Escape" && useStore.getState().setInfoOpen(false);
      window.addEventListener("keydown", onKey);
      return () => {
        tl.kill();
        window.removeEventListener("keydown", onKey);
      };
    }
    if (el.style.visibility !== "visible") return;
    const tl = gsap
      .timeline()
      .to(q(".info-panel"), { xPercent: 100, duration: 0.8 * speed, ease: "expo.inOut" })
      .to(q(".info-scrim"), { opacity: 0, duration: 0.5 * speed }, 0.2 * speed)
      .set(el, { visibility: "hidden" });
    return () => tl.kill();
  }, [open]);

  const close = () => useStore.getState().setInfoOpen(false);

  return (
    <div className="info" ref={root} aria-hidden={!open} inert={!open || undefined}>
      <div className="info-scrim" onClick={close} />
      <aside className="info-panel" role="dialog" aria-modal="true" aria-label="About Discovery">
        <div className="info-head mono info-rise">
          <span>( Colophon )</span>
          <button className="hud-link" onClick={close}>
            Close <kbd>Esc</kbd>
          </button>
        </div>
        <h2 className="info-title info-rise">
          A darkroom <em>without walls.</em>
        </h2>
        <p className="info-copy info-rise">
          Discovery turns millions of free photographs into one endless contact sheet. Every print you
          meet is developed live on your screen — blank paper, a safelight negative, then the image —
          and every search sends the whole sheet back into the tray.
        </p>
        <dl className="info-controls mono">
          {CONTROLS.map(([k, v]) => (
            <div className="info-rise" key={k}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
        <p className="info-credit mono info-rise">
          Photographs from{" "}
          <a href="https://www.pexels.com" target="_blank" rel="noreferrer">
            Pexels
          </a>{" "}
          and its contributors. Set in Instrument Serif, Geist & Geist Mono. Built with React Three
          Fiber, GSAP & Lenis.
        </p>
      </aside>
    </div>
  );
}

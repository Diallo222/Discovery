import { useEffect, useRef, useState } from "react";
import { useStore, queryLabel } from "../lib/store";
import { gsap, reducedMotion } from "../lib/gsap";
import { photoSrc } from "../lib/pexels";
import { readUrl } from "../lib/url";
import { sound } from "../lib/sound";

const MIN_TIME = reducedMotion ? 600 : 2600;
const BURST = 14;

export default function Preloader() {
  const [gone, setGone] = useState(false);
  return gone ? null : <PreloaderInner onDone={() => setGone(true)} />;
}

function PreloaderInner({ onDone }) {
  const photos = useStore((s) => s.photos);
  const status = useStore((s) => s.status);
  const error = useStore((s) => s.error);
  const root = useRef(null);
  const count = useRef(null);
  const bar = useRef(null);
  const [frame, setFrame] = useState(0);
  // The store only commits a subject once it has results; the URL knows it now.
  const [requested] = useState(readUrl);
  const burst = photos.slice(0, BURST);

  // Burst mode: the viewfinder flicks through the first frames.
  useEffect(() => {
    if (!burst.length || reducedMotion) return;
    const id = setInterval(() => setFrame((f) => f + 1), 130);
    return () => clearInterval(id);
  }, [burst.length]);

  useEffect(() => {
    const start = performance.now();
    let shown = 0;
    let raf;
    let exiting = false;

    const exit = () => {
      exiting = true;
      const q = gsap.utils.selector(root);
      gsap
        .timeline({ onComplete: onDone })
        .add(() => sound.play("shutter"))
        .set(q(".pl-flash"), { opacity: 1 })
        .to(q(".pl-flash"), { opacity: 0, duration: 0.6, ease: "power2.out" })
        .to(q(".pl-rise"), { yPercent: -115, duration: 0.8, ease: "expo.in", stagger: 0.025 }, 0.05)
        .to(q(".pl-viewfinder"), { scale: 0.86, opacity: 0, duration: 0.7, ease: "expo.in" }, 0.25)
        .to(q(".pl-bar"), { scaleY: 0, duration: 0.4 }, 0.3)
        .add(() => useStore.getState().setLoaded(), 0.85)
        .to(q(".pl-blade--top"), { yPercent: -101, duration: 1.3, ease: "shutter" }, 0.8)
        .to(q(".pl-blade--bottom"), { yPercent: 101, duration: 1.3, ease: "shutter" }, 0.8);
    };

    let last = start;
    const tick = (now = performance.now()) => {
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      const s = useStore.getState();
      const target = s.fieldReady ? 1 : (s.photos.length ? 0.1 : 0) + s.loadProgress * 0.88;
      // Ease towards the real progress, never faster than a believable count.
      shown = Math.min(target, shown + Math.max((target - shown) * dt * 4, dt * 0.12));
      const v = Math.floor(shown * 100);
      if (count.current) count.current.textContent = String(v).padStart(3, "0");
      if (bar.current) bar.current.style.transform = `scaleX(${shown})`;
      if (!exiting && v === 100 && now - start > MIN_TIME) exit();
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [onDone]);

  return (
    <div className="preloader" ref={root} role="status" aria-live="polite">
      <div className="pl-blade pl-blade--top" />
      <div className="pl-blade pl-blade--bottom" />

      <div className="pl-top">
        <span className="mask">
          <span className="pl-rise pl-brand">
            Discovery<sup>®</sup>
          </span>
        </span>
        <span className="mask">
          <span className="pl-rise mono">( Vol. 02 — An infinite darkroom )</span>
        </span>
      </div>

      <div className="pl-viewfinder">
        <span className="vf-corner vf-corner--tl" />
        <span className="vf-corner vf-corner--tr" />
        <span className="vf-corner vf-corner--bl" />
        <span className="vf-corner vf-corner--br" />
        <div className="pl-frames">
          {burst.map((p, i) => (
            <img
              key={p.id}
              src={photoSrc(p, 420)}
              alt=""
              data-active={i === frame % burst.length || undefined}
            />
          ))}
        </div>
        <span className="pl-flash" />
        <span className="pl-rec mono">
          <i /> REC
        </span>
        <span className="pl-exif mono">ƒ/2.8 · 1/125</span>
      </div>

      <div className="pl-bottom">
        <div className="pl-count">
          <span className="mask">
            <span className="pl-rise" ref={count}>
              000
            </span>
          </span>
          <span className="mask">
            <span className="pl-rise pl-pct mono">%</span>
          </span>
        </div>
        <div className="pl-meta mono">
          {status === "error" ? (
            <>
              <span className="pl-error">{error}</span>
              <button className="btn" onClick={() => useStore.getState().search(requested.query, requested.color)}>
                Try again
              </button>
            </>
          ) : (
            <>
              <span className="mask">
                <span className="pl-rise">Developing — {queryLabel(requested.query, requested.color)}</span>
              </span>
              <span className="mask">
                <span className="pl-rise">ISO 400 · 35mm · Fine grain</span>
              </span>
            </>
          )}
        </div>
      </div>
      <span className="pl-bar" ref={bar} />
    </div>
  );
}

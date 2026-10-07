import { useEffect, useRef, useState } from "react";
import { useStore } from "../lib/store";
import { gsap } from "../lib/gsap";
import { sound } from "../lib/sound";

const MIN = -2;
const MAX = 2;
const PX_PER_STOP = 54;
const STEP = 1 / 3; // cameras click in thirds of a stop

const clamp = (v) => Math.min(MAX, Math.max(MIN, v));
const snap = (v) => clamp(Math.round(v / STEP) * STEP);
const label = (v) => `${v >= 0 ? "+" : "−"}${Math.abs(v).toFixed(1)}`;
const TICKS = Array.from({ length: Math.round((MAX - MIN) / STEP) + 1 }, (_, i) => MIN + i * STEP);

// The enlarger's exposure: drag the ruler, scroll it, or use [ and ].
export default function ExposureDial() {
  const [ev, setEv] = useState(() => useStore.getState().exposure);
  const proxy = useRef({ value: ev });
  const aim = useRef(ev); // where the dial is heading, so quick key presses add up
  const detent = useRef(Math.round(ev / STEP));
  const drag = useRef(null);

  const apply = (value) => {
    const v = clamp(value);
    proxy.current.value = v;
    setEv(v);
    useStore.getState().setExposure(v);
    const d = Math.round(v / STEP);
    if (d !== detent.current) {
      detent.current = d;
      sound.play("tick");
    }
  };

  const settle = (target) => {
    aim.current = target;
    return gsap.to(proxy.current, {
      value: target,
      duration: 0.5,
      ease: "expo.out",
      overwrite: true,
      onUpdate: () => apply(proxy.current.value),
    });
  };
  const nudge = (dir) => settle(snap(aim.current + dir * STEP));

  // The index prints follow the same exposure.
  useEffect(() => {
    document.documentElement.style.setProperty("--ev", String(2 ** ev));
  }, [ev]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.target.closest?.("input, textarea") || useStore.getState().selected) return;
      if (e.key === "[") nudge(-1);
      if (e.key === "]") nudge(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div
      className="ev"
      role="slider"
      tabIndex={0}
      aria-label="Exposure"
      aria-valuemin={MIN}
      aria-valuemax={MAX}
      aria-valuenow={Number(ev.toFixed(2))}
      aria-valuetext={`${label(ev)} EV`}
      data-cursor="Expose"
      onPointerDown={(e) => {
        drag.current = { x: e.clientX, start: proxy.current.value };
        e.currentTarget.setPointerCapture(e.pointerId);
        gsap.killTweensOf(proxy.current);
      }}
      onPointerMove={(e) => {
        if (!drag.current) return;
        apply(drag.current.start - (e.clientX - drag.current.x) / PX_PER_STOP);
        aim.current = proxy.current.value;
      }}
      onPointerUp={() => {
        drag.current = null;
        settle(snap(proxy.current.value));
      }}
      onWheel={(e) => {
        gsap.killTweensOf(proxy.current);
        apply(proxy.current.value - e.deltaY * 0.003);
        aim.current = proxy.current.value;
      }}
      onDoubleClick={() => settle(0)}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft" || e.key === "ArrowDown") nudge(-1);
        else if (e.key === "ArrowRight" || e.key === "ArrowUp") nudge(1);
        else return;
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <span className="ev-label mono">EV</span>
      <span className="ev-window">
        <span className="ev-ruler" style={{ transform: `translateX(${-ev * PX_PER_STOP}px)` }}>
          {TICKS.map((t) => {
            const major = Math.abs(t - Math.round(t)) < 0.01;
            return (
              <i key={t.toFixed(2)} data-major={major || undefined} style={{ left: `calc(50% + ${t * PX_PER_STOP}px)` }}>
                {major && <b className="mono">{Math.round(t) > 0 ? `+${Math.round(t)}` : Math.round(t)}</b>}
              </i>
            );
          })}
        </span>
        <span className="ev-needle" />
      </span>
      <span className="ev-value mono">{label(ev)}</span>
    </div>
  );
}

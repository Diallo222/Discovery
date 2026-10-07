import { useLayoutEffect, useRef, useState } from "react";
import { useStore } from "../lib/store";
import { field } from "../lib/field";
import { gsap } from "../lib/gsap";
import { splitChars } from "../lib/split";

const DISMISS_AFTER = 340; // px wandered

export default function Intro() {
  const loaded = useStore((s) => s.loaded);
  const mode = useStore((s) => s.mode);
  const root = useRef(null);
  const [gone, setGone] = useState(false);

  useLayoutEffect(() => {
    if (!loaded) return;
    let raf;
    let split;
    let cancelled = false;
    const ctx = gsap.context(() => {}, root);
    document.fonts.ready.then(() => {
      if (cancelled || !root.current) return;
      ctx.add(() => {
        split = splitChars(root.current.querySelectorAll(".intro-title .line"));
        gsap.from(split.chars, {
          yPercent: 130,
          rotate: 8,
          duration: 1.5,
          ease: "expo.out",
          stagger: 0.035,
          delay: 1.1,
        });
        gsap.from(".intro-fade", { opacity: 0, y: 14, duration: 1.2, delay: 1.9, stagger: 0.12 });
      });

      // Leaves once the visitor wanders off — or asks for another subject.
      const startGeneration = useStore.getState().generation;
      const watch = () => {
        const searched = useStore.getState().generation !== startGeneration;
        if (field.travelled < DISMISS_AFTER && !searched) {
          raf = requestAnimationFrame(watch);
          return;
        }
        ctx.add(() => {
          gsap
            .timeline({ onComplete: () => setGone(true) })
            .to(split.chars, { yPercent: -130, rotate: -6, duration: 0.9, ease: "expo.in", stagger: 0.018 })
            .to(".intro-fade", { opacity: 0, y: -10, duration: 0.5 }, 0);
        });
      };
      raf = requestAnimationFrame(watch);
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      ctx.revert();
    };
  }, [loaded]);

  if (gone) return null;
  return (
    <div className="intro" ref={root} data-hidden={!loaded || mode !== "field" || undefined}>
      <p className="intro-kicker intro-fade mono">( N° 001 — An infinite darkroom )</p>
      <h1 className="intro-title">
        <span className="line">Discover</span>
        <span className="line">
          <em>the world’s</em> light
        </span>
      </h1>
      <p className="intro-hint intro-fade mono">Drag · Scroll · Flick — click any frame to develop it</p>
    </div>
  );
}

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useStore, queryLabel } from "../lib/store";
import { gsap, reducedMotion } from "../lib/gsap";
import { splitChars } from "../lib/split";
import { pad } from "../lib/mode";

// Each new subject is announced over the field while its prints develop.
export default function DevelopCard() {
  const generation = useStore((s) => s.generation);
  const root = useRef(null);
  const firstGeneration = useRef(null);
  const [card, setCard] = useState(null);

  useEffect(() => {
    if (!generation) return;
    if (firstGeneration.current === null) {
      firstGeneration.current = generation; // the preloader already announced it
      return;
    }
    const s = useStore.getState();
    if (s.mode !== "field") return;
    setCard({
      key: generation,
      label: queryLabel(s.query, s.color),
      count: s.photos.length,
      total: s.total,
    });
  }, [generation]);

  useLayoutEffect(() => {
    if (!card) return;
    const ctx = gsap.context(() => {
      const split = splitChars(root.current.querySelector(".develop-title"));
      const speed = reducedMotion ? 0.4 : 1;
      gsap
        .timeline({ onComplete: () => setCard(null) })
        .from(split.chars, { yPercent: 130, rotate: 6, duration: 1.3 * speed, ease: "expo.out", stagger: 0.035 }, 0.25)
        .from(".develop-meta", { opacity: 0, y: 10, duration: 0.8 * speed, stagger: 0.08 }, 0.5)
        .to(split.chars, { yPercent: -130, rotate: -4, duration: 0.8 * speed, ease: "expo.in", stagger: 0.02 }, 2.6 * speed)
        .to(".develop-meta", { opacity: 0, duration: 0.4 }, 2.6 * speed);
    }, root);
    return () => ctx.revert();
  }, [card]);

  if (!card) return null;
  return (
    <div className="develop-card" ref={root} key={card.key} aria-live="polite">
      <p className="mono develop-meta">( Now developing )</p>
      <h2 className="develop-title">{card.label}</h2>
      <p className="mono develop-meta">
        {pad(card.count)} of {card.total ? card.total.toLocaleString("en") : "∞"} frames
      </p>
    </div>
  );
}

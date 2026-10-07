import { useEffect, useMemo, useRef, useState } from "react";
import { useStore, getRecent } from "../lib/store";
import { gsap, reducedMotion } from "../lib/gsap";
import { pad } from "../lib/mode";

const SUGGESTIONS = [
  "Tokyo at night",
  "Brutalist architecture",
  "Desert dunes",
  "Fog",
  "Film portraits",
  "Northern lights",
  "Still life",
  "Ocean texture",
];

const SURPRISES = [
  "Lighthouse", "Laundromat", "Neon signs", "Greenhouse", "Swimming pool", "Old cinema",
  "Salt flats", "Night market", "Glacier", "Staircase", "Diner", "Rainy window",
  "Sunflowers", "Skate park", "Library", "Volcano", "Ferris wheel", "Jellyfish",
  "Moth", "Train station", "Ballet", "Cactus", "Rooftops", "Snow forest",
];

// Pexels' named tones, painted as the swatch a darkroom would see them.
const TONES = [
  ["red", "#d0382a"], ["orange", "#e5812b"], ["yellow", "#e8c33a"], ["green", "#4d8a3c"],
  ["turquoise", "#2bb2a4"], ["blue", "#2e5ccc"], ["violet", "#7a4bc2"], ["pink", "#e26aa4"],
  ["brown", "#7b5334"], ["black", "#141414"], ["gray", "#8b8b8b"], ["white", "#f1efe9"],
];

export default function SearchOverlay() {
  const open = useStore((s) => s.searchOpen);
  const root = useRef(null);
  const input = useRef(null);
  const [value, setValue] = useState("");
  // Read on open so the rows exist before the reveal timeline selects them.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const recent = useMemo(() => getRecent(), [open]);

  useEffect(() => {
    const el = root.current;
    const q = gsap.utils.selector(el);
    const speed = reducedMotion ? 0.4 : 1;
    if (open) {
      const tl = gsap
        .timeline({ defaults: { ease: "expo.out" } })
        .set(el, { visibility: "visible" })
        .fromTo(el, { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1 * speed, ease: "expo.inOut" })
        .fromTo(q(".search-rise"), { yPercent: 110 }, { yPercent: 0, duration: 1.1 * speed, stagger: 0.04 }, 0.45 * speed)
        .fromTo(q(".search-line"), { scaleX: 0 }, { scaleX: 1, duration: 1.2 * speed }, 0.5 * speed)
        .add(() => input.current?.focus({ preventScroll: true }), 0.6 * speed);
      return () => tl.kill();
    }
    if (el.style.visibility !== "visible") return;
    const tl = gsap
      .timeline()
      .to(q(".search-rise"), { yPercent: -110, duration: 0.45 * speed, ease: "expo.in", stagger: 0.012 })
      .to(el, { clipPath: "inset(0% 0% 100% 0%)", duration: 0.8 * speed, ease: "expo.inOut" }, 0.2 * speed)
      .set(el, { visibility: "hidden" });
    return () => tl.kill();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && useStore.getState().setSearchOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const develop = (term, color = "") => {
    const s = useStore.getState();
    s.setSearchOpen(false);
    setValue("");
    window.scrollTo(0, 0);
    s.search(term, color);
  };

  const surprise = () => develop(SURPRISES[Math.floor(Math.random() * SURPRISES.length)]);

  const rows = [
    ...recent.map((term) => ({ term, kind: "Recent" })),
    ...SUGGESTIONS.filter((t) => !recent.some((r) => r.toLowerCase() === t.toLowerCase())).map((term) => ({
      term,
      kind: "Suggested",
    })),
  ].slice(0, 6);

  return (
    <div
      className="search"
      ref={root}
      role="dialog"
      aria-modal="true"
      aria-label="Search photographs"
      aria-hidden={!open}
      inert={!open || undefined}
    >
      <div className="search-top mono">
        <span className="mask">
          <span className="search-rise">( Search the archive — 3M+ photographs )</span>
        </span>
        <button className="hud-link" onClick={() => useStore.getState().setSearchOpen(false)}>
          <span className="mask">
            <span className="search-rise">
              Close <kbd>Esc</kbd>
            </span>
          </span>
        </button>
      </div>

      <form
        className="search-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (value.trim()) develop(value);
        }}
      >
        <label className="sr-only" htmlFor="search-input">
          Subject to search for
        </label>
        <span className="mask search-input-mask">
          <input
            id="search-input"
            ref={input}
            className="search-input search-rise"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Type a subject…"
            autoComplete="off"
            spellCheck="false"
            enterKeyHint="search"
          />
        </span>
        <span className="search-line" />
        <span className="search-hint mono">
          <span className="mask">
            <span className="search-rise">Press ↵ to develop</span>
          </span>
          <span className="search-buttons">
            <button type="button" className="btn" onClick={surprise}>
              Surprise me ✺
            </button>
            <button type="submit" className="btn btn-solid" disabled={!value.trim()}>
              Develop ↵
            </button>
          </span>
        </span>
      </form>

      <div className="search-tones">
        <span className="mask">
          <span className="search-rise mono">Or develop by tone{value.trim() ? ` — “${value.trim()}”` : ""}</span>
        </span>
        <div className="tones">
          {TONES.map(([name, swatch]) => (
            <span className="mask" key={name}>
              <button
                type="button"
                className="tone search-rise"
                style={{ "--swatch": swatch }}
                onClick={() => develop(value, name)}
                data-cursor={name}
                aria-label={`Develop ${value.trim() || "photographs"} in ${name} tones`}
              />
            </span>
          ))}
        </div>
      </div>

      <ul className="search-list">
        <li>
          <button className="suggest" onClick={() => develop("")} data-cursor="Develop">
            <span className="mask">
              <span className="search-rise suggest-inner">
                <span className="mono suggest-num">000</span>
                <span className="suggest-term roll" data-text="Today’s curation">
                  <span>Today’s curation</span>
                </span>
                <span className="mono suggest-kind">Daily</span>
              </span>
            </span>
          </button>
        </li>
        {rows.map(({ term, kind }, i) => (
          <li key={term}>
            <button className="suggest" onClick={() => develop(term)} data-cursor="Develop">
              <span className="mask">
                <span className="search-rise suggest-inner">
                  <span className="mono suggest-num">{pad(i + 1)}</span>
                  <span className="suggest-term roll" data-text={term}>
                    <span>{term}</span>
                  </span>
                  <span className="mono suggest-kind">{kind}</span>
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

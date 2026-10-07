import { useEffect, useRef } from "react";
import { useStore, queryLabel } from "../lib/store";
import { field } from "../lib/field";
import { switchMode, openRoll, pad } from "../lib/mode";
import ExposureDial from "./ExposureDial";
import { sound, useSoundEnabled } from "../lib/sound";

const fmt = (v) => `${v < 0 ? "−" : "+"}${pad(Math.abs(Math.round(v)), 5)}`;

export default function Hud() {
  const query = useStore((s) => s.query);
  const color = useStore((s) => s.color);
  const mode = useStore((s) => s.mode);
  const count = useStore((s) => s.photos.length);
  const status = useStore((s) => s.status);
  const loaded = useStore((s) => s.loaded);
  const soundOn = useSoundEnabled();
  const rollCount = useStore((s) => s.kept.length);
  const xRef = useRef(null);
  const yRef = useRef(null);
  const vRef = useRef(null);

  // Live coordinates of the viewfinder over the field.
  useEffect(() => {
    let raf;
    const tick = () => {
      if (xRef.current) {
        xRef.current.textContent = fmt(-field.offset.x);
        yRef.current.textContent = fmt(field.offset.y);
        const v = Math.min(Math.hypot(field.velocity.x, field.velocity.y) / 40, 1);
        vRef.current.style.transform = `scaleX(${v})`;
      }
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.target.closest?.("input, textarea")) return;
      const s = useStore.getState();
      if (e.key === "/" && !s.selected && s.loaded) {
        e.preventDefault();
        s.setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const recentre = () => {
    if (mode === "index") return switchMode("field");
    // The field's inertia glides the viewfinder home.
    field.target.x = 0;
    field.target.y = 0;
  };

  return (
    <div className="hud" data-ready={loaded || undefined}>
      <header className="hud-top">
        <button className="brand" onClick={recentre} data-magnetic aria-label="Discovery — back to the centre">
          Discovery<sup>®</sup>
        </button>
        <p className="hud-tag mono">
          An infinite darkroom
          <br />
          Vol. 02 — MMXXVI
        </p>
        <div className="hud-actions">
          <div className="mode-switch" data-mode={mode} role="tablist" aria-label="View">
            <span className="mode-switch-thumb" />
            <button role="tab" aria-selected={mode === "field"} onClick={() => switchMode("field")}>
              Field
            </button>
            <button role="tab" aria-selected={mode === "index"} onClick={() => switchMode("index")}>
              Index
            </button>
          </div>
          <button
            className="sound-toggle hud-link"
            onClick={sound.toggle}
            aria-pressed={soundOn}
            aria-label={soundOn ? "Sound on — mute" : "Sound off — unmute"}
            data-magnetic
          >
            <span className="sound-bars" data-on={soundOn || undefined}>
              <i />
              <i />
              <i />
              <i />
            </span>
            <span className="sound-label">{soundOn ? "On" : "Off"}</span>
          </button>
          <button className="hud-link roll" data-text="Info" onClick={() => useStore.getState().setInfoOpen(true)} data-magnetic>
            <span>Info</span>
          </button>
        </div>
      </header>

      <div className="viewfinder" data-hidden={mode !== "field" || undefined} aria-hidden="true">
        <span className="vf-corner vf-corner--tl" />
        <span className="vf-corner vf-corner--tr" />
        <span className="vf-corner vf-corner--bl" />
        <span className="vf-corner vf-corner--br" />
        <span className="vf-cross" />
      </div>

      <footer className="hud-bottom">
        <div className="hud-left">
          <ExposureDial />
          <div className="hud-coords mono" data-hidden={mode !== "field" || undefined} aria-hidden="true">
          <span>
            X <b ref={xRef}>+00000</b>
          </span>
          <span>
            Y <b ref={yRef}>+00000</b>
          </span>
          <span className="hud-speed">
            <i ref={vRef} />
          </span>
          </div>
        </div>

        <button className="search-pill" onClick={() => useStore.getState().setSearchOpen(true)} data-magnetic>
          <span className="search-pill-dot" data-busy={status === "loading" || undefined} />
          <span className="search-pill-label">
            {status === "loading" ? "Developing…" : queryLabel(query, color)}
          </span>
          <kbd>/</kbd>
        </button>

        <p className="hud-count mono">
          <button className="hud-roll" onClick={openRoll} data-filled={rollCount > 0 || undefined}>
            Roll {pad(rollCount, 2)}
          </button>
          {" · "}
          {pad(count)} frames · Photos via{" "}
          <a href="https://www.pexels.com" target="_blank" rel="noreferrer">
            Pexels
          </a>
        </p>
      </footer>

    </div>
  );
}

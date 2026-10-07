import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useStore, isKept } from "../lib/store";
import { field, findTileForPhoto, toDomRect } from "../lib/field";
import { gsap, reducedMotion, finePointer } from "../lib/gsap";
import { sound } from "../lib/sound";
import { splitChars } from "../lib/split";
import { photoSrc } from "../lib/pexels";
import { pad } from "../lib/mode";

const fit = (box, ratio) => {
  let width = box.width;
  let height = width / ratio;
  if (height > box.height) {
    height = box.height;
    width = height * ratio;
  }
  return {
    left: box.left + (box.width - width) / 2,
    top: box.top + (box.height - height) / 2,
    width,
    height,
  };
};

const RATIOS = [[1, 1], [5, 4], [4, 3], [3, 2], [16, 10], [16, 9], [2, 1], [4, 5], [3, 4], [2, 3], [9, 16], [1, 2]];
const ratioLabel = (w, h) => {
  const r = w / h;
  const off = ([a, b]) => Math.abs(a / b - r);
  const best = RATIOS.reduce((x, y) => (off(y) < off(x) ? y : x));
  return `${off(best) < 0.005 ? "" : "≈ "}${best[0]} : ${best[1]}`;
};

const inView = (r) =>
  r.top + r.height > 0 && r.top < window.innerHeight && r.left + r.width > 0 && r.left < window.innerWidth;

const cardFor = (photo) => photo && document.querySelector(`.card[data-id="${photo.id}"]`);

const LOUPE_RADIUS = 110;

// A darkroom loupe: a lens over the print, magnifying the full-resolution file.
function useLoupe(fly, lens, busy) {
  const zoom = useRef(2.5);
  const shown = useRef(false);
  const move = useRef(null);

  useEffect(() => {
    if (!finePointer) return;
    gsap.set(lens.current, { scale: 0.3 });
    const x = gsap.quickTo(lens.current, "x", { duration: 0.15, ease: "power3" });
    const y = gsap.quickTo(lens.current, "y", { duration: 0.15, ease: "power3" });
    move.current = { x, y };
  }, [lens]);

  const place = (e) => {
    const r = fly.current.getBoundingClientRect();
    const z = zoom.current;
    const el = lens.current;
    el.style.backgroundSize = `${r.width * z}px ${r.height * z}px`;
    el.style.backgroundPosition = `${LOUPE_RADIUS - (e.clientX - r.left) * z}px ${
      LOUPE_RADIUS - (e.clientY - r.top) * z
    }px`;
    move.current.x(e.clientX);
    move.current.y(e.clientY);
  };

  const hide = () => {
    if (!shown.current) return;
    shown.current = false;
    gsap.to(lens.current, { scale: 0.3, opacity: 0, duration: 0.35, ease: "expo.in", overwrite: "auto" });
  };

  if (!finePointer) return {};
  return {
    onPointerMove: (e) => {
      if (busy.current || e.pointerType !== "mouse") return hide();
      if (!shown.current) {
        shown.current = true;
        gsap.set(lens.current, { x: e.clientX, y: e.clientY });
        gsap.to(lens.current, { scale: 1, opacity: 1, duration: 0.6, ease: "expo.out", overwrite: "auto" });
      }
      place(e);
    },
    onPointerLeave: hide,
    onWheel: (e) => {
      zoom.current = Math.min(6, Math.max(1.5, zoom.current * (e.deltaY > 0 ? 0.88 : 1.12)));
      lens.current.querySelector(".loupe-zoom").textContent = `${zoom.current.toFixed(1)}×`;
      place(e);
    },
    hide,
  };
}

export default function Detail() {
  const selected = useStore((s) => s.selected);
  return selected ? <DetailView initial={selected} /> : null;
}

function DetailView({ initial }) {
  const livePhotos = useStore((s) => s.photos);
  // Browsing the roll walks a snapshot, so un-keeping a print doesn't shift the rest.
  const [rollSnapshot] = useState(() => useStore.getState().kept);
  const photos = initial.source === "kept" ? rollSnapshot : livePhotos;
  const [index, setIndex] = useState(initial.photoIndex);
  const photo = photos[index];
  const n = photos.length;
  const kept = useStore((s) => s.kept);
  const photoKept = isKept(kept, photo);

  const root = useRef(null);
  const stage = useRef(null);
  const fly = useRef(null);
  const info = useRef(null);
  const lens = useRef(null);
  const swipe = useRef(null);
  const busy = useRef(true);
  const split = useRef(null);
  const dir = useRef(0);
  const speed = reducedMotion ? 0.35 : 1;

  const lowSrc = index === initial.photoIndex ? initial.lowSrc : null;
  const hiSrc = photoSrc(photo, 2000);
  const { hide: hideLoupe, ...loupe } = useLoupe(fly, lens, busy);
  const targetRect = () => fit(stage.current.getBoundingClientRect(), photo.width / photo.height);

  const revealInfo = () => {
    split.current?.revert();
    split.current = splitChars(info.current.querySelector(".detail-name"));
    return gsap
      .timeline()
      .fromTo(split.current.chars, { yPercent: 130 }, { yPercent: 0, duration: 1.1 * speed, ease: "expo.out", stagger: 0.02 })
      .fromTo(
        info.current.querySelectorAll(".reveal"),
        { y: 24, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.9 * speed, ease: "expo.out", stagger: 0.05 },
        0.1
      );
  };

  const hideInfo = () =>
    gsap
      .timeline()
      .to(split.current?.chars ?? [], { yPercent: -130, duration: 0.45 * speed, ease: "expo.in", stagger: 0.01 })
      .to(info.current.querySelectorAll(".reveal"), { opacity: 0, y: -12, duration: 0.35 * speed, stagger: 0.02 }, 0);

  // Open: the print lifts out of the field (or the index) into the stage.
  useLayoutEffect(() => {
    field.dim = 1;
    if (initial.origin === "field") field.hiddenTile = initial.tileIndex;
    else cardFor(photos[initial.photoIndex])?.classList.add("is-lifted");

    const q = gsap.utils.selector(root);
    sound.play("whoosh");
    gsap.set(fly.current, { ...initial.rect, clipPath: "inset(0% 0% 0% 0%)" });
    const tl = gsap
      .timeline({ onComplete: () => (busy.current = false) })
      .fromTo(q(".detail-bg"), { opacity: 0 }, { opacity: 1, duration: 1 * speed, ease: "power2.out" }, 0)
      .to(fly.current, { ...targetRect(), duration: 1.25 * speed, ease: "expo.inOut" }, 0)
      .fromTo(q(".detail-chrome"), { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.8 * speed, stagger: 0.06 }, 0.7 * speed)
      .fromTo(q(".detail-numeral"), { yPercent: 30, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 1.6 * speed, ease: "expo.out" }, 0.4 * speed)
      .add(revealInfo(), 0.65 * speed);
    return () => {
      tl.kill();
      split.current?.revert();
    };
    // Runs once per opening.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // After browsing to another photograph, wipe it into the stage.
  const first = useRef(true);
  useLayoutEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const d = dir.current;
    gsap.set(fly.current, {
      ...targetRect(),
      clipPath: d > 0 ? "inset(0% 0% 0% 100%)" : "inset(0% 100% 0% 0%)",
    });
    const tl = gsap
      .timeline({ onComplete: () => (busy.current = false) })
      .to(fly.current, { clipPath: "inset(0% 0% 0% 0%)", duration: 1 * speed, ease: "expo.out" }, 0)
      .fromTo(root.current.querySelector(".detail-numeral"), { yPercent: 20, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 1.2 * speed, ease: "expo.out" }, 0)
      .add(revealInfo(), 0.05);
    return () => tl.kill();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  const go = (step) => {
    if (busy.current || n < 2) return;
    busy.current = true;
    hideLoupe?.();
    sound.play("swipe");
    dir.current = step;
    field.hiddenTile = -1;
    cardFor(photo)?.classList.remove("is-lifted");
    gsap
      .timeline({ onComplete: () => setIndex((index + step + n) % n) })
      .add(hideInfo(), 0)
      .to(
        fly.current,
        {
          clipPath: step > 0 ? "inset(0% 100% 0% 0%)" : "inset(0% 0% 0% 100%)",
          duration: 0.6 * speed,
          ease: "expo.in",
        },
        0
      )
      .to(root.current.querySelector(".detail-numeral"), { opacity: 0, duration: 0.4 * speed }, 0);
  };

  // Close: fly the print back to wherever it now lives.
  const close = () => {
    if (busy.current) return;
    busy.current = true;
    hideLoupe?.();
    sound.play("swipe");
    let to = null;
    let card = null;
    if (initial.origin === "field") {
      const tile =
        index === initial.photoIndex && inView(toDomRect(field.rects[initial.tileIndex] ?? {}))
          ? initial.tileIndex
          : findTileForPhoto(index);
      if (tile >= 0) {
        field.hiddenTile = tile;
        to = toDomRect(field.rects[tile]);
      }
    } else {
      card = cardFor(photo);
      const r = card?.querySelector(".card-media").getBoundingClientRect();
      if (r && inView(r)) {
        card.classList.add("is-lifted");
        to = { left: r.left, top: r.top, width: r.width, height: r.height };
      }
    }

    const q = gsap.utils.selector(root);
    const tl = gsap
      .timeline({
        onComplete: () => {
          field.hiddenTile = -1;
          card?.classList.remove("is-lifted");
          useStore.getState().closeDetail();
        },
      })
      .add(hideInfo(), 0)
      .to(q(".detail-chrome, .detail-numeral"), { opacity: 0, duration: 0.4 * speed }, 0)
      .add(() => (field.dim = 0), 0.25 * speed)
      .to(q(".detail-bg"), { opacity: 0, duration: 0.9 * speed, ease: "power2.inOut" }, 0.25 * speed);
    if (to) tl.to(fly.current, { ...to, duration: 1.05 * speed, ease: "expo.inOut" }, 0.15 * speed);
    else tl.to(fly.current, { opacity: 0, scale: 0.92, duration: 0.6 * speed, ease: "expo.in" }, 0.15 * speed);
  };

  useEffect(() => {
    const onKey = (e) => {
      if (useStore.getState().searchOpen) return;
      if (e.key === "Escape") close();
      if (e.key === "k" || e.key === "K") keep();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    const onResize = () => !busy.current && gsap.set(fly.current, targetRect());
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    };
  });

  // Touch: swipe sideways to browse, down to put the print back.
  const onTouchDown = (e) => {
    if (e.pointerType === "touch") swipe.current = { x: e.clientX, y: e.clientY };
  };
  const onTouchUp = (e) => {
    if (!swipe.current) return;
    const dx = e.clientX - swipe.current.x;
    const dy = e.clientY - swipe.current.y;
    swipe.current = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
    else if (dy > 90) close();
  };

  // Keep: a miniature of the print drops into the roll counter.
  const keep = () => {
    const s = useStore.getState();
    const adding = !isKept(s.kept, photo);
    s.toggleKeep(photo);
    sound.play(adding ? "keep" : "tick");
    const counter = root.current?.querySelector(".detail-roll");
    if (!adding || !counter || reducedMotion) return;
    const from = fly.current.getBoundingClientRect();
    const to = counter.getBoundingClientRect();
    const ghost = document.createElement("div");
    ghost.className = "keep-ghost";
    ghost.style.backgroundImage = `url(${hiSrc})`;
    document.body.append(ghost);
    gsap
      .timeline({
        onComplete: () => {
          ghost.remove();
          gsap.fromTo(counter, { scale: 1.3 }, { scale: 1, duration: 0.8, ease: "elastic.out(1, 0.4)" });
        },
      })
      .fromTo(
        ghost,
        { left: from.left, top: from.top, width: from.width, height: from.height, rotate: 0 },
        {
          left: to.left + to.width / 2 - 14,
          top: to.top + to.height / 2 - 18,
          width: 28,
          height: 36,
          rotate: -14,
          duration: 0.95,
          ease: "expo.inOut",
        }
      )
      .to(ghost, { opacity: 0, duration: 0.2 }, 0.8);
  };

  const share = async () => {
    const data = { title: `Photograph by ${photo.photographer}`, url: photo.url };
    try {
      if (navigator.share) await navigator.share(data);
      else {
        await navigator.clipboard.writeText(photo.url);
        useStore.getState().notify("Link copied — pass the print along.");
      }
    } catch {
      /* share sheet dismissed */
    }
  };

  if (!photo) return null;
  return (
    <div
      className="detail"
      ref={root}
      role="dialog"
      aria-modal="true"
      aria-label={`Photograph by ${photo.photographer}`}
      style={{ "--tone": photo.color }}
    >
      <div className="detail-bg" onClick={close} />
      <span className="detail-numeral" aria-hidden="true">
        {pad(index + 1)}
      </span>

      <div className="detail-top detail-chrome">
        <button className="hud-link roll" data-text="← Close" onClick={close} data-magnetic>
          <span>← Close</span>
        </button>
        <span className="detail-top-right mono">
          <span className="detail-roll" data-filled={kept.length > 0 || undefined}>
            Roll {pad(kept.length, 2)}
          </span>
          <span>
            {pad(index + 1)} / {pad(n)}
          </span>
        </span>
      </div>

      <div className="detail-stage" ref={stage} />

      <div
        className="detail-fly"
        ref={fly}
        style={{ background: photo.color }}
        data-cursor="none"
        onPointerDown={onTouchDown}
        onPointerUp={onTouchUp}
        {...loupe}
      >
        {lowSrc && <img src={lowSrc} alt="" />}
        <img
          key={photo.id}
          className="detail-hi"
          src={hiSrc}
          alt={photo.alt || `Photograph by ${photo.photographer}`}
          onLoad={(e) => e.currentTarget.classList.add("is-loaded")}
        />
      </div>

      <aside className="detail-info" ref={info}>
        <p className="mono reveal">Photographed by</p>
        {/* Keyed so SplitText's DOM surgery never meets React's reconciler. */}
        <h2 key={photo.id} className="detail-name">
          {photo.photographer}
        </h2>
        {photo.alt && <p className="detail-alt reveal">{photo.alt}</p>}
        <dl className="detail-meta mono">
          <div className="reveal">
            <dt>Dimensions</dt>
            <dd>
              {photo.width} × {photo.height}
            </dd>
          </div>
          <div className="reveal">
            <dt>Ratio</dt>
            <dd>{ratioLabel(photo.width, photo.height)}</dd>
          </div>
          <div className="reveal">
            <dt>Average tone</dt>
            <dd>
              <i className="swatch" style={{ background: photo.color }} />
              {photo.color}
            </dd>
          </div>
          <div className="reveal">
            <dt>Frame</dt>
            <dd>#{photo.id}</dd>
          </div>
        </dl>
        <div className="detail-actions reveal">
          <a className="btn btn-solid" href={photo.url} target="_blank" rel="noreferrer">
            View on Pexels ↗
          </a>
          <a className="btn" href={photo.photographerUrl} target="_blank" rel="noreferrer">
            Photographer ↗
          </a>
          <button className="btn" onClick={keep} data-kept={photoKept || undefined} aria-pressed={photoKept}>
            {photoKept ? "Kept ●" : "Keep print"} <kbd>K</kbd>
          </button>
          <button className="btn" onClick={share}>
            Share
          </button>
        </div>
        {finePointer && <p className="mono detail-tip reveal">Hover the print for the loupe · scroll to zoom</p>}
      </aside>

      {finePointer && (
        <div
          className="loupe"
          ref={lens}
          aria-hidden="true"
          style={{ backgroundImage: `url(${hiSrc})`, backgroundColor: photo.color }}
        >
          <span className="loupe-cross" />
          <span className="loupe-zoom mono">2.5×</span>
        </div>
      )}

      <div className="detail-nav detail-chrome">
        <button className="nav-btn" onClick={() => go(-1)} data-cursor="Prev" aria-label="Previous photograph">
          ←
        </button>
        <span className="mono">Esc · ← →</span>
        <button className="nav-btn" onClick={() => go(1)} data-cursor="Next" aria-label="Next photograph">
          →
        </button>
      </div>
    </div>
  );
}

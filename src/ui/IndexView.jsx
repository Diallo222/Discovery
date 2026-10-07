import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Lenis from "lenis";
import { useStore, queryLabel } from "../lib/store";
import { gsap, ScrollTrigger, reducedMotion } from "../lib/gsap";
import { splitChars } from "../lib/split";
import { photoSrc } from "../lib/pexels";
import { switchMode, pad } from "../lib/mode";
import { exportContactSheet } from "../lib/contactSheet";

const columnsFor = (w) => (w < 640 ? 2 : w < 1100 ? 3 : w < 1700 ? 4 : 5);
const clampRatio = (p) => Math.min(1.8, Math.max(0.6, p.width / p.height));

// Greedy masonry: appending photos never moves the ones already placed.
function distribute(photos, cols) {
  const columns = Array.from({ length: cols }, () => []);
  const heights = new Array(cols).fill(0);
  photos.forEach((photo, index) => {
    const c = heights.indexOf(Math.min(...heights));
    columns[c].push({ photo, index });
    heights[c] += 1 / clampRatio(photo) + 0.18;
  });
  return columns;
}

function useColumns() {
  const [cols, setCols] = useState(() => columnsFor(window.innerWidth));
  useEffect(() => {
    const onResize = () => setCols(columnsFor(window.innerWidth));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return cols;
}

export default function IndexView() {
  const mode = useStore((s) => s.mode);
  return mode === "index" ? <IndexInner /> : null;
}

function IndexInner() {
  const photos = useStore((s) => s.photos);
  const query = useStore((s) => s.query);
  const color = useStore((s) => s.color);
  const total = useStore((s) => s.total);
  const hasMore = useStore((s) => s.hasMore);
  const status = useStore((s) => s.status);
  const generation = useStore((s) => s.generation);
  const tab = useStore((s) => s.indexTab);
  const kept = useStore((s) => s.kept);
  const onRoll = tab === "kept";
  const list = onRoll ? kept : photos;
  const keptIds = useMemo(() => new Set(kept.map((p) => p.id)), [kept]);
  const [exporting, setExporting] = useState(false);
  const cols = useColumns();
  const columns = useMemo(() => distribute(list, cols), [list, cols]);
  const cardWidth = Math.min(
    1200,
    Math.ceil(((window.innerWidth / cols) * Math.min(window.devicePixelRatio, 2)) / 100) * 100
  );
  const label = onRoll ? "Your roll" : queryLabel(query, color);

  const root = useRef(null);
  const sentinel = useRef(null);

  // Smooth scroll, paused whenever an overlay owns the screen.
  useEffect(() => {
    const lenis = new Lenis({ lerp: reducedMotion ? 1 : 0.085 });
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (t) => lenis.raf(t * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    const sync = (s) => (s.selected || s.searchOpen || s.infoOpen ? lenis.stop() : lenis.start());
    sync(useStore.getState());
    const unsub = useStore.subscribe(sync);
    return () => {
      unsub();
      gsap.ticker.remove(tick);
      gsap.ticker.lagSmoothing(500, 33);
      lenis.destroy();
    };
  }, []);

  // New subject: back to the top.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [generation, tab]);

  // Title + marquee.
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const split = splitChars(root.current.querySelector(".ix-title"));
      gsap.from(split.chars, { yPercent: 130, duration: 1.4, ease: "expo.out", stagger: 0.03, delay: 0.35 });
      gsap.from(".ix-fade", { opacity: 0, y: 16, duration: 1, delay: 0.7, stagger: 0.08 });

      const loop = gsap.to(".marquee-track", { xPercent: -50, duration: 28, ease: "none", repeat: -1 });
      ScrollTrigger.create({
        trigger: ".marquee",
        start: "top bottom",
        end: "bottom top",
        onUpdate: (self) => {
          const v = self.getVelocity() / 400;
          gsap.to(loop, { timeScale: 1 + Math.abs(v), duration: 0.3, overwrite: true });
          gsap.to(".marquee-track", { skewX: gsap.utils.clamp(-12, 12, -v * 2), duration: 0.4, overwrite: "auto" });
        },
      });
    }, root);
    return () => ctx.revert();
  }, [label]);

  // Columns drift at different speeds.
  useLayoutEffect(() => {
    if (reducedMotion) return;
    const ctx = gsap.context(() => {
      gsap.utils.toArray(".ix-col").forEach((col, i) => {
        if (i % 2 === 0) return;
        gsap.fromTo(
          col,
          { y: 0 },
          {
            y: -140,
            ease: "none",
            scrollTrigger: { trigger: ".ix-grid", start: "top bottom", end: "bottom top", scrub: true },
          }
        );
      });
    }, root);
    return () => ctx.revert();
  }, [cols, list.length]);

  // Each print is revealed as it enters the viewport.
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        let k = 0;
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          en.target.style.setProperty("--delay", `${(k++ % 6) * 0.07}s`);
          en.target.classList.add("is-in");
          io.unobserve(en.target);
        });
      },
      { rootMargin: "0px 0px -6% 0px" }
    );
    root.current.querySelectorAll(".card:not(.is-in)").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [list, cols]);

  // Endless roll: develop the next page before reaching the end.
  useEffect(() => {
    if (!hasMore || onRoll) return;
    const io = new IntersectionObserver(
      ([en]) => en.isIntersecting && useStore.getState().loadMore(),
      { rootMargin: "0px 0px 900px 0px" }
    );
    io.observe(sentinel.current);
    return () => io.disconnect();
  }, [hasMore, onRoll, photos.length]);

  const open = (index, button) => {
    const r = button.getBoundingClientRect();
    useStore.getState().openDetail({
      photoIndex: index,
      origin: "index",
      rect: { left: r.left, top: r.top, width: r.width, height: r.height },
      lowSrc: button.querySelector("img")?.currentSrc || null,
      source: onRoll ? "kept" : "photos",
    });
  };

  const exportSheet = async () => {
    setExporting(true);
    try {
      const count = await exportContactSheet({ photos: list, title: label, keptIds });
      useStore.getState().notify(`Contact sheet printed — ${count} exposures.`);
    } catch {
      useStore.getState().notify("The sheet didn’t print. Try again in a moment.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <main className="ix" ref={root}>
      <header className="ix-head">
        <p className="mono ix-fade">
          {onRoll
            ? `( Your roll — ${pad(kept.length)} kept prints )`
            : `( The Index — ${pad(photos.length)} of ${total ? total.toLocaleString("en") : "∞"} frames )`}
        </p>
        <h2 key={label} className="ix-title">
          {label}
        </h2>
        <p className="ix-sub ix-fade">
          {onRoll ? (
            "The prints you kept, from every subject you developed. They stay on this device."
          ) : (
            <>
              The whole roll, laid out as a contact sheet. Scroll to wander, click any print to develop
              it, or{" "}
              <button className="link" onClick={() => useStore.getState().setSearchOpen(true)}>
                search for another subject
              </button>
              .
            </>
          )}
        </p>
        <div className="ix-bar ix-fade">
          <div className="ix-tabs" role="tablist" aria-label="Show">
            <button role="tab" aria-selected={!onRoll} onClick={() => useStore.getState().setIndexTab("all")}>
              All frames <span className="mono">{pad(photos.length)}</span>
            </button>
            <button role="tab" aria-selected={onRoll} onClick={() => useStore.getState().setIndexTab("kept")}>
              Your roll <span className="mono">{pad(kept.length, 2)}</span>
            </button>
          </div>
          <button className="btn" onClick={exportSheet} disabled={exporting || !list.length}>
            {exporting ? "Printing the sheet…" : "Export contact sheet ↓"}
          </button>
        </div>
      </header>

      <div className="marquee" aria-hidden="true">
        <div className="marquee-track">
          {Array.from({ length: 8 }, (_, i) => (
            <span key={i}>
              {label} <i>✺</i>
            </span>
          ))}
        </div>
      </div>

      {onRoll && !kept.length && (
        <p className="ix-empty">
          Nothing on your roll yet. Open any print and press <kbd>K</kbd> to keep it.
        </p>
      )}

      <section className="ix-grid" style={{ "--cols": cols }} aria-label={`${label} — photographs`}>
        {columns.map((column, c) => (
          <div className="ix-col" key={c}>
            {column.map(({ photo, index }) => (
              <figure className="card" data-photo={index} data-id={photo.id} key={photo.id}>
                <button
                  className="card-media"
                  style={{ aspectRatio: clampRatio(photo), "--tone": photo.color }}
                  onClick={(e) => open(index, e.currentTarget)}
                  data-cursor="View"
                  aria-label={`Open photograph by ${photo.photographer}`}
                >
                  <img
                    src={photoSrc(photo, cardWidth)}
                    alt={photo.alt}
                    loading="lazy"
                    decoding="async"
                    onLoad={(e) => e.currentTarget.classList.add("is-loaded")}
                  />
                </button>
                <figcaption className="mono">
                  <span>
                    N° {pad(index + 1)}
                    {!onRoll && keptIds.has(photo.id) && <i className="card-kept" title="On your roll" />}
                  </span>
                  <span className="card-by">{photo.photographer}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        ))}
      </section>

      <footer className="ix-foot">
        <p className="mono ix-status" ref={sentinel}>
          {onRoll
            ? `${kept.length} prints on your roll`
            : hasMore
            ? status === "loading"
              ? "Developing more frames…"
              : "Keep scrolling — more frames are drying"
            : `End of the roll — ${photos.length} frames`}
        </p>
        <button className="btn btn-solid" onClick={() => switchMode("field")}>
          Back to the field ↗
        </button>
        <p className="ix-word" aria-hidden="true">
          Discovery<sup>®</sup>
        </p>
        <div className="ix-credits mono">
          <span>Photographs courtesy of Pexels & its contributors</span>
          <span>Built with React Three Fiber, GSAP & Lenis</span>
          <span>© MMXXVI</span>
        </div>
      </footer>
    </main>
  );
}

import { useEffect, useRef } from "react";
import { gsap, reducedMotion } from "../lib/gsap";
import { shutterApi as api } from "../lib/shutter";
import { sound } from "../lib/sound";

export default function Shutter() {
  const root = useRef(null);

  useEffect(() => {
    const el = root.current;
    const [top, bottom] = el.querySelectorAll(".shutter-blade");
    const label = el.querySelector(".shutter-label");
    const seam = el.querySelector(".shutter-seam");
    const speed = reducedMotion ? 0.5 : 1;
    let busy = false;

    api.run = (text, midway) => {
      if (busy) return;
      busy = true;
      label.textContent = text;
      gsap
        .timeline({
          defaults: { duration: 0.7 * speed },
          onStart: () => gsap.set(el, { visibility: "visible" }),
          onComplete: () => {
            busy = false;
            gsap.set(el, { visibility: "hidden" });
          },
        })
        .fromTo(top, { yPercent: -101 }, { yPercent: 0, ease: "shutter" }, 0)
        .fromTo(bottom, { yPercent: 101 }, { yPercent: 0, ease: "shutter" }, 0)
        .fromTo(seam, { scaleX: 0, transformOrigin: "left" }, { scaleX: 1, duration: 0.5, ease: "expo.out" }, 0.5 * speed)
        .fromTo(label, { yPercent: 110 }, { yPercent: 0, duration: 0.55, ease: "expo.out" }, 0.55 * speed)
        .add(() => sound.play("shutter"), 0.62 * speed)
        .add(midway, 0.8 * speed)
        .to(label, { yPercent: -110, duration: 0.4, ease: "expo.in" }, 1.2 * speed)
        .to(seam, { scaleX: 0, transformOrigin: "right", duration: 0.4, ease: "expo.in" }, 1.2 * speed)
        .to(top, { yPercent: -101, duration: 0.85 * speed, ease: "shutter" }, 1.4 * speed)
        .to(bottom, { yPercent: 101, duration: 0.85 * speed, ease: "shutter" }, 1.4 * speed);
    };
    return () => {
      api.run = null;
    };
  }, []);

  return (
    <div className="shutter" ref={root} aria-hidden="true">
      <div className="shutter-blade shutter-blade--top" />
      <div className="shutter-blade shutter-blade--bottom" />
      <div className="shutter-mid">
        <span className="shutter-seam" />
        <span className="mask">
          <span className="shutter-label" />
        </span>
      </div>
    </div>
  );
}

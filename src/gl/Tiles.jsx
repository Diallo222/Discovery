import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useStore } from "../lib/store";
import { FOV, field, pickTile } from "../lib/field";
import { gsap, reducedMotion, finePointer } from "../lib/gsap";
import { photoSrc } from "../lib/pexels";
import { buildLayout } from "./layout";
import { loadTexture, pruneTextures } from "./textures";
import { vertexShader, fragmentShader } from "./shaders";

const BG = new THREE.Color("#0b0a09");
const PAPER = new THREE.Color("#131110");
const SAFE = new THREE.Color("#ff3d1f");
const geometry = new THREE.PlaneGeometry(1, 1, 24, 24);

const wrap = (v, period) => ((((v + period / 2) % period) + period) % period) - period / 2;
const damp = (from, to, lambda, dt) => from + (to - from) * (1 - Math.exp(-lambda * dt));
const clampV = (v) => Math.max(-70, Math.min(70, v));

function useDebounced(value, ms) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return debounced;
}

export default function Tiles() {
  const photos = useStore((s) => s.photos);
  const generation = useStore((s) => s.generation);
  const mode = useStore((s) => s.mode);
  const loaded = useStore((s) => s.loaded);
  const size = useThree((s) => s.size);
  const camera = useThree((s) => s.camera);
  const scene = useThree((s) => s.scene);
  const vw = useDebounced(size.width, 200);
  const vh = useDebounced(size.height, 200);

  const shared = useMemo(
    () => ({
      uTime: { value: 0 },
      uVelocity: { value: new THREE.Vector2() },
      uBend: { value: 0 },
      uRadius: { value: 1 },
      uDist: { value: 1 },
      uDevelop: { value: 0 },
      uFocus: { value: 0 },
      uDim: { value: 0 },
      uExposure: { value: 1 },
      uPaper: { value: PAPER },
      uSafe: { value: SAFE },
      uBg: { value: BG.clone() },
    }),
    []
  );

  // One unit = one CSS pixel on the z = 0 plane when the camera rests at `base`.
  const base = useRef(1000);
  const zoom = useRef(1);
  useLayoutEffect(() => {
    base.current = size.height / 2 / Math.tan(THREE.MathUtils.degToRad(FOV / 2));
    camera.fov = FOV;
    camera.position.set(0, 0, base.current * zoom.current);
    camera.near = 1;
    camera.far = base.current * 4;
    camera.updateProjectionMatrix();
  }, [camera, size]);

  useLayoutEffect(() => {
    scene.background = shared.uBg.value;
  }, [scene, shared]);

  // A new result set first develops the current sheets back to blank paper.
  const [shown, setShown] = useState(null);
  useEffect(() => {
    if (!photos.length || shown?.photos === photos) return;
    const swap = () => setShown({ generation, photos });
    if (!shown || mode !== "field") return swap();
    // Pages appended from the index: refresh while returning to the field.
    if (generation === shown.generation) return swap();
    const tween = gsap.to(shared.uDevelop, {
      value: 0,
      duration: reducedMotion ? 0.3 : 1.1,
      ease: "power2.in",
      overwrite: true,
      onComplete: swap,
    });
    return () => tween.kill();
  }, [photos, generation, mode, shown, shared]);

  const layout = useMemo(
    () => (shown ? buildLayout(shown.photos, vw, vh) : null),
    [shown, vw, vh]
  );
  const texWidth = layout
    ? Math.ceil((layout.colW * Math.min(window.devicePixelRatio, 2)) / 100) * 100
    : 0;

  useEffect(() => {
    field.shownPhotos = shown?.photos ?? null;
    field.tileSrc = (photoIndex) => photoSrc(shown.photos[photoIndex], texWidth);
  }, [shown, texWidth]);

  const materials = useMemo(() => {
    if (!layout) return [];
    return layout.tiles.map((t) => {
      const photo = shown.photos[t.photoIndex];
      return new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          ...shared,
          uTex: { value: null },
          uImageRes: { value: new THREE.Vector2(photo.width, photo.height) },
          uPlaneRes: { value: new THREE.Vector2(t.w, t.h) },
          uColor: { value: new THREE.Color(photo.color) },
          uLoaded: { value: 0 },
          uHover: { value: 0 },
          uSeed: { value: t.seed },
          uHidden: { value: 0 },
          uKept: { value: 0 },
        },
      });
    });
    // `shown` is captured through `layout`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout, shared]);

  useEffect(() => () => materials.forEach((m) => m.dispose()), [materials]);

  // Kept prints wear a notch.
  const kept = useStore((s) => s.kept);
  useEffect(() => {
    if (!layout) return;
    const ids = new Set(kept.map((p) => p.id));
    layout.tiles.forEach((t, i) => {
      materials[i].uniforms.uKept.value = ids.has(shown.photos[t.photoIndex].id) ? 1 : 0;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kept, materials]);

  // Load prints for every photo on the sheet.
  const [ready, setReady] = useState(false);
  const developed = useRef(null); // the result set whose prints are developed
  useEffect(() => {
    if (!layout) return;
    setReady(false);
    let cancelled = false;
    const urls = shown.photos.map((p) => photoSrc(p, texWidth));
    pruneTextures(new Set(urls));
    const used = [...new Set(layout.tiles.map((t) => t.photoIndex))];
    let done = 0;
    const finish = () => !cancelled && setReady(true);
    const timeout = setTimeout(finish, 7000);

    used.forEach((photoIndex) =>
      loadTexture(urls[photoIndex]).then((tex) => {
        if (cancelled) return;
        done++;
        useStore.getState().setLoadProgress(done / used.length);
        if (tex) {
          layout.tiles.forEach((t, i) => {
            if (t.photoIndex !== photoIndex) return;
            const u = materials[i].uniforms;
            u.uTex.value = tex;
            u.uImageRes.value.set(tex.image.width, tex.image.height);
            // A resize re-lays developed prints: no fade from flat colour.
            if (developed.current === shown) u.uLoaded.value = 1;
            else gsap.to(u.uLoaded, { value: 1, duration: 0.6 });
          });
        }
        if (done === used.length) finish();
      })
    );
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout, materials]);

  // Develop each result set once the preloader has handed over. A resize
  // rebuilds the layout but must not send the prints back into the tray.
  useEffect(() => {
    useStore.getState().setFieldReady(ready);
    if (!ready || !loaded || developed.current === shown) return;
    const previous = developed.current;
    const first = previous === null;
    developed.current = shown;
    const tween = gsap.fromTo(
      shared.uDevelop,
      { value: 0 },
      {
        value: 1,
        duration: reducedMotion ? 0.8 : first ? 3.6 : 2.6,
        ease: "develop",
        delay: first ? 0.45 : 0.1,
        overwrite: true,
      }
    );
    return () => {
      // Interrupted mid-develop: let the next run start it over.
      if (tween.progress() < 1) {
        tween.kill();
        developed.current = previous;
      }
    };
  }, [ready, loaded, shown, shared]);

  const meshes = useRef([]);
  const tone = useMemo(() => new THREE.Color(), []);

  useFrame((state, delta) => {
    if (!layout) return;
    const dt = Math.min(delta, 1 / 20);
    const { width: w, height: h } = state.size;
    const D = base.current;
    const R = Math.hypot(w, h) / 2;
    shared.uDist.value = D;
    shared.uRadius.value = R;
    shared.uTime.value += dt;

    // Inertia: the field eases towards where the hand sent it.
    const px = field.offset.x;
    const py = field.offset.y;
    field.offset.x = damp(px, field.target.x, 6.5, dt);
    field.offset.y = damp(py, field.target.y, 6.5, dt);
    const perFrame = 1 / (dt * 60);
    field.velocity.x = damp(field.velocity.x, clampV((field.offset.x - px) * perFrame), 10, dt);
    field.velocity.y = damp(field.velocity.y, clampV((field.offset.y - py) * perFrame), 10, dt);

    const motion = reducedMotion ? 0 : 1;
    shared.uVelocity.value.set(field.velocity.x * motion, field.velocity.y * motion);
    const speed = Math.hypot(field.velocity.x, field.velocity.y);
    shared.uBend.value = damp(
      shared.uBend.value,
      motion * (0.15 + Math.min(speed / 45, 1) * 0.22),
      5,
      dt
    );
    const bend = shared.uBend.value;

    // The camera lifts away from the sheet when it moves fast or is held.
    zoom.current = damp(
      zoom.current,
      1 + motion * (Math.min(speed / 50, 1) * 0.16 + (field.dragging ? 0.05 : 0)),
      3.5,
      dt
    );
    const C = D * zoom.current;
    camera.position.z = C;

    const tiles = layout.tiles;
    const rects = field.rects;
    rects.length = tiles.length;
    for (let i = 0; i < tiles.length; i++) {
      const t = tiles[i];
      const mesh = meshes.current[i];
      if (!mesh) continue;
      const x = wrap(t.x + field.offset.x, layout.W);
      const y = wrap(t.y + field.offset.y, t.period);
      mesh.position.set(x, y, 0);
      const r = Math.hypot(x, y) / R;
      const z = -r * r * bend * D + materials[i].uniforms.uHover.value * 0.055 * D;
      const s = D / (C - z);
      const rect = rects[i] || (rects[i] = {});
      rect.cx = w / 2 + x * s;
      rect.cy = h / 2 - y * s;
      rect.w = t.w * s;
      rect.h = t.h * s;
      rect.photoIndex = t.photoIndex;
    }

    const store = useStore.getState();
    const interactive =
      finePointer && field.pointer.inside && !field.locked && !field.dragging && store.loaded;
    const hovered = interactive ? pickTile(field.pointer.x, field.pointer.y) : -1;

    for (let i = 0; i < tiles.length; i++) {
      const u = materials[i].uniforms;
      u.uHover.value = damp(u.uHover.value, i === hovered ? 1 : 0, 9, dt);
      u.uHidden.value = i === field.hiddenTile ? 1 : 0;

      // The hovered print tips away from the hand like a card under a finger.
      const mesh = meshes.current[i];
      if (!mesh) continue;
      let tiltX = 0;
      let tiltY = 0;
      if (i === hovered) {
        const r = rects[i];
        tiltX = THREE.MathUtils.clamp((field.pointer.y - r.cy) / (r.h / 2), -1, 1) * 0.16 * motion;
        tiltY = THREE.MathUtils.clamp((field.pointer.x - r.cx) / (r.w / 2), -1, 1) * 0.16 * motion;
      }
      mesh.rotation.x = damp(mesh.rotation.x, tiltX, 8, dt);
      mesh.rotation.y = damp(mesh.rotation.y, tiltY, 8, dt);
    }
    shared.uFocus.value = damp(shared.uFocus.value, hovered >= 0 ? 1 : 0, 6, dt);
    shared.uDim.value = damp(shared.uDim.value, field.dim, 5, dt);
    shared.uExposure.value = damp(shared.uExposure.value, 2 ** store.exposure, 10, dt);

    const photoIndex = hovered >= 0 ? tiles[hovered].photoIndex : -1;
    store.setHovered(photoIndex);
    tone.copy(BG);
    if (hovered >= 0) tone.lerp(materials[hovered].uniforms.uColor.value, 0.06);
    shared.uBg.value.lerp(tone, 1 - Math.exp(-3.5 * dt));
  });

  if (!layout) return null;
  meshes.current.length = layout.tiles.length;
  return (
    <group>
      {layout.tiles.map((t, i) => (
        <mesh
          key={i}
          ref={(m) => (meshes.current[i] = m)}
          geometry={geometry}
          material={materials[i]}
          scale={[t.w, t.h, 1]}
          frustumCulled={false}
        />
      ))}
    </group>
  );
}

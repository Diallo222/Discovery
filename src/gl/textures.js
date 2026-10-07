import * as THREE from "three";

const loader = new THREE.TextureLoader();
loader.setCrossOrigin("anonymous");

const cache = new Map(); // url → Promise<Texture | null>
let renderer = null;

export const setRenderer = (gl) => {
  renderer = gl;
};

export function loadTexture(url) {
  let entry = cache.get(url);
  if (entry) return entry;
  entry = new Promise((resolve) => {
    loader.load(
      url,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.minFilter = THREE.LinearMipmapLinearFilter;
        tex.anisotropy = 4;
        // Upload as each image arrives instead of all at once on first render.
        renderer?.initTexture(tex);
        resolve(tex);
      },
      undefined,
      () => {
        cache.delete(url);
        resolve(null);
      }
    );
  });
  cache.set(url, entry);
  return entry;
}

// Free GPU memory held by textures from previous result sets.
export function pruneTextures(keep) {
  for (const [url, entry] of cache) {
    if (keep.has(url)) continue;
    cache.delete(url);
    entry.then((tex) => tex?.dispose());
  }
}

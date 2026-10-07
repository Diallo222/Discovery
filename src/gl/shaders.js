// Each tile is a sheet of photographic paper.
// Vertex: the field bends into a lens bowl that deepens with speed, and every
// sheet bulges like wet paper against the drag direction.
// Fragment: blank paper → safelight negative → positive print, a develop
// wave radiating from the centre of the viewfinder.

export const vertexShader = /* glsl */ `
  uniform vec2 uVelocity;
  uniform float uBend;
  uniform float uHover;
  uniform float uRadius;
  uniform float uDist;

  varying vec2 vUv;
  varying float vRadial;
  varying float vDepth;

  #define PI 3.141592653589793

  void main() {
    vUv = uv;
    vec4 world = modelMatrix * vec4(position, 1.0);

    float bulge = sin(uv.x * PI) * sin(uv.y * PI);
    world.xy -= uVelocity * bulge * 0.85;

    float r = length(world.xy) / uRadius;
    float z = -r * r * uBend * uDist;
    z += uHover * 0.055 * uDist * (0.55 + 0.45 * bulge);
    world.z += z;

    vRadial = r;
    vDepth = max(-z / uDist, 0.0);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

export const fragmentShader = /* glsl */ `
  uniform sampler2D uTex;
  uniform vec2 uImageRes;
  uniform vec2 uPlaneRes;
  uniform vec2 uVelocity;
  uniform vec3 uColor;
  uniform vec3 uPaper;
  uniform vec3 uSafe;
  uniform vec3 uBg;
  uniform float uLoaded;
  uniform float uHover;
  uniform float uFocus;
  uniform float uDevelop;
  uniform float uDim;
  uniform float uTime;
  uniform float uSeed;
  uniform float uHidden;
  uniform float uExposure;
  uniform float uKept;

  varying vec2 vUv;
  varying float vRadial;
  varying float vDepth;

  // Sine-free hash (Dave Hoskins): sin() at large arguments loses precision on
  // some GPUs and paints diagonal moiré into the grain.
  float hash(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
      v += a * noise(p);
      p *= 2.03;
      a *= 0.5;
    }
    return v;
  }

  vec2 cover(vec2 uv, vec2 plane, vec2 image) {
    float rp = plane.x / plane.y;
    float ri = image.x / image.y;
    vec2 s = rp < ri ? vec2(rp / ri, 1.0) : vec2(1.0, ri / rp);
    return (uv - 0.5) * s + 0.5;
  }

  void main() {
    if (uHidden > 0.5) discard;

    vec2 uv = (vUv - 0.5) * (1.0 - 0.07 * uHover) + 0.5;
    uv = cover(uv, uPlaneRes, uImageRes);

    vec2 shift = uVelocity * 0.0011;
    vec3 img = vec3(
      texture2D(uTex, uv + shift).r,
      texture2D(uTex, uv).g,
      texture2D(uTex, uv - shift).b
    );
    img = mix(uColor, img, uLoaded);
    // The enlarger's exposure, with a touch of paper contrast.
    img *= uExposure;
    img = clamp((img - 0.5) * (1.0 + 0.12 * log2(uExposure)) + 0.5, 0.0, 1.0);
    float luma = dot(img, vec3(0.299, 0.587, 0.114));

    float recede = uFocus * (1.0 - uHover);
    img = mix(img, vec3(luma) * 0.5, recede * 0.7);

    // Develop: progress is per-pixel, rippling outwards from the centre.
    float n = fbm(vUv * 3.2 + uSeed * 17.0);
    float p = uDevelop * 2.1 - vRadial * 0.75 - n * 0.4;
    float latent = smoothstep(0.0, 0.4, p);
    float fixd = smoothstep(0.5, 1.05, p);
    vec3 negative = (1.0 - luma) * uSafe * 0.9 + uSafe * 0.06;
    vec3 col = mix(uPaper, negative, latent);
    col = mix(col, img, fixd);

    // Safelight hairline on the hovered sheet; a notch cut into kept prints.
    vec2 px = vUv * uPlaneRes;
    float notch = 1.0 - step(26.0, (uPlaneRes.x - px.x) + (uPlaneRes.y - px.y));
    col = mix(col, uSafe, notch * uKept * fixd);
    float edge = min(min(px.x, uPlaneRes.x - px.x), min(px.y, uPlaneRes.y - px.y));
    col = mix(col, uSafe, (1.0 - smoothstep(1.0, 2.5, edge)) * uHover);

    col = mix(col, uBg, clamp(vDepth * 1.5, 0.0, 0.6));
    col = mix(col, uBg, uDim * 0.88);
    col += (hash(gl_FragCoord.xy + floor(fract(uTime * 0.5) * 24.0) * 37.0) - 0.5) * 0.024;

    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`;

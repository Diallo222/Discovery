# Discovery — an infinite darkroom

An endless, draggable WebGL contact sheet of photographs from [Pexels](https://www.pexels.com).
Every print develops live on screen — blank paper, a safelight negative, then the image — and
every search sends the whole sheet back into the tray.

## Experience

- **Preloader** — a viewfinder in burst mode, exposure counter, shutter-blade reveal.
- **The Field** — infinite masonry in WebGL (React Three Fiber). Drag, flick, scroll or use the
  arrow keys. The camera lifts away as you move fast; the sheet bends into a lens bowl that deepens with speed, prints bulge like wet paper
  and split their RGB channels against the motion. Hover focuses one print and tints the room
  with its average colour.
- **Develop** — a custom shader takes each result set from paper → negative → positive in a
  wave radiating from the centre of the viewfinder.
- **Detail** — click a print and it lifts out of the field into a tinted darkroom with its
  metadata; browse with ← → (or swipe). Hover the print for a loupe; scroll to change its zoom.
- **Search** — `/` opens a full-screen command overlay: subjects, tone swatches (Pexels colour
  filter), recent searches and "Surprise me". Every sheet is shareable: `?q=fog&tone=blue`.
- **Your roll** — press `K` on any print to keep it (it drops into the roll counter and gets a
  safelight notch in the field). Kept prints persist on the device and have their own Index tab.
- **Contact sheet export** — prints the current sheet (or your roll) as a 4K 35mm contact sheet:
  film strips, sprocket holes, edge numbers, portraits on their side and grease pencil around
  the keepers.
- **Exposure dial** — an enlarger-style EV ruler (drag, scroll or `[` `]`) that brightens or
  darkens every print, clicking in thirds of a stop.
- **Sound** — optional, synthesised with WebAudio: shutter clicks, hover ticks, develop
  sweeps and a room tone that opens up as you drag faster.
- **The Index** — an accessible, smooth-scrolled (Lenis) contact sheet with ScrollTrigger
  reveals, drifting columns, a velocity-reactive marquee and endless loading.

## Stack

React 19 · React Three Fiber 9 / three.js · GSAP (ScrollTrigger, SplitText, CustomEase) · Lenis ·
zustand · Vite

## Setup

```bash
cp .env.example .env.local   # then add your Pexels API key
npm install
npm run dev
```

Set `VITE_PEXELS_API_KEY` in your host's environment variables when deploying.
Note that any `VITE_` variable is bundled into client code, so the key is visible to visitors.

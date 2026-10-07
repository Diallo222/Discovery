import { SplitText } from "./gsap";

// Chars rise inside padded line masks: per-char masks would clip italic
// overhangs and descenders of the display serif.
export const splitChars = (targets) =>
  SplitText.create(targets, {
    type: "lines,chars",
    mask: "lines",
    linesClass: "split-line",
  });

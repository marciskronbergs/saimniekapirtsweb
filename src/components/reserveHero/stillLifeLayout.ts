// Where each layer of the reservation hero's still life goes, in stage
// pixels. The pictures are cropped to their visible subjects (see
// public/media/reserve-hero), so a box here is the object itself, not a
// canvas with transparent padding around it.
//
// Two compositions: a wide one for landscape screens and an upright one for
// phones and portrait tablets. Both are drawn in design units (u) and anchored
// to the stage's bottom, so a taller stage gives the heading more open forest
// rather than stretching the scene.

export type Box = { x: number; y: number; w: number; h: number };

// Pixel sizes of the cropped sources, for their aspect ratios.
export const SIZE = {
  forest: { w: 1672, h: 942 },
  foliage: { w: 1672, h: 942 },
  log: { w: 1600, h: 516 },
  honey: { w: 1172, h: 760 },
  salt: { w: 1386, h: 700 },
  herbs: { w: 1366, h: 701 },
  whisk: { w: 1467, h: 943 },
  dipper: { w: 1356, h: 867 },
} as const;

// The drop at the dipper's tip, as shares of its picture.
const DRIP = { x: 0.9, y: 0.985 };

export interface StillLife {
  portrait: boolean;
  forest: Box;
  foliage: Box;
  log: Box;
  honey: Box;
  salt: Box;
  herbs: Box;
  whisk: Box;
  dipper: Box;
  // Where the heading's block starts and how wide it may be.
  title: { top: number; left: number; right: number; maxSize: number; lines: 1 | 2 };
}

const byWidth = (w: number, size: { w: number; h: number }) => w * (size.h / size.w);

export function layoutStillLife(W: number, H: number): StillLife {
  const portrait = W / H < 1.05;
  // The upright scene is designed at 390 × 760, the wide one at 1600 × 900.
  const u = portrait ? Math.min(W / 390, H / 700) : Math.min(W / 1600, H / 900);
  const cx = W / 2;

  // The forest overscans the stage, so parallax never shows its edge.
  const forest = { x: -W * 0.03, y: -H * 0.03, w: W * 1.06, h: H * 1.06 };

  // The log spans the stage; its fern tips start `logTop` above the bottom.
  const logW = Math.max(portrait ? 880 * u : 1820 * u, W * 1.1);
  const logH = byWidth(logW, SIZE.log);
  const logTop = H - (portrait ? 196 : 362) * u;
  const log = { x: cx - logW / 2, y: logTop, w: logW, h: logH };
  // The moss the bowls sit on, a little in front of the log's crest.
  const rest = logTop + logH * (portrait ? 0.34 : 0.33);

  const place = (centerX: number, bottom: number, w: number, size: { w: number; h: number }): Box => {
    const h = byWidth(w, size);
    return { x: centerX - w / 2, y: bottom - h, w, h };
  };

  if (portrait) {
    const honey = place(cx, rest + logH * 0.1, 236 * u, SIZE.honey);
    const salt = place(cx - 112 * u, rest + logH * 0.2, 132 * u, SIZE.salt);
    const herbs = place(cx + 114 * u, rest + logH * 0.19, 132 * u, SIZE.herbs);
    const whisk = place(cx + 40 * u, rest - 6 * u, 340 * u, SIZE.whisk);
    const dipperW = 168 * u;
    const dipperH = byWidth(dipperW, SIZE.dipper);
    const dipper = {
      x: cx + 6 * u - dipperW * DRIP.x,
      y: honey.y + honey.h * 0.04 - dipperH * DRIP.y,
      w: dipperW,
      h: dipperH,
    };
    // Only the ferns at the foot reach into an upright frame.
    const folW = W * 1.9;
    const folH = byWidth(folW, SIZE.foliage);
    const foliage = { x: cx - folW / 2, y: H - folH * 0.86, w: folW, h: folH };
    return {
      portrait,
      forest,
      foliage,
      log,
      honey,
      salt,
      herbs,
      whisk,
      dipper,
      title: { top: H * 0.06, left: W * 0.06, right: W * 0.94, maxSize: Math.min(W * 0.24, H * 0.13), lines: 2 },
    };
  }

  const honey = place(cx, rest + logH * 0.07, 430 * u, SIZE.honey);
  const salt = place(cx - 352 * u, rest + logH * 0.14, 290 * u, SIZE.salt);
  const herbs = place(cx + 356 * u, rest + logH * 0.13, 290 * u, SIZE.herbs);
  const whisk = place(cx + 118 * u, rest - 8 * u, 800 * u, SIZE.whisk);
  const dipperW = 286 * u;
  const dipperH = byWidth(dipperW, SIZE.dipper);
  const dipper = {
    x: cx + 14 * u - dipperW * DRIP.x,
    y: honey.y + honey.h * 0.05 - dipperH * DRIP.y,
    w: dipperW,
    h: dipperH,
  };
  // The foliage frame, enlarged so its leaves stay in the corners.
  const folW = Math.max(W, (H * SIZE.foliage.w) / SIZE.foliage.h) * 1.16;
  const folH = byWidth(folW, SIZE.foliage);
  const foliage = { x: cx - folW / 2, y: (H - folH) / 2 - H * 0.04, w: folW, h: folH };
  return {
    portrait,
    forest,
    foliage,
    log,
    honey,
    salt,
    herbs,
    whisk,
    dipper,
    title: { top: H * 0.055, left: W * 0.23, right: W * 0.77, maxSize: H * 0.16, lines: 1 },
  };
}

// The picture `size` drawn object-fit: cover into `box`, at `focus`.
export function coverBox(box: Box, size: { w: number; h: number }, focusX = 0.5, focusY = 0.5): Box {
  const s = Math.max(box.w / size.w, box.h / size.h);
  const w = size.w * s;
  const h = size.h * s;
  return { x: box.x + (box.w - w) * focusX, y: box.y + (box.h - h) * focusY, w, h };
}

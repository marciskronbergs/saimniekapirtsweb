// The footage for CinematicHero: IMG_7234.mp4 (3840×2160, 60 fps, 2.88 s),
// hands working a treatment in a bowl in front of birch whisks.
//
// The source has a black band along its bottom 216 px and a black last
// frame; both are cut. The full take otherwise, as WebP frames:
//   desktop  172 frames, every source frame (60 fps), 1600×808
//   mobile    86 frames, every second one (30 fps), 720×1080 portrait crop
//             centred on the hands and the bowl
// The posters are the first frames, so the poster and the sequence share
// the browser cache.
//
// Regenerate (from the project folder, source one level up):
//   ffmpeg -i ../IMG_7234.mp4 -vf "crop=3840:1940:0:0,scale=1600:808:flags=lanczos" \
//     -c:v libwebp -quality 70 -compression_level 6 -preset photo public/media/hero/sequence/desktop/f_%03d.webp
//   ffmpeg -i ../IMG_7234.mp4 -vf "select='not(mod(n\,2))',crop=1292:1938:1374:0,scale=720:1080:flags=lanczos" \
//     -fps_mode vfr -c:v libwebp -quality 64 -compression_level 6 -preset photo public/media/hero/sequence/mobile/f_%03d.webp
//   then delete the last (black) file of each.
//
// Like the rest of public/media/, served by the site itself; to move it to
// the Supabase bucket, upload the folder and change BASE.

const BASE = '/media/hero/sequence';

export interface HeroSequence {
  frameCount: number;
  frameUrl: (index: number) => string;
  poster: string;
  width: number;
  height: number;
  // Which part stays in view when the picture is cropped, 0–1 from left/top.
  focusX: number;
  focusY: number;
  // Source frames (60 fps) per frame of this sequence.
  sourceStep: number;
}

const frames = (dir: string) => (i: number) => `${BASE}/${dir}/f_${String(i + 1).padStart(3, '0')}.webp`;

export const desktopSequence: HeroSequence = {
  frameCount: 172,
  frameUrl: frames('desktop'),
  poster: `${BASE}/desktop/f_001.webp`,
  width: 1600,
  height: 808,
  // The hands enter from the upper right and work at the centre.
  focusX: 0.56,
  focusY: 0.62,
  sourceStep: 1,
};

export const mobileSequence: HeroSequence = {
  frameCount: 86,
  frameUrl: frames('mobile'),
  poster: `${BASE}/mobile/f_001.webp`,
  width: 720,
  height: 1080,
  focusX: 0.55,
  focusY: 0.6,
  sourceStep: 2,
};

// ------------------------------------------------------------------ timing
//
// How much scroll each source frame gets. The quiet preparation (hands
// pressing into the bowl, frames 0–72) plays at the base rate; the hands
// lifting and the treatment dripping back into the bowl (86–152, both lifts)
// get 2.6× the scroll per frame; the hands leaving (164–171) the base rate
// again. The rate changes along smoothstep ramps, so the playback speed has
// no jumps and the frame curve is smooth and strictly increasing.

const SOURCE_FRAMES = 172;
const SLOW = 2.6;
const SLOW_IN = [72, 86];
const SLOW_OUT = [152, 164];

const smooth = (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));

const weight = (f: number) =>
  1 +
  (SLOW - 1) *
    smooth((f - SLOW_IN[0]) / (SLOW_IN[1] - SLOW_IN[0])) *
    (1 - smooth((f - SLOW_OUT[0]) / (SLOW_OUT[1] - SLOW_OUT[0])));

// cumulative[f]: share of the playback scroll used up when source frame f
// is reached (trapezoids, sampled every tenth of a frame).
const cumulative = (() => {
  const out = new Float64Array(SOURCE_FRAMES);
  let sum = 0;
  for (let f = 1; f < SOURCE_FRAMES; f++) {
    for (let k = 0; k < 10; k++) {
      const a = f - 1 + k / 10;
      sum += (weight(a) + weight(a + 0.1)) * 0.05;
    }
    out[f] = sum;
  }
  for (let f = 1; f < SOURCE_FRAMES; f++) out[f] /= sum;
  return out;
})();

// Playback progress 0–1 → source frame, fractional.
export function sourceFrameAt(t: number): number {
  if (t <= 0) return 0;
  if (t >= 1) return SOURCE_FRAMES - 1;
  let lo = 0;
  let hi = SOURCE_FRAMES - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (cumulative[mid] <= t) lo = mid;
    else hi = mid;
  }
  return lo + (t - cumulative[lo]) / (cumulative[hi] - cumulative[lo]);
}

// The three stages of the section's scroll.
export const HOLD_START = 0.1;
export const PLAY_END = 0.85;

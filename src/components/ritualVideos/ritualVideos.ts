// The three ritual videos, each the whole sauna ritual from start to end, on
// the homepage (VideoSection) and the rituals page (RitualIntro), in order:
// left, middle (the one in front at first: MAIN_VIDEO), right.
//
// The files are upright 9:16 MP4s, 720×1280, H.264 (~1 Mbit/s) with AAC
// stereo sound, 6–8 MB each, with the moov atom first so they start at once;
// each poster is a frame from its first second. Their labels (for screen
// readers; the cards show no captions) live in the translation files under
// rituali-preview → videos.items, in the same order.
//
// VIDEO_BASE: where the files are served from. Today the site's own
// public/media/ritual-videos; once they are in Supabase storage (bucket
// websiteassets, folder videos/, same file names), set it to
// 'https://wigoyeorqnssgbrgexku.supabase.co/storage/v1/object/public/websiteassets/videos'.
const VIDEO_BASE = '/media/ritual-videos';

export const ritualVideos: { id: string; src?: string; poster: string }[] = [
  { id: 'ritual-left', src: `${VIDEO_BASE}/ritual-left.mp4`, poster: `${VIDEO_BASE}/ritual-left.webp` },
  { id: 'ritual-main', src: `${VIDEO_BASE}/ritual-main.mp4`, poster: `${VIDEO_BASE}/ritual-main.webp` },
  { id: 'ritual-right', src: `${VIDEO_BASE}/ritual-right.mp4`, poster: `${VIDEO_BASE}/ritual-right.webp` },
];

// The middle one, in front when the carousel first shows.
export const MAIN_VIDEO = 1;

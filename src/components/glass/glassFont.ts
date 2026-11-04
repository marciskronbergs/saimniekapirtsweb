import { useEffect, useState } from 'react';

// The glass lettering's typeface (see GlassTitle.tsx).

export const GLASS_FONT = '"Saira Extra Condensed", "Arial Narrow", sans-serif';
const GLASS_FONT_HREF = 'https://fonts.googleapis.com/css2?family=Saira+Extra+Condensed:wght@800&display=swap';
// The hero adds the same stylesheet under this id; it is loaded once.
const GLASS_FONT_LINK_ID = 'hero-title-font';

// Changes whenever the title's typeface may have arrived, so text measured in
// the fallback face is measured again in the real one.
export function useGlassFont(): number {
  const [version, setVersion] = useState(0);
  useEffect(() => {
    let link = document.getElementById(GLASS_FONT_LINK_ID) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.id = GLASS_FONT_LINK_ID;
      link.rel = 'stylesheet';
      link.href = GLASS_FONT_HREF;
      document.head.appendChild(link);
    }
    let cancelled = false;
    const bump = () => {
      if (!cancelled) setVersion((v) => v + 1);
    };
    const fonts = document.fonts;
    const measureInFace = () => {
      fonts?.load('800 100px "Saira Extra Condensed"').catch(() => undefined).then(bump);
    };
    link.addEventListener('load', measureInFace);
    fonts?.addEventListener?.('loadingdone', bump);
    measureInFace();
    return () => {
      cancelled = true;
      link?.removeEventListener('load', measureInFace);
      fonts?.removeEventListener?.('loadingdone', bump);
    };
  }, []);
  return version;
}

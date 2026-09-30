import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin } from 'lucide-react';
import { saveConsent } from '../../lib/consent';
import { useCookieConsent } from '../../hooks/useCookieConsent';

const EMBED_URL =
  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2175.8234567890123!2d24.2903839!3d56.6841314!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x46e8d7c87772959d:0xdc371260f63bdc6b!2sSaimniekapirts%20%26%20SarmaSpa%20-%20pirts%20un%20pirtnieka%20pakalpojumi!5e0!3m2!1sen!2slv!4v1234567890123!5m2!1sen!2slv';
const MAPS_URL = 'https://www.google.com/maps/search/?api=1&query=56.6841314,24.2903839';

/**
 * The Google map sets Google's marketing cookies, so it only loads once
 * marketing cookies are allowed, or when the visitor asks for it this once.
 */
const ConsentGatedMap: React.FC<{ height: number | string }> = ({ height }) => {
  const { t } = useTranslation('common');
  const consent = useCookieConsent();
  const [loadOnce, setLoadOnce] = useState(false);

  if (consent?.marketing || loadOnce) {
    return (
      <iframe
        src={EMBED_URL}
        width="100%"
        height={height}
        style={{ border: 0 }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title="SaimniekaPirts Location"
      ></iframe>
    );
  }

  return (
    <div
      className="flex w-full flex-col items-center justify-center gap-3 bg-[#132d13] px-6 py-8 text-center"
      style={{ height }}
    >
      <MapPin className="h-8 w-8 text-green-400" aria-hidden="true" />
      <p className="font-semibold text-white">{t('cookies.embed.title')}</p>
      <p className="max-w-sm text-sm leading-relaxed text-gray-300">{t('cookies.embed.text')}</p>
      <div className="flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={() => setLoadOnce(true)}
          className="min-h-[40px] rounded-full bg-gradient-to-r from-green-500 to-lime-500 px-4 py-2 text-sm font-semibold text-black hover:from-green-400 hover:to-lime-400"
        >
          {t('cookies.embed.loadOnce')}
        </button>
        <button
          type="button"
          onClick={() =>
            saveConsent(
              {
                preferences: consent?.preferences ?? false,
                statistics: consent?.statistics ?? false,
                marketing: true,
              },
              'custom',
            )
          }
          className="min-h-[40px] rounded-full border border-white/25 px-4 py-2 text-sm font-semibold text-white hover:border-green-400 hover:text-green-300"
        >
          {t('cookies.embed.allow')}
        </button>
      </div>
      <a
        href={MAPS_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-green-400 underline underline-offset-2 hover:text-green-300"
      >
        {t('cookies.embed.openInMaps')}
      </a>
    </div>
  );
};

export default ConsentGatedMap;

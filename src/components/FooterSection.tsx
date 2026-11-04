import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { openCookieSettings } from '../lib/consent';
import BrandIcon, { type Brand } from './BrandIcon';

const FooterSection = () => {
  const { t } = useTranslation('footer');
  const location = useLocation();
  // A new page opens at its top by itself (ScrollToTop in App.tsx); a link
  // to the page already open goes back up to its top instead of doing nothing.
  const toTopIfHere = (path: string) => () => {
    if (location.pathname === path) window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const pakalpojumiLinks = [
    { name: t('services.rituals'), path: '/pirts-rituali' },
    { name: t('services.rental'), path: '/pirts-noma' },
    { name: t('services.experiences'), path: '/ipasiie-piedzivvojumi' },
    { name: t('services.accommodation'), path: '/naksnosana' }
  ];

  const rezervetLinks = [
    { name: t('booking.reserve'), path: '/rezervet' },
    { name: t('booking.giftCards'), path: '/davanu-kartes' }
  ];

  const polisesLinks = [
    { name: t('policies.faq'), path: '/biezak-uzdotie-jautajumi' },
    { name: t('policies.privacy'), path: '#' },
    { name: t('policies.rules'), path: '/ieksejas-kartibas-noteikumi' }
  ];

  // Each network's mark, lit in its own colour on hover.
  const socialLinks: { brand: Brand; href: string; label: string; hover: string }[] = [
    {
      brand: 'facebook',
      href: 'https://www.facebook.com/SarmaspaSaimniekapirts/?locale=lv_LV',
      label: 'Facebook',
      hover: 'hover:bg-[#0866FF] hover:ring-[#0866FF] hover:shadow-[0_10px_28px_-8px_#0866FF]'
    },
    {
      brand: 'youtube',
      href: 'https://www.youtube.com/@SaimniekaPirts',
      label: 'YouTube',
      hover: 'hover:bg-[#FF0000] hover:ring-[#FF0000] hover:shadow-[0_10px_28px_-8px_#FF0000]'
    },
    {
      brand: 'instagram',
      href: 'https://www.instagram.com/saimniekapirts/',
      label: 'Instagram',
      hover: 'hover:bg-[linear-gradient(45deg,#F58529,#DD2A7B_50%,#8134AF_80%,#515BD4)] hover:ring-[#DD2A7B] hover:shadow-[0_10px_28px_-8px_#DD2A7B]'
    },
    {
      brand: 'tiktok',
      href: 'https://www.tiktok.com/@saimniekapirts',
      label: 'TikTok',
      hover: 'hover:bg-black hover:ring-white/40 hover:shadow-[-3px_-3px_0_-1px_#25F4EE,3px_3px_0_-1px_#FE2C55]'
    }
  ];

  return (
    // Solid and above what comes before it: the moss scene's ledge hangs past
    // its own foot (GiftCardBuySection on the rituals and rental pages).
    <footer className="relative z-20 flow-root bg-[#0a0a0a]">
      {/* Main Footer Content with proper mobile spacing */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10 mt-12 sm:mt-16 lg:mt-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 sm:gap-8 lg:gap-12">
          
          {/* Column 1: Logo + Description */}
          <div className="text-left sm:col-span-2 lg:col-span-1">
            <div className="mb-4 sm:mb-6">
              <Link
                to="/"
                onClick={toTopIfHere('/')}
                className="block mb-4 hover:opacity-80 transition-opacity duration-300"
              >
                <img
                  src="https://wigoyeorqnssgbrgexku.supabase.co/storage/v1/object/public/websiteassets/logo/logoTitle.png"
                  alt="SaimniekaPirts"
                  className="h-10 sm:h-12"
                />
              </Link>
              <p className="text-white font-light leading-snug text-sm sm:text-base">
                {t('tagline')}
              </p>
            </div>
          </div>

          {/* Column 2: Pakalpojumi */}
          <div className="text-left">
            <h4 className="text-white font-bold mb-4 sm:mb-6 text-base sm:text-lg">{t('sections.services')}</h4>
            <ul className="space-y-2 sm:space-y-3">
              {pakalpojumiLinks.map((link, index) => (
                <li key={index}>
                  <Link
                    to={link.path}
                    onClick={toTopIfHere(link.path)}
                    className="text-gray-300 hover:text-green-400 transition-colors duration-300 text-sm sm:text-base text-left"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Rezervēt */}
          <div className="text-left">
            <h4 className="text-white font-bold mb-4 sm:mb-6 text-base sm:text-lg">{t('sections.booking')}</h4>
            <ul className="space-y-2 sm:space-y-3">
              {rezervetLinks.map((link, index) => (
                <li key={index}>
                  <Link
                    to={link.path}
                    onClick={toTopIfHere(link.path)}
                    className="text-gray-300 hover:text-green-400 transition-colors duration-300 text-sm sm:text-base text-left"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Polises - FIXED NAVIGATION */}
          <div className="text-left">
            <h4 className="text-white font-bold mb-4 sm:mb-6 text-base sm:text-lg">{t('sections.policies')}</h4>
            <ul className="space-y-2 sm:space-y-3">
              {polisesLinks.map((link, index) => (
                <li key={index}>
                  {link.path === '#' ? (
                    <Link
                      to="/privatuma-politika"
                      className="text-gray-300 hover:text-green-400 transition-colors duration-300 text-sm sm:text-base"
                      onClick={toTopIfHere('/privatuma-politika')}
                    >
                      {link.name}
                    </Link>
                  ) : (
                    <Link
                      to={link.path}
                      className="text-gray-300 hover:text-green-400 transition-colors duration-300 text-sm sm:text-base"
                      onClick={toTopIfHere(link.path)}
                    >
                      {link.name}
                    </Link>
                  )}
                </li>
              ))}
              <li>
                <button
                  type="button"
                  onClick={openCookieSettings}
                  className="tap-area text-gray-300 hover:text-green-400 transition-colors duration-300 text-sm sm:text-base text-left"
                >
                  {t('cookies.footerLink', { ns: 'common' })}
                </button>
              </li>
            </ul>
          </div>

          {/* Column 5: Social Icons */}
          <div className="text-left sm:col-span-2 lg:col-span-1">
            <h4 className="text-white font-bold mb-4 sm:mb-6 text-base sm:text-lg">{t('sections.social')}</h4>
            <div className="flex gap-2.5 sm:gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.brand}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Follow us on ${social.label}`}
                  title={social.label}
                  className={`flex h-11 w-11 items-center justify-center rounded-full bg-white/[0.06] text-white/80 ring-1 ring-white/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-green-300 ${social.hover}`}
                >
                  <BrandIcon brand={social.brand} className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        {/* Room under the copyright line on phones for the floating Rezervēt button. */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 pb-24 sm:py-6">
          <div className="text-center">
            <p className="text-gray-500 text-xs sm:text-sm">
              {t('copyright')}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;
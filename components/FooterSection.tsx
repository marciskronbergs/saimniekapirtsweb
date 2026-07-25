import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Facebook, Instagram, Youtube } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// Custom TikTok Icon Component
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-2.08v5.73a3.87 3.87 0 01-3.87 3.87 3.87 3.87 0 01-3.87-3.87 3.87 3.87 0 013.87-3.87c.21 0 .42.01.62.05V1.83c-.2-.02-.4-.03-.62-.03A5.94 5.94 0 003.93 7.74a5.94 5.94 0 005.94 5.94 5.94 5.94 0 005.94-5.94V9.35a6.7 6.7 0 003.92 1.26V8.84c-1.05 0-2.05-.43-2.76-1.15z"/>
  </svg>
);

const FooterSection = () => {
  const navigate = useNavigate();
  const { t } = useTranslation('footer');

  const handlePolicyLinkClick = (path: string) => {
    navigate(path);
    // Use setTimeout to ensure navigation completes before scrolling
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  const handleRegularLinkClick = (path: string) => {
    navigate(path);
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
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
    { name: t('policies.privacy'), path: '#' },
    { name: t('policies.rules'), path: '/ieksejas-kartibas-noteikumi' }
  ];

  const socialLinks = [
    { 
      icon: Facebook, 
      href: 'https://www.facebook.com/SarmaspaSaimniekapirts/?locale=lv_LV', 
      label: 'Facebook', 
      color: 'hover:text-blue-400' 
    },
    { 
      icon: Youtube, 
      href: 'https://www.youtube.com/@SaimniekaPirts', 
      label: 'YouTube', 
      color: 'hover:text-red-400' 
    },
    { 
      icon: Instagram, 
      href: 'https://www.instagram.com/saimniekapirts/', 
      label: 'Instagram', 
      color: 'hover:text-pink-400' 
    },
    { 
      icon: TikTokIcon,
      href: 'https://www.tiktok.com/@saimniekapirts', 
      label: 'TikTok', 
      color: 'hover:text-white' 
    }
  ];

  return (
    <footer className="bg-[#0a0a0a]">
      {/* Main Footer Content with proper mobile spacing */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10 mt-12 sm:mt-16 lg:mt-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 sm:gap-8 lg:gap-12">
          
          {/* Column 1: Logo + Description */}
          <div className="text-left sm:col-span-2 lg:col-span-1">
            <div className="mb-4 sm:mb-6">
              <button
                onClick={() => handleRegularLinkClick('/')}
                className="block mb-4 hover:opacity-80 transition-opacity duration-300"
              >
                <img
                  src="https://wigoyeorqnssgbrgexku.supabase.co/storage/v1/object/public/websiteassets/logo/logoTitle.png"
                  alt="SaimniekaPirts"
                  className="h-10 sm:h-12"
                />
              </button>
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
                  <button
                    onClick={() => handleRegularLinkClick(link.path)}
                    className="text-gray-300 hover:text-green-400 transition-colors duration-300 text-sm sm:text-base text-left"
                  >
                    {link.name}
                  </button>
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
                  <button
                    onClick={() => handleRegularLinkClick(link.path)}
                    className="text-gray-300 hover:text-green-400 transition-colors duration-300 text-sm sm:text-base text-left"
                  >
                    {link.name}
                  </button>
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
                      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    >
                      {link.name}
                    </Link>
                  ) : (
                    <Link
                      to={link.path}
                      className="text-gray-300 hover:text-green-400 transition-colors duration-300 text-sm sm:text-base"
                      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    >
                      {link.name}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Column 5: Social Icons */}
          <div className="text-left sm:col-span-2 lg:col-span-1">
            <h4 className="text-white font-bold mb-4 sm:mb-6 text-base sm:text-lg">{t('sections.social')}</h4>
            <div className="flex gap-2 sm:gap-3">
              {socialLinks.map((social, index) => {
                const IconComponent = social.icon;
                return (
                  <a
                    key={index}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Follow us on ${social.label}`}
                    className={`w-9 h-9 sm:w-10 sm:h-10 bg-gray-800 rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg text-gray-400 ${social.color}`}
                  >
                    <IconComponent className="w-4 h-4 sm:w-5 sm:h-5" />
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
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
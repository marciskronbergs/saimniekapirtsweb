import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Phone, MessageCircle, Menu, X, ChevronDown, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const HeaderSection = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  const location = useLocation();
  const { t, i18n } = useTranslation('navbar');

  const currentLanguage = i18n.language.toUpperCase();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu and language dropdown on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsLanguageDropdownOpen(false);
  }, [location.pathname]);

  // Close language dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.language-selector')) {
        setIsLanguageDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = [
    { name: t('rituali'), path: '/pirts-rituali' },
    { name: t('noma'), path: '/pirts-noma' },
    { name: t('ipasiie'), path: '/ipasiie-piedzivvojumi', submenu: [
      { name: t('vecmeitas'), path: '/vecmeitas-purs' },
      { name: t('viru'), path: '/viru-paka' }
    ]},
    { name: t('naksnosana'), path: '/naksnosana' },
    { name: t('karte'), path: '/davanu-kartes' },
    { name: t('rezervet'), path: '/rezervet' }
  ];

  const handleNavClick = () => {
    setIsMobileMenuOpen(false);
  };

  const handleLanguageChange = async (languageCode: string) => {
    i18n.changeLanguage(languageCode);
    
    // Update SEO when language changes
    const { seoManager } = await import('../utils/seoManager');
    seoManager.updateSEO(location.pathname, languageCode as 'lv' | 'en');
    
    setIsLanguageDropdownOpen(false);
  };

  const handleReviewsClick = () => {
    window.open('https://www.google.com/search?sca_esv=6bb957c311c6c09a&tbm=lcl&q=Saimniekapirts+%26+SarmaSpa+-+pirts+un+pirtnieka+pakalpojumi+Atsauksmes&rflfq=1&num=20&stick=H4sIAAAAAAAAAONgkxIxNLUwszA0NzIwtAQSpoYGpuaGGxgZXzG6Bidm5uZlpmYnFmQWlRQrqCkEJxblJgYXJCroKkCESvPADLAihYLE7MScgvys0txMBceS4sTS7OLc1OJFrNQxBwC9YRmBqwAAAA&rldimm=15868172019720510571&hl=lv-LV&sa=X&ved=2ahUKEwj8j62u3_yNAxVLFBAIHZ4DHp0Q9fQKegQISBAF&biw=1536&bih=695&dpr=1.25#lkt=LocalPoiReviews', '_blank', 'noopener,noreferrer');
  };

  return (
    <header className="fixed w-full top-0 z-50 bg-black transition-all duration-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3 h-18">
          {/* Logo - Far Left */}
          <div className="flex-shrink-0 -ml-2">
            <Link to="/" className="flex items-center" onClick={handleNavClick}>
              <img
                src="https://wigoyeorqnssgbrgexku.supabase.co/storage/v1/object/public/websiteassets/logo/logoTitle.png"
                alt="SaimniekaPirts"
                className="h-11 w-auto"
              />
            </Link>
          </div>

          {/* Language Selector - Between Logo and Nav */}
          <div className="hidden lg:flex items-center ml-6">
            <div className="language-selector relative">
              <button
                onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-all duration-300 hover:shadow-[0_0_12px_rgba(34,197,94,0.3)] border border-gray-700/50 hover:border-green-500/30"
              >
                <Globe className="w-4 h-4 text-green-400" />
                <span className="text-white font-medium text-sm">{currentLanguage}</span>
                <ChevronDown className={`w-4 h-4 text-green-400 transition-transform duration-300 ${
                  isLanguageDropdownOpen ? 'rotate-180' : ''
                }`} />
              </button>

              {/* Language Dropdown */}
              {isLanguageDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-24 bg-black/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-700/50 overflow-hidden z-50">
                  <button
                    onClick={() => handleLanguageChange('lv')}
                    className={`w-full px-4 py-3 text-left text-sm transition-all duration-200 hover:bg-green-600/20 hover:text-green-400 ${
                      i18n.language === 'lv' ? 'text-green-400 bg-green-600/10' : 'text-white'
                    }`}
                  >
                    LV
                  </button>
                  <button
                    onClick={() => handleLanguageChange('en')}
                    className={`w-full px-4 py-3 text-left text-sm transition-all duration-200 hover:bg-green-600/20 hover:text-green-400 ${
                      i18n.language === 'en' ? 'text-green-400 bg-green-600/10' : 'text-white'
                    }`}
                  >
                    EN
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Desktop Navigation - Centered */}
          <nav className="hidden lg:flex items-center justify-center flex-1 mx-6">
            <div className="flex items-center gap-x-6">
              {navItems.map((item, index) => (
                <div key={index} className="relative group">
                  <Link
                    to={item.path}
                    className={`font-medium hover:text-green-400 hover:underline underline-offset-8 decoration-green-400 transition-all duration-200 text-sm whitespace-nowrap ${
                      location.pathname === item.path || 
                      (item.submenu && item.submenu.some(sub => location.pathname === sub.path))
                        ? 'text-green-400 underline' 
                        : 'text-white'
                    }`}
                  >
                    {item.name}
                  </Link>
                  
                  {/* Dropdown Menu */}
                  {item.submenu && (
                    <div className="absolute top-full left-0 mt-2 w-48 bg-black/95 backdrop-blur-sm rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
                      <div className="py-2">
                        {item.submenu.map((subItem, subIndex) => (
                          <Link
                            key={subIndex}
                            to={subItem.path}
                            className={`block px-4 py-2 text-sm hover:text-green-400 hover:bg-green-400/10 transition-all duration-200 ${
                              location.pathname === subItem.path 
                                ? 'text-green-400 bg-green-400/10' 
                                : 'text-white'
                            }`}
                          >
                            {subItem.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </nav>

          {/* Action Buttons - Far Right */}
          <div className="hidden lg:flex items-center ml-auto gap-x-3">
            {/* Phone Number Button - Clickable Tel Link */}
            <a 
              href="tel:+37126752661"
              className="flex items-center space-x-2 bg-[#14532d] text-white px-3 py-2 rounded-md hover:bg-[#166534] transition-all duration-200 font-medium whitespace-nowrap"
            >
              <Phone className="w-4 h-4" />
              <span className="text-sm">{t('telefons')}</span>
            </a>
            
            {/* Atsauksmes Button - Opens Google Reviews */}
            <button 
              onClick={handleReviewsClick}
              className="flex items-center space-x-2 border-2 border-[#4ade80] text-[#4ade80] bg-transparent hover:shadow-[0_0_12px_rgba(74,222,128,0.6)] hover:scale-105 transition-all duration-300 ease-in-out rounded-lg px-4 py-2 font-bold whitespace-nowrap"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="text-sm">{t('atsauksmes')}</span>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-white hover:text-green-400 transition-colors duration-300"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-black border-t border-gray-800/30">
            <div className="px-4 py-6 space-y-4">
              {/* Mobile Language Selector */}
              <div className="mb-6">
                <div className="language-selector relative">
                  <button
                    onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-all duration-300 hover:shadow-[0_0_12px_rgba(34,197,94,0.3)] border border-gray-700/50 hover:border-green-500/30"
                  >
                    <Globe className="w-4 h-4 text-green-400" />
                    <span className="text-white font-medium text-sm">{currentLanguage}</span>
                    <ChevronDown className={`w-4 h-4 text-green-400 transition-transform duration-300 ${
                      isLanguageDropdownOpen ? 'rotate-180' : ''
                    }`} />
                  </button>

                  {/* Mobile Language Dropdown */}
                  {isLanguageDropdownOpen && (
                    <div className="absolute top-full left-0 mt-2 w-24 bg-black/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-700/50 overflow-hidden z-50">
                      <button
                        onClick={() => handleLanguageChange('lv')}
                        className={`w-full px-4 py-3 text-left text-sm transition-all duration-200 hover:bg-green-600/20 hover:text-green-400 ${
                          i18n.language === 'lv' ? 'text-green-400 bg-green-600/10' : 'text-white'
                        }`}
                      >
                        LV
                      </button>
                      <button
                        onClick={() => handleLanguageChange('en')}
                        className={`w-full px-4 py-3 text-left text-sm transition-all duration-200 hover:bg-green-600/20 hover:text-green-400 ${
                          i18n.language === 'en' ? 'text-green-400 bg-green-600/10' : 'text-white'
                        }`}
                      >
                        EN
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Mobile Navigation Items */}
              {navItems.map((item, index) => (
                <div key={index}>
                  <Link
                    to={item.path}
                    className={`block hover:text-green-400 transition-colors duration-300 py-2 text-lg font-medium ${
                      location.pathname === item.path || 
                      (item.submenu && item.submenu.some(sub => location.pathname === sub.path))
                        ? 'text-green-400' 
                        : 'text-white'
                    }`}
                    onClick={handleNavClick}
                  >
                    {item.name}
                  </Link>
                  
                  {/* Mobile Submenu */}
                  {item.submenu && (
                    <div className="ml-4 mt-2 space-y-2">
                      {item.submenu.map((subItem, subIndex) => (
                        <Link
                          key={subIndex}
                          to={subItem.path}
                          className={`block hover:text-green-400 transition-colors duration-300 py-1 text-base ${
                            location.pathname === subItem.path 
                              ? 'text-green-400' 
                              : 'text-gray-300'
                          }`}
                          onClick={handleNavClick}
                        >
                          {subItem.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Mobile Action Buttons */}
              <div className="pt-4 space-y-3">
                <a 
                  href="tel:+37126752661"
                  className="w-full flex items-center justify-center space-x-2 bg-[#14532d] text-white px-4 py-3 rounded-md hover:bg-[#166534] transition-all duration-200 font-medium"
                >
                  <Phone className="w-4 h-4" />
                  <span>{t('telefons')}</span>
                </a>
                <button 
                  onClick={handleReviewsClick}
                  className="w-full flex items-center justify-center space-x-2 border-2 border-[#4ade80] text-[#4ade80] bg-transparent hover:shadow-[0_0_12px_rgba(74,222,128,0.6)] hover:scale-105 transition-all duration-300 ease-in-out rounded-lg px-4 py-3 font-bold"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>{t('atsauksmes')}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default HeaderSection;
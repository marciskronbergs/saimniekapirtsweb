import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const RitualExperience = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const { t } = useTranslation('rituali');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Initialize card refs array
  useEffect(() => {
    cardRefs.current = cardRefs.current.slice(0, ritualSteps.length);
  }, []);

  // Handle step button click - works for both desktop and mobile
  const handleStepClick = (stepIndex: number) => {
    if (isScrolling) return;
    
    setIsScrolling(true);
    setActiveStep(stepIndex);

    // On mobile: just change the active step, no scrolling
    if (isMobile) {
      setTimeout(() => {
        setIsScrolling(false);
      }, 300);
      return;
    }

    // Desktop: Scroll the corresponding card into view
    const targetCard = cardRefs.current[stepIndex];
    if (targetCard && carouselRef.current) {
      targetCard.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    }

    // Reset scrolling flag after animation
    setTimeout(() => {
      setIsScrolling(false);
    }, 800);
  };

  // Track scroll position and update active step - DESKTOP ONLY
  useEffect(() => {
    if (!carouselRef.current || isMobile) return;

    const carousel = carouselRef.current;
    let scrollTimeout: NodeJS.Timeout;

    const handleScroll = () => {
      if (isScrolling) return;

      // Clear previous timeout
      clearTimeout(scrollTimeout);

      // Set a timeout to check which card is most visible after scrolling stops
      scrollTimeout = setTimeout(() => {
        const carouselRect = carousel.getBoundingClientRect();
        const carouselCenter = carouselRect.left + carouselRect.width / 2;
        
        let closestIndex = 0;
        let closestDistance = Infinity;

        cardRefs.current.forEach((card, index) => {
          if (card) {
            const cardRect = card.getBoundingClientRect();
            const cardCenter = cardRect.left + cardRect.width / 2;
            const distance = Math.abs(cardCenter - carouselCenter);
            
            if (distance < closestDistance) {
              closestDistance = distance;
              closestIndex = index;
            }
          }
        });

        if (closestIndex !== activeStep) {
          setActiveStep(closestIndex);
        }
      }, 150);
    };

    carousel.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      carousel.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [activeStep, isScrolling, isMobile]);

  const images = [
    'https://wigoyeorqnssgbrgexku.supabase.co/storage/v1/object/public/websiteassets/bildes/30.png',
    'https://wigoyeorqnssgbrgexku.supabase.co/storage/v1/object/public/websiteassets/bildes/6.png',
    'https://wigoyeorqnssgbrgexku.supabase.co/storage/v1/object/public/websiteassets/bildes/2.png',
    'https://wigoyeorqnssgbrgexku.supabase.co/storage/v1/object/public/websiteassets/bildes/47.png',
    'https://wigoyeorqnssgbrgexku.supabase.co/storage/v1/object/public/websiteassets/bildes/71.png',
    'https://wigoyeorqnssgbrgexku.supabase.co/storage/v1/object/public/websiteassets/bildes/72.png',
    'https://wigoyeorqnssgbrgexku.supabase.co/storage/v1/object/public/websiteassets/bildes/73.png'
  ];

  const ritualSteps = t('experience.steps', { returnObjects: true }) as Array<{
    title: string;
    description: string;
  }>;

  // Handle card click - DESKTOP ONLY
  const handleCardClick = (stepIndex: number) => {
    if (!isMobile) {
      handleStepClick(stepIndex);
    }
  };

  return (
    <section 
      ref={sectionRef}
      className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 max-w-7xl mx-auto overflow-x-hidden w-full"
    >
      <div className={`transform transition-all duration-1000 ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
      }`}>
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6 sm:mb-8">
            {t('experience.title')}
          </h2>
          <p className="text-lg sm:text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed px-4">
            {t('experience.subtitle')}
          </p>
        </div>
        <div className="relative overflow-x-hidden w-full">
          {/* Timeline Step Selector - Fixed Mobile Overflow */}
          <div className="flex justify-center mb-8 w-full">
            <div className="bg-[#132d13] rounded-xl sm:rounded-2xl p-2 sm:p-3 lg:p-4 w-full max-w-full overflow-x-auto">
              <div className="flex gap-2 sm:gap-3 md:gap-4 px-2 sm:px-4 md:px-6 justify-between w-full max-w-7xl mx-auto">
                {ritualSteps.map((step, index) => (
                  <button
                    key={index}
                    onClick={() => handleStepClick(index)}
                   className={`flex flex-col items-center px-4 sm:px-3 lg:px-3 py-2 sm:py-3 
rounded-lg sm:rounded-xl font-semibold transition-all duration-300 whitespace-nowrap 
w-auto sm:min-w-[80px] lg:min-w-[100px] relative overflow-hidden group ${
  activeStep === index
    ? 'bg-green-600 text-white shadow-lg shadow-green-500/25 scale-105 transform'
    : 'text-gray-300 hover:text-white hover:bg-gray-700/50 hover:scale-102 transform'
}`}
                  >
                    {/* Glowing background effect for active tab */}
                    {activeStep === index && (
                      <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 via-green-500/30 to-green-600/20 animate-pulse"></div>
                    )}
                    
                    {/* Hover glow effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-green-400/0 via-green-500/10 to-green-600/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    
                    <div className="relative z-10">
  <span className={`text-sm sm:text-base lg:text-xl font-bold block ${
    activeStep === index ? 'text-white' : 'text-green-400'
  }`}>
    {index + 1}.
  </span>
  <span className="hidden sm:inline text-xs text-center leading-tight">
    {step.title}
  </span>
</div>

                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile: Single Card Display - Fixed Width */}
        {isMobile && (
          <div className="flex justify-center mb-8 px-2 sm:px-4">
            <div className="w-full max-w-[320px] sm:max-w-[340px] mx-auto">
              <div className="bg-[#132d13] rounded-xl overflow-hidden shadow-2xl shadow-green-500/20 ring-2 ring-green-500">
                {/* Image with Step Number Overlay */}
                <div className="relative">
                  <img
                    src={images[activeStep]}
                    alt={ritualSteps[activeStep].title}
                    className="w-full h-40 sm:h-48 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  
                  {/* Step Number Badge - Top Left */}
                  <div className="absolute top-3 left-3 sm:top-4 sm:left-4">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-base sm:text-lg bg-green-500 text-white">
                      {activeStep + 1}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 sm:p-6">
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">
                    {ritualSteps[activeStep].title}
                  </h3>
                  <p className="text-gray-300 leading-relaxed text-sm">
                    {ritualSteps[activeStep].description}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Desktop: Horizontal Carousel */}
        {!isMobile && (
          <div className="relative overflow-x-hidden w-full">
            <div 
              ref={carouselRef}
              className="flex gap-4 lg:gap-6 pb-4 transition-transform duration-500 ease-out max-w-full w-full overflow-x-auto scrollbar-hide scroll-smooth px-2"
              style={{ scrollSnapType: 'x mandatory' }}
            >
              {ritualSteps.map((step, index) => (
                <div
                  key={index}
                  ref={el => cardRefs.current[index] = el}
                  className={`flex-shrink-0 w-[280px] lg:w-[320px] xl:w-[360px] bg-[#132d13] rounded-2xl overflow-hidden transition-all duration-500 cursor-pointer ${
                    activeStep === index 
                      ? 'scale-105 shadow-2xl shadow-green-500/20 ring-2 ring-green-500' 
                      : 'opacity-70 hover:opacity-90'
                  }`}
                  style={{ scrollSnapAlign: 'center' }}
                  onClick={() => handleCardClick(index)}
                >
                  {/* Image with Step Number Overlay */}
                  <div className="relative">
                    <img
                      src={images[index]}
                      alt={step.title}
                      className="w-full h-40 lg:h-48 object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    
                    {/* Step Number Badge - Top Left */}
                    <div className="absolute top-3 left-3 lg:top-4 lg:left-4">
                      <div className={`w-8 h-8 lg:w-10 lg:h-10 rounded-full flex items-center justify-center font-bold text-base lg:text-lg ${
                        activeStep === index ? 'bg-green-500 text-white' : 'bg-black/70 text-green-400'
                      }`}>
                        {index + 1}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 lg:p-6">
                    <h3 className="text-lg lg:text-xl font-bold text-white mb-3 lg:mb-4">
                      {step.title}
                    </h3>
                    <p className="text-gray-300 leading-relaxed text-xs lg:text-sm">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA Button */}
        <div className="text-center mt-8 sm:mt-12 px-2 sm:px-4">
          <button 
            onClick={() => (window as any).openCustomPopup?.('ritual')}
            className="w-full sm:w-auto bg-green-600 hover:bg-green-500 text-white px-8 sm:px-12 py-4 rounded-xl text-base sm:text-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-green-500/25 cursor-pointer"
          >
            {t('experience.cta')}
          </button>
        </div>
      </div>

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
};

export default RitualExperience;
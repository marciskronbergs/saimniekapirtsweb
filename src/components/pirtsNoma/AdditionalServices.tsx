import React, { useEffect, useRef, useState } from 'react';
import { Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const AdditionalServices = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentImageIndices, setCurrentImageIndices] = useState<number[]>([0, 0]);
  const [isMobile, setIsMobile] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation('noma');

  useEffect(() => {
    // Check if mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);

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

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Auto-rotation for desktop
  useEffect(() => {
    if (!isMobile && isVisible) {
      const interval = setInterval(() => {
        setCurrentImageIndices(prev => 
          prev.map((currentIndex, serviceIndex) => 
            (currentIndex + 1) % services[serviceIndex].images.length
          )
        );
      }, 4000); // 4 seconds per image

      return () => clearInterval(interval);
    }
  }, [isMobile, isVisible]);

  const services = t('additionalServices.services', { returnObjects: true }).map((service: any, index: number) => ({
    ...service,
    bulletPoints: service.features,
    images: index === 0 ? [
      'https://wigoyeorqnssgbrgexku.supabase.co/storage/v1/object/public/websiteassets/bildes/43.png',
      'https://wigoyeorqnssgbrgexku.supabase.co/storage/v1/object/public/websiteassets/bildes/44.png'
    ] : [
      'https://wigoyeorqnssgbrgexku.supabase.co/storage/v1/object/public/websiteassets/bildes/46.png',
      'https://wigoyeorqnssgbrgexku.supabase.co/storage/v1/object/public/websiteassets/bildes/47.png'
    ]
  }));

  const handleTouchStart = (serviceIndex: number) => (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const startX = touch.clientX;
    
    const handleTouchMove = (moveEvent: TouchEvent) => {
      const currentTouch = moveEvent.touches[0];
      const diffX = startX - currentTouch.clientX;
      
      if (Math.abs(diffX) > 50) { // Minimum swipe distance
        setCurrentImageIndices(prev => {
          const newIndices = [...prev];
          const totalImages = services[serviceIndex].images.length;
          
          if (diffX > 0) {
            // Swipe left - next image
            newIndices[serviceIndex] = (newIndices[serviceIndex] + 1) % totalImages;
          } else {
            // Swipe right - previous image
            newIndices[serviceIndex] = (newIndices[serviceIndex] + totalImages - 1) % totalImages;
          }
          return newIndices;
        });
        
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      }
    };
    
    const handleTouchEnd = () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
    
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);
  };

  return (
    <section 
      ref={sectionRef}
      className="py-24 bg-black relative overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className={`text-center mb-16 transform transition-all duration-1000 ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
        }`}>
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-8">
            {t('additionalServices.title')}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {services.map((service, index) => (
            <div
              key={index}
              className={`bg-[#132d13] rounded-2xl overflow-hidden transform transition-all duration-1000 hover:scale-105 hover:shadow-2xl hover:shadow-green-500/20 ${
                isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
              }`}
              style={{ transitionDelay: `${index * 200}ms` }}
            >
              {/* Integrated Image Carousel */}
              <div 
                className="relative h-48 overflow-hidden"
                onTouchStart={isMobile ? handleTouchStart(index) : undefined}
              >
                {/* Images */}
                {service.images.map((image, imageIndex) => (
                  <div
                    key={imageIndex}
                    className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
                      imageIndex === currentImageIndices[index] 
                        ? 'opacity-100 scale-100' 
                        : 'opacity-0 scale-105'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${service.title} ${imageIndex + 1}`}
                      className="w-full h-full object-cover"
                      draggable={false}
                    />
                  </div>
                ))}
                
                {/* First image for layout */}
                <img
                  src={service.images[0]}
                  alt={service.title}
                  className="w-full h-full object-cover opacity-0"
                  draggable={false}
                />
                
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
              </div>

              {/* Content */}
              <div className="p-8">
                <div className="mb-6">
                  <div className="text-3xl font-bold text-green-400 mb-2">{service.price}</div>
                  <h3 className="text-2xl font-bold text-white mb-4">{service.title}</h3>
                </div>
                
                <p className="text-gray-300 leading-relaxed text-lg mb-6">
                  {service.description}
                </p>

                {/* Bullet Points */}
                <div className="space-y-3">
                  {service.bulletPoints.map((point, pointIndex) => (
                    <div key={pointIndex} className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-gray-300">{point}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AdditionalServices;
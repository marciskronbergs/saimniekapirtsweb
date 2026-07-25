import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const SaunaCards = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

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

  const saunas = [
    {
      title: 'Baltā Pirts',
      description: 'Pirts ar plašu telpu gan iekštelpās, gan ārā – ideāli piemērota lielākiem pasākumiem un draugu pulcēšanās reizēm. ',
      image: 'https://wigoyeorqnssgbrgexku.supabase.co/storage/v1/object/public/websiteassets/bildes/15.png'
    },
    {
      title: 'Pelēkā Pirts',
      description: 'Pirtnieka dizainēta pirts telpa, piemērotāka pieredzējušākiem pirts mīļiem, atsevišķā ēkā ar virtuvi.',
      image: 'https://wigoyeorqnssgbrgexku.supabase.co/storage/v1/object/public/websiteassets/bildes/23.png'
    }
  ];

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev + saunas.length - 1) % saunas.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % saunas.length);
  };

  return (
    <section 
      ref={sectionRef}
      className="py-24 bg-black relative overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className={`text-center mb-20 transform transition-all duration-1000 ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
        }`}>
          <h2 className="text-4xl lg:text-6xl font-bold text-white mb-8">
            Pirts Noma
          </h2>
        </div>

        {/* Carousel Container */}
        <div className="relative max-w-4xl mx-auto">
          <div className="overflow-hidden rounded-2xl">
            <div 
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {saunas.map((sauna, index) => (
                <div key={index} className="w-full flex-shrink-0">
                  <div className={`bg-[#132d13] rounded-2xl overflow-hidden transform transition-all duration-1000 ${
                    isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
                  }`} style={{ transitionDelay: `${index * 200}ms` }}>
                    {/* Image */}
                    <div className="relative h-64 md:h-80">
                      <img
                        src={sauna.image}
                        alt={sauna.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    </div>

                    {/* Content */}
                    <div className="p-8 text-center">
                      <h3 className="text-3xl font-bold text-white mb-6">
                        {sauna.title}
                      </h3>
                      
                      <p className="text-white leading-relaxed text-lg">
                        {sauna.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Arrows - Vertically Centered */}
          <button
            onClick={handlePrev}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-black/70 hover:bg-black/90 rounded-full flex items-center justify-center transition-all duration-300 z-10"
            aria-label="Previous sauna"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-black/70 hover:bg-black/90 rounded-full flex items-center justify-center transition-all duration-300 z-10"
            aria-label="Next sauna"
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>

          {/* Indicators */}
          <div className="flex justify-center gap-2 md:gap-3 mt-6">
            {saunas.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-8 h-8 md:w-3 md:h-3 rounded-full transition-all duration-300 cursor-pointer ${
                  index === currentIndex 
                    ? 'bg-green-500 shadow-lg shadow-green-500/50 scale-110 md:scale-125 ring-2 ring-white/30' 
                    : 'bg-gray-500 hover:bg-gray-400 border border-white/20'
                }`}
                aria-label={`Go to sauna ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default SaunaCards;
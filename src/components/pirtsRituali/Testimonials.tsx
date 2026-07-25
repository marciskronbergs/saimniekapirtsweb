import React, { useEffect, useRef, useState } from 'react';
import { TestimonialsColumn } from "../ui/testimonials-columns-1";
import { motion } from "framer-motion";
import { useTranslation } from 'react-i18next';

const Testimonials = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation('reviews');

  // Get reviews from translation and format them for the testimonials component
  const reviews = t('reviews', { returnObjects: true }) as Array<{
    text: string;
    author: string;
    source: string;
  }>;

  // Transform reviews to match the testimonials component format
  const testimonials = reviews.map(review => ({
    text: review.text,
    name: review.author,
    role: review.source,
    image: '' // Not used in current implementation
  }));

  // Split testimonials into three columns for better distribution
  const firstColumn = testimonials.slice(0, 9);
  const secondColumn = testimonials.slice(9, 18);
  const thirdColumn = testimonials.slice(18, 27);

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

  return (
    <section ref={sectionRef} className="bg-[#0a0a0a] py-12 sm:py-16 md:py-20 relative">
      <div className="container z-10 mx-auto px-4 sm:px-6 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
          className="flex flex-col items-center justify-center max-w-[540px] mx-auto"
        >
          <div className="flex justify-center">
            <div className="border border-green-600 py-2 px-4 sm:px-6 rounded-lg bg-green-600/10">
              <span className="text-green-400 font-semibold">{t('sectionTitle')}</span>
            </div>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold tracking-tighter mt-6 sm:mt-8 text-white text-center">
            {t('sectionTitle')}
          </h2>
          <p className="text-center mt-4 sm:mt-6 opacity-75 text-gray-300 text-sm sm:text-base lg:text-lg">
            {t('sectionSubtitle')}
          </p>
        </motion.div>

        <div className="flex justify-center gap-4 sm:gap-6 mt-12 sm:mt-16 [mask-image:linear-gradient(to_bottom,transparent,black_25%,black_75%,transparent)] max-h-[600px] sm:max-h-[740px] overflow-hidden">
          <TestimonialsColumn testimonials={firstColumn} duration={15} />
          <TestimonialsColumn testimonials={secondColumn} className="hidden md:block" duration={19} />
          <TestimonialsColumn testimonials={thirdColumn} className="hidden lg:block" duration={17} />
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
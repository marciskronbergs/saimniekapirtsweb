import { TestimonialsColumn } from '../ui/testimonials-columns-1';
import { useTranslation } from 'react-i18next';
import { SectionHeading } from './ritualUi';

// "Ko Saka Mūsu Pirts Mīļi": three columns of reviews drifting upwards at
// different speeds (one on phones, two on tablets), fading in and out at
// the top and bottom.

interface Review {
  text: string;
  author: string;
  source: string;
}

const Testimonials = () => {
  const { t } = useTranslation('reviews');
  const reviews = t('reviews', { returnObjects: true }) as Review[];
  const testimonials = reviews.map((review) => ({ text: review.text, name: review.author, role: review.source, image: '' }));

  return (
    <section aria-labelledby="reviews-heading" className="relative px-4 py-20 sm:px-6 sm:py-24 lg:py-28">
      <div className="mx-auto max-w-7xl">
        <SectionHeading id="reviews-heading" title={t('sectionTitle')} subtitle={t('sectionSubtitle')} />

        <div className="mt-12 flex max-h-[640px] justify-center gap-5 overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_18%,black_82%,transparent)] sm:mt-16 sm:max-h-[760px]">
          <TestimonialsColumn testimonials={testimonials.slice(0, 9)} duration={38} />
          <TestimonialsColumn testimonials={testimonials.slice(9, 18)} className="hidden md:block" duration={46} />
          <TestimonialsColumn testimonials={testimonials.slice(18, 27)} className="hidden lg:block" duration={42} />
        </div>
      </div>
    </section>
  );
};

export default Testimonials;

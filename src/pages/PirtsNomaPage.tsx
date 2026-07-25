import React from 'react';
import HeaderSection from '../components/HeaderSection';
import FooterSection from '../components/FooterSection';
import NomaHero from '../components/pirtsNoma/NomaHero';
import PirtsNomaSection from '../components/PirtsNomaSection';
import HerbTubs from '../components/pirtsNoma/HerbTubs';
import PricingCards from '../components/pirtsNoma/PricingCards';
import Testimonials from '../components/pirtsRituali/Testimonials';
import AdditionalServices from '../components/pirtsNoma/AdditionalServices';
import AccommodationSection from '../components/shared/AccommodationSection';
import GiftCardSection from '../components/shared/GiftCardSection';

const PirtsNomaPage = () => {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <HeaderSection />
      
      <main className="pt-20">
        <section>
          <NomaHero />
        </section>

        <section>
          <PirtsNomaSection />
        </section>

        <section>
          <HerbTubs />
        </section>

        <section>
          <PricingCards />
        </section>

        <section>
          <Testimonials />
        </section>

        <section>
          <AdditionalServices />
        </section>

        <section>
          <AccommodationSection />
        </section>

        <section>
          <GiftCardSection />
        </section>
      </main>

      <FooterSection />
    </div>
  );
};

export default PirtsNomaPage;
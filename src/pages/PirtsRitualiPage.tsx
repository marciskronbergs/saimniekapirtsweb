import React from 'react';
import HeaderSection from '../components/HeaderSection';
import FooterSection from '../components/FooterSection';
import RitualIntro from '../components/pirtsRituali/RitualIntro';
import RitualExperience from '../components/pirtsRituali/RitualExperience';
import PriceTable from '../components/pirtsRituali/PriceTable';
import GroupOptions from '../components/pirtsRituali/GroupOptions';
import SpecialExperience from '../components/pirtsRituali/SpecialExperience';
import SaunaHost from '../components/pirtsRituali/SaunaHost';
import Testimonials from '../components/pirtsRituali/Testimonials';
import AccommodationSection from '../components/shared/AccommodationSection';
import GiftCardSection from '../components/shared/GiftCardSection';

const PirtsRitualiPage = () => {
  return (
    <div className="min-h-screen bg-[#0a0a0a] overflow-x-hidden">
      <HeaderSection />
      
      <main className="pt-20 overflow-x-hidden">
        <section>
          <RitualIntro />
        </section>

        <section>
          <RitualExperience />
        </section>

        <section>
          <PriceTable />
        </section>

        <section>
          <GroupOptions />
        </section>

        <section>
          <SpecialExperience />
        </section>

        <section>
          <SaunaHost />
        </section>

        <section>
          <Testimonials />
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

export default PirtsRitualiPage;
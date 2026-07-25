import React from 'react';
import HeaderSection from './HeaderSection';
import HeroSection from './HeroSection';
import ServiceCardsSection from './ServiceCardsSection';
import VideoSection from './VideoSection';
import SpecialPackagesSection from './SpecialPackagesSection';
import RentalSaunasSection from './RentalSaunasSection';
import GiftCardSection from './GiftCardSection';
import LocationSection from './LocationSection';
import FooterSection from './FooterSection';

const HomePage = () => {
  return (
    <div className="min-h-screen bg-black">
      <HeaderSection />
      <HeroSection />
      <ServiceCardsSection />
      <VideoSection />
      <SpecialPackagesSection />
      <RentalSaunasSection />
      <GiftCardSection />
      <LocationSection />
      <FooterSection />
    </div>
  );
};

export default HomePage;
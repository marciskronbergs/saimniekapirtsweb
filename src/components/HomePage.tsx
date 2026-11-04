import React from 'react';
import HeaderSection from './HeaderSection';
import WhiskPosterHero from './hero/WhiskPosterHero';
import ServiceCardsSection from './ServiceCardsSection';
import VideoSection from './VideoSection';
import SpecialPackagesSection from './SpecialPackagesSection';
import LeafBackdrop from './leaves/LeafBackdrop';
import TubInterlude from './tubInterlude/TubInterlude';
import RentalSaunasSection from './RentalSaunasSection';
import GiftCardBuySection from './GiftCardBuySection';
import LocationSection from './LocationSection';
import FooterSection from './FooterSection';
import { WhiskSeam } from './whisks/WhiskAccent';

const HomePage = () => {
  return (
    <div className="min-h-screen bg-black">
      <HeaderSection />
      <WhiskPosterHero />
      {/* One drifting-leaves backdrop behind all three, so it flows through. */}
      {/* Hands with whisks come in from alternate sides down the page, the
          ones inside the leaves set behind the content (the leaves that sat
          where they come in are left out). */}
      <LeafBackdrop clear={[{ side: 'right', top: 19 }, { side: 'left', top: 50 }]}>
        <ServiceCardsSection />
        <WhiskSeam behind asset="oak-right" width="36vw" shiftY="-42%" rotate={3} phone={{ width: '58vw', shiftY: '-55%' }} />
        <VideoSection />
        <WhiskSeam behind asset="birch-left" width="31vw" shiftY="-48%" rotate={4} phone={{ width: '52vw', shiftY: '-60%' }} />
        <SpecialPackagesSection />
      </LeafBackdrop>
      {/* A maple whisk from the right, hanging into the rental scene's black. */}
      <WhiskSeam asset="maple-right" width="34vw" shiftY="-30%" rotate={2} phone={{ width: '56vw', shiftY: '-40%' }} />
      <TubInterlude scene="rental" />
      <RentalSaunasSection />
      {/* The gift cards over the zalktis on its mossy roots; the forest
          floor runs on under the way here. */}
      <GiftCardBuySection>
        {/* An oak whisk from the right, between the gift cards and the way here. */}
        <WhiskSeam asset="oak-right" width="31vw" shiftY="-18%" rotate={2} phone={{ width: '54vw' }} />
        <LocationSection onMoss />
      </GiftCardBuySection>
      <FooterSection />
    </div>
  );
};

export default HomePage;
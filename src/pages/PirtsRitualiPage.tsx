import { MotionConfig } from 'framer-motion';
import HeaderSection from '../components/HeaderSection';
import FooterSection from '../components/FooterSection';
import CinematicHero from '../components/hero/CinematicHero';
import RitualIntro from '../components/pirtsRituali/RitualIntro';
import RitualGalleryFlow from '../components/pirtsRituali/RitualGalleryFlow';
import TubInterlude from '../components/tubInterlude/TubInterlude';
import LeafBackdrop from '../components/leaves/LeafBackdrop';
import RitualExperience from '../components/pirtsRituali/RitualExperience';
import PriceTable from '../components/pirtsRituali/PriceTable';
import GroupOptions from '../components/pirtsRituali/GroupOptions';
import SpecialExperience from '../components/pirtsRituali/SpecialExperience';
import SaunaHost from '../components/pirtsRituali/SaunaHost';
import Testimonials from '../components/pirtsRituali/Testimonials';
import AccommodationSection from '../components/shared/AccommodationSection';
import GiftCardBuySection from '../components/GiftCardBuySection';
import { WhiskSeam } from '../components/whisks/WhiskAccent';

const PirtsRitualiPage = () => {
  // overflow-x-clip, not -hidden: hidden would turn these into scroll boxes
  // and stop the sticky stages (hero, ritual steps) from sticking. Motion
  // follows the visitor's reduced-motion setting throughout.
  return (
    <MotionConfig reducedMotion="user">
    <div className="min-h-screen bg-[#0a0a0a] overflow-x-clip">
      <HeaderSection />
      <CinematicHero />

      <main className="overflow-x-clip">
        {/* "Tradicionālais Pirts Rituāls" rises over the last of the hero
            while its stage is still held, as on the rental page: everything
            from here is pulled up into the hero's end, on a shade that
            deepens into the page's near-black. */}
        <div className="relative z-10 -mt-[16svh] lg:-mt-[32svh]">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-[28svh] lg:h-[44svh]"
            style={{ background: 'linear-gradient(180deg, rgba(10,10,10,0) 0%, rgba(10,10,10,0.5) 36%, rgba(10,10,10,0.86) 68%, #0a0a0a 100%)' }}
          />
          {/* The homepage's drifting leaves behind the ritual's story and its
              steps, one backdrop so they flow through the photo band too;
              see-through, so the hero shows behind the first words. */}
          <LeafBackdrop className="!overflow-clip !bg-transparent">
            {/* The leaves dissolve, and the page's near-black deepens into the
                tub scene's black, instead of stopping at a line. Under the
                content, so it never shades a button. */}
            <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-b from-transparent to-black" />
            <section>
              <RitualIntro />
            </section>

            <RitualGalleryFlow />

            <RitualExperience />
          </LeafBackdrop>
        </div>

        {/* The herbal tub, between the ritual's steps and its prices. */}
        <TubInterlude scene="tub" />

        <PriceTable />
        {/* A birch whisk from the left, beside the group rituals' heading. */}
        <WhiskSeam asset="birch-left" width="32vw" top="40px" shiftY="0%" rotate={3} phone={{ width: '46vw', top: '-48px' }} />
        {/* The leaves again under the prices, so the lower page drifts too;
            more hands with whisks come in from alternate sides, set behind
            the content. */}
        <LeafBackdrop className="!bg-transparent">
          <GroupOptions />
          <WhiskSeam behind asset="maple-right" width="35vw" shiftY="-45%" rotate={2} phone={{ width: '56vw', shiftY: '-60%' }} />
          <SpecialExperience />
          <SaunaHost />
          {/* An oak whisk from the right, beside the guests' words. */}
          <WhiskSeam asset="oak-right" width="30vw" shiftY="-34%" rotate={2} phone={{ width: '50vw', shiftY: '-50%' }} />
          <Testimonials />
          <WhiskSeam behind asset="maple-left" width="33vw" shiftY="-50%" rotate={4} phone={{ width: '54vw', shiftY: '-62%' }} />
          <AccommodationSection />
          {/* The leaves dissolve before the zalktis below instead of stopping
              at its edge. Under the content, so it never shades a button. */}
          <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-56 bg-gradient-to-b from-transparent to-[#0a0a0a]" />
        </LeafBackdrop>

        {/* The gift card over the zalktis on its mossy roots. */}
        <GiftCardBuySection variant="rituals" edge="#0a0a0a" />
      </main>

      <FooterSection />
    </div>
    </MotionConfig>
  );
};

export default PirtsRitualiPage;
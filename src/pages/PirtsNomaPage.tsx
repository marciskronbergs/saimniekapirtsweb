import HeaderSection from '../components/HeaderSection';
import FooterSection from '../components/FooterSection';
import TubInterlude from '../components/tubInterlude/TubInterlude';
import LeafBackdrop from '../components/leaves/LeafBackdrop';
import SaunaStack from '../components/pirtsNoma/SaunaStack';
import PlaceScroll from '../components/pirtsNoma/PlaceScroll';
import PriceSwitch from '../components/pirtsNoma/PriceSwitch';
import NomaExtras from '../components/pirtsNoma/NomaExtras';
import Testimonials from '../components/pirtsRituali/Testimonials';
import NomaStay from '../components/pirtsNoma/NomaStay';
import GiftCardBuySection from '../components/GiftCardBuySection';
import { WhiskSeam } from '../components/whisks/WhiskAccent';

// Sauna rental: the homepage's rental scene as the hero, then the two saunas
// and the tub as stacking glass cards, the place in a sideways-scrolling
// band, the prices, the extras, reviews, staying the night and the gift card
// over the zalktis scene.
//
// overflow-x-clip, not -hidden: hidden would make these scroll boxes and stop
// the sticky stages (hero, cards, place band) from sticking.

const PirtsNomaPage = () => {
  return (
    <div className="min-h-screen overflow-x-clip bg-black">
      <HeaderSection />
      <TubInterlude scene="rentalHero" />

      <main className="overflow-x-clip">
        {/* "Divas pirtis, divi raksturi" and its cards rise over the last of
            the hero while its stage is still held, as the rituals page's
            prices do over the tub: everything below is pulled up into the
            hero's end, on a shade that deepens into the page's black. */}
        <div className="relative z-10 -mt-[12svh] lg:-mt-[26svh]">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-[24svh] lg:h-[38svh]"
            style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.55) 38%, rgba(0,0,0,0.88) 70%, #000 100%)' }}
          />
          {/* A maple whisk from the right, beside "Divas pirtis, divi raksturi"
              (the birch leaf that sat there is left out). */}
          <WhiskSeam asset="maple-right" width="30vw" top="-8px" shiftY="0%" rotate={2} hideOnPhones />
          {/* One run of drifting leaves behind the saunas, the place, the prices
              and the extras; see-through, so the hero shows behind the heading.
              More hands with whisks, set behind the content. */}
          <LeafBackdrop className="!bg-transparent" clear={[{ side: 'right', top: 2 }]}>
            <SaunaStack />
            <WhiskSeam behind asset="birch-left" width="34vw" shiftY="-50%" rotate={4} phone={{ width: '54vw', shiftY: '-60%' }} />
            <PlaceScroll />
            <PriceSwitch />
            <WhiskSeam behind asset="oak-right" width="36vw" shiftY="-46%" rotate={3} phone={{ width: '56vw', shiftY: '-62%' }} />
            <NomaExtras />
          </LeafBackdrop>
        </div>

        {/* A maple whisk from the left, beside the guests' words (outside the
            leaves below, which would clip its upper part). */}
        <WhiskSeam asset="maple-left" width="31vw" shiftY="-35%" rotate={4} phone={{ width: '50vw', shiftY: '-55%' }} />
        <LeafBackdrop className="!bg-transparent">
          <section>
            <Testimonials />
          </section>

          <NomaStay />
          {/* The leaves dissolve before the zalktis below instead of stopping
              at its edge. Under the content, so it never shades a button. */}
          <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-56 bg-gradient-to-b from-transparent to-black" />
        </LeafBackdrop>

        {/* The gift card over the zalktis on its mossy roots. */}
        <GiftCardBuySection variant="rental" />
      </main>

      <FooterSection />
    </div>
  );
};

export default PirtsNomaPage;

import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Building, Bus, Check, Copy, Hash, Landmark, Mail, MapPin, Phone, type LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ConsentGatedMap from './shared/ConsentGatedMap';

// Where to find us: the map in a glass frame with how to get here below it;
// beside it the contact details as glass rows you can press (map, call,
// write) and the company details, with the account number to copy.

const PHONE = '+371 26 752 661';
const EMAIL = 'info@saimniekapirts.lv';

// The glass every block here is made of.
const glass =
  'relative overflow-hidden rounded-[1.75rem] bg-white/[0.06] ring-1 ring-white/15 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_30px_70px_-35px_rgba(0,0,0,0.9)]';
const iconChip =
  'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-green-500/15 text-green-300 ring-1 ring-green-400/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]';

// `onMoss`: on the gift cards' mossy forest floor (the homepage), not on
// black: a shade behind the words and blocks instead of the green glow.
const LocationSection = ({ onMoss = false }: { onMoss?: boolean }) => {
  const { t } = useTranslation('location');
  const { t: tCommon } = useTranslation('common');
  const sectionRef = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.12 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const rise = `transition-all duration-700 ease-out motion-reduce:transition-none ${
    shown ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0 motion-reduce:translate-y-0 motion-reduce:opacity-100'
  }`;
  const delay = (ms: number) => ({ transitionDelay: shown ? `${ms}ms` : '0ms' });

  const contacts: { icon: LucideIcon; label: string; value: string; href: string; external?: boolean }[] = [
    {
      icon: MapPin,
      label: t('contactAddress'),
      value: tCommon('company.siteAddress'),
      // The same point the embedded map shows.
      href: 'https://www.google.com/maps/search/?api=1&query=56.6841314,24.2903839',
      external: true,
    },
    { icon: Phone, label: t('contactPhone'), value: PHONE, href: `tel:${PHONE.replace(/\s/g, '')}` },
    { icon: Mail, label: t('contactEmail'), value: EMAIL, href: `mailto:${EMAIL}` },
  ];

  const company: { icon: LucideIcon; label: string; value: string }[] = [
    { icon: Building, label: t('companyName'), value: tCommon('company.legalName') },
    { icon: MapPin, label: t('contactAddress'), value: tCommon('company.legalAddress') },
    { icon: Hash, label: t('companyReg'), value: tCommon('company.regNumber') },
    { icon: Landmark, label: t('companyBank'), value: tCommon('company.bank') },
  ];
  const iban = tCommon('company.iban');

  const copyIban = async () => {
    try {
      await navigator.clipboard.writeText(iban);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard refused: the number is on screen to select by hand.
    }
  };

  return (
    <section
      ref={sectionRef}
      id="vieta"
      aria-labelledby="location-heading"
      className={`scroll-mt-20 relative overflow-hidden py-16 sm:py-20 lg:py-24 ${onMoss ? '' : 'bg-black'}`}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: onMoss
            ? 'radial-gradient(75% 55% at 50% 48%, rgba(3,6,3,0.5), rgba(3,6,3,0.22) 70%, transparent 100%)'
            : 'radial-gradient(45% 50% at 25% 45%, rgba(34,197,94,0.1), transparent 70%)',
        }}
      />

      <div className="relative mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10">
        <div className={`mb-8 sm:mb-12 ${rise}`}>
          <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.22em] text-green-400">{t('location')}</p>
          <h2 id="location-heading" className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white [text-shadow:0_2px_24px_rgba(0,0,0,0.6)]">
            {t('heading')}
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:gap-6">
          {/* The map in a glass frame, and how to get here. */}
          <div className="flex flex-col gap-5 lg:col-span-7 lg:gap-6">
            <div className={`${glass} p-2 sm:p-2.5 ${rise}`} style={delay(100)}>
              <div className="h-[280px] overflow-hidden rounded-[1.35rem] sm:h-[360px] lg:h-[440px]">
                <ConsentGatedMap height="100%" />
              </div>
            </div>
            <div className={`${glass} flex gap-4 p-5 sm:p-6 ${rise}`} style={delay(200)}>
              <span className={iconChip}>
                <Bus className="h-5 w-5" aria-hidden />
              </span>
              <p className="text-sm sm:text-base leading-relaxed text-gray-300">
                <strong className="block text-white">{t('transport')}</strong>
                {t('transportDesc')}
              </p>
            </div>
          </div>

          {/* Contact, company details and the way to book. */}
          <div className="flex flex-col gap-5 lg:col-span-5 lg:gap-6">
            <ul className={`${glass} divide-y divide-white/10 p-2 ${rise}`} style={delay(150)}>
              {contacts.map(({ icon: Icon, label, value, href, external }) => (
                <li key={label}>
                  <a
                    href={href}
                    {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
                    className="group flex items-center gap-4 rounded-[1.35rem] p-3 sm:p-4 transition-colors hover:bg-white/[0.06] focus:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
                  >
                    <span className={iconChip}>
                      <Icon className="h-5 w-5" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">{label}</span>
                      <span className="mt-0.5 block text-sm sm:text-base font-medium text-white break-words">{value}</span>
                    </span>
                    <ArrowUpRight className="h-5 w-5 shrink-0 text-white/40 transition-[color,transform] duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-green-300" aria-hidden />
                  </a>
                </li>
              ))}
            </ul>

            <div className={`${glass} p-5 sm:p-6 ${rise}`} style={delay(250)}>
              <h3 className="text-lg sm:text-xl font-bold text-white">{t('companyInfo')}</h3>
              <dl className="mt-4 space-y-3">
                {company.map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-start gap-3">
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-green-400" aria-hidden />
                    <div className="min-w-0">
                      <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">{label}</dt>
                      <dd className="text-sm sm:text-base text-white">{value}</dd>
                    </div>
                  </div>
                ))}
                {/* The account number, in a glass well with a copy button. */}
                <div className="mt-2 flex items-center gap-3 rounded-2xl bg-black/30 p-3 ring-1 ring-white/10">
                  <div className="min-w-0 flex-1">
                    <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">{t('companyIBAN')}</dt>
                    <dd className="font-mono text-sm sm:text-base tracking-wide text-white break-all">{iban}</dd>
                  </div>
                  <button
                    type="button"
                    onClick={copyIban}
                    aria-label={copied ? t('copied') : t('copy')}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/20 transition-colors hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
                  >
                    {copied ? <Check className="h-4 w-4 text-green-300" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              </dl>
            </div>

            <div className={rise} style={delay(350)}>
              <Link
                to="/rezervet"
                className="flex w-full items-center justify-center rounded-full bg-green-600 px-8 py-4 sm:py-5 text-lg font-semibold text-white shadow-[0_12px_32px_-12px_rgba(34,197,94,0.8),inset_0_1px_0_rgba(255,255,255,0.35)] transition-colors hover:bg-green-500 focus:outline-none focus-visible:ring-4 focus-visible:ring-green-300/60"
              >
                {t('reserveNow')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LocationSection;

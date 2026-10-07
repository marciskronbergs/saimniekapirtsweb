import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Cookie, X } from 'lucide-react';
import {
  ALL_DENIED,
  ALL_GRANTED,
  onOpenCookieSettings,
  saveConsent,
  type ConsentCategory,
  type ConsentChoice,
} from '../../lib/consent';
import { COOKIE_DECLARATION, type DeclarationCategory } from '../../data/cookieDeclaration';
import { useCookieConsent } from '../../hooks/useCookieConsent';
import CookieDeclarationList from './CookieDeclarationList';
import { asLanguage } from '../../utils/locale';

// The office and the sauna masters' page are staff tools, not for visitors.
const STAFF_PATHS = ['/birojs', '/pirtnieks'];

const CATEGORIES: DeclarationCategory[] = ['necessary', 'preferences', 'statistics', 'marketing'];
type Tab = 'consent' | 'details' | 'about';
type View = 'hidden' | 'banner' | 'settings';

const buttonBase =
  'min-h-[44px] px-5 py-2.5 rounded-full text-sm font-semibold transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d1f0d]';
const outlineButton = `${buttonBase} border border-white/25 text-white hover:border-green-400 hover:text-green-300`;
const solidButton = `${buttonBase} bg-gradient-to-r from-green-500 to-lime-500 text-black hover:from-green-400 hover:to-lime-400`;

const Toggle: React.FC<{
  checked: boolean;
  disabled?: boolean;
  label: string;
  onChange?: (value: boolean) => void;
}> = ({ checked, disabled, label, onChange }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    disabled={disabled}
    onClick={() => onChange?.(!checked)}
    className={`relative inline-flex h-7 w-12 flex-shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d1f0d] ${
      checked ? 'bg-green-500' : 'bg-gray-600'
    } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
  >
    <span
      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 ${
        checked ? 'translate-x-6' : 'translate-x-1'
      }`}
    />
  </button>
);

const CookieConsent: React.FC = () => {
  const { t, i18n } = useTranslation('common');
  const location = useLocation();
  const saved = useCookieConsent();
  const [view, setView] = useState<View>(() => (saved ? 'hidden' : 'banner'));
  const [tab, setTab] = useState<Tab>('consent');
  const [draft, setDraft] = useState<ConsentChoice>(saved ?? ALL_DENIED);
  const [expanded, setExpanded] = useState<DeclarationCategory | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  const openSettings = useCallback(() => {
    openerRef.current = document.activeElement as HTMLElement | null;
    setDraft(saved ?? ALL_DENIED);
    setTab('consent');
    setExpanded(null);
    setView('settings');
  }, [saved]);

  useEffect(() => onOpenCookieSettings(openSettings), [openSettings]);

  const closeSettings = useCallback(() => {
    // Without a choice yet, closing the details returns to the banner:
    // the question stays open until it is answered.
    setView(saved ? 'hidden' : 'banner');
    openerRef.current?.focus?.();
  }, [saved]);

  // The settings dialog is modal: focus moves in, Escape closes it, Tab stays inside.
  useEffect(() => {
    if (view !== 'settings') return;
    const dialog = dialogRef.current;
    dialog?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeSettings();
        return;
      }
      if (event.key !== 'Tab' || !dialog) return;
      const focusable = dialog.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
  }, [view, closeSettings]);

  const decide = (choice: ConsentChoice, method: 'accept_all' | 'reject_all' | 'custom') => {
    saveConsent(choice, method);
    setView('hidden');
  };

  if (STAFF_PATHS.some((path) => location.pathname.startsWith(path))) return null;

  const lang = asLanguage(i18n.language);
  const allowedList = (['preferences', 'statistics', 'marketing'] as ConsentCategory[])
    .filter((category) => saved?.[category])
    .map((category) => t(`cookies.categories.${category}.title`));

  const privacyLink = (
    <Link
      to="/privatuma-politika"
      className="text-green-400 underline underline-offset-2 hover:text-green-300"
      onClick={() => view === 'settings' && closeSettings()}
    >
      {t('cookies.privacyLink')}
    </Link>
  );

  const actions = (
    <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end">
      <button type="button" className={outlineButton} onClick={() => decide(ALL_DENIED, 'reject_all')}>
        {t('cookies.deny')}
      </button>
      {view === 'settings' ? (
        <button type="button" className={outlineButton} onClick={() => decide(draft, 'custom')}>
          {t('cookies.save')}
        </button>
      ) : (
        <button type="button" className={outlineButton} onClick={openSettings}>
          {t('cookies.customize')}
        </button>
      )}
      <button
        type="button"
        className={`${solidButton} col-span-2 order-first sm:order-none`}
        onClick={() => decide(ALL_GRANTED, 'accept_all')}
      >
        {t('cookies.acceptAll')}
      </button>
    </div>
  );

  return (
    <>
      {view === 'hidden' && saved && (
        <button
          type="button"
          onClick={openSettings}
          aria-label={t('cookies.reopen')}
          title={t('cookies.reopen')}
          className="fixed bottom-4 left-4 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-[#0d1f0d]/90 border border-green-500/30 text-green-400 shadow-lg backdrop-blur hover:text-green-300 hover:border-green-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
        >
          <Cookie className="h-5 w-5" aria-hidden="true" />
        </button>
      )}

      {view === 'banner' && (
        <div
          role="region"
          aria-labelledby="cookie-banner-title"
          className="fixed inset-x-0 bottom-0 z-[70] p-3 sm:p-4"
        >
          <div className="mx-auto max-w-4xl rounded-2xl border border-green-500/30 bg-[#0d1f0d]/95 p-5 shadow-2xl shadow-black/60 backdrop-blur sm:p-6">
            <div className="flex items-start gap-3">
              <Cookie className="mt-0.5 h-6 w-6 flex-shrink-0 text-green-400" aria-hidden="true" />
              <div className="min-w-0">
                <h2 id="cookie-banner-title" className="text-base font-bold text-white sm:text-lg">
                  {t('cookies.title')}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-gray-300">
                  {t('cookies.text')} {privacyLink}
                </p>
              </div>
            </div>
            <div className="mt-4">{actions}</div>
          </div>
        </div>
      )}

      {view === 'settings' && (
        <div
          className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 sm:items-center sm:p-4"
          onMouseDown={(event) => event.target === event.currentTarget && closeSettings()}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="cookie-settings-title"
            tabIndex={-1}
            className="flex max-h-[92vh] w-full max-w-2xl flex-col rounded-t-2xl border border-green-500/30 bg-[#0d1f0d] shadow-2xl focus:outline-none sm:rounded-2xl"
          >
            <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4 sm:px-6">
              <h2 id="cookie-settings-title" className="flex items-center gap-2 text-lg font-bold text-white">
                <Cookie className="h-5 w-5 text-green-400" aria-hidden="true" />
                {t('cookies.settingsTitle')}
              </h2>
              <button
                type="button"
                onClick={closeSettings}
                aria-label={t('cookies.close')}
                className="rounded-full p-2 text-gray-400 hover:bg-white/5 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <div role="tablist" className="flex border-b border-white/10 px-2 sm:px-4">
              {(['consent', 'details', 'about'] as Tab[]).map((name) => (
                <button
                  key={name}
                  type="button"
                  role="tab"
                  aria-selected={tab === name}
                  onClick={() => setTab(name)}
                  className={`flex-1 border-b-2 px-2 py-3 text-xs font-semibold transition-colors sm:text-sm ${
                    tab === name
                      ? 'border-green-400 text-green-300'
                      : 'border-transparent text-gray-400 hover:text-white'
                  }`}
                >
                  {t(`cookies.tabs.${name}`)}
                </button>
              ))}
            </div>

            <div role="tabpanel" className="flex-1 overflow-y-auto overscroll-contain px-5 py-4 sm:px-6">
              {tab === 'consent' && (
                <ul className="divide-y divide-white/10">
                  {CATEGORIES.map((category) => {
                    const isNecessary = category === 'necessary';
                    const checked = isNecessary || draft[category as ConsentCategory];
                    const title = t(`cookies.categories.${category}.title`);
                    const open = expanded === category;
                    return (
                      <li key={category} className="py-4 first:pt-1">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <h3 className="font-semibold text-white">{title}</h3>
                            <p className="mt-1 text-sm leading-relaxed text-gray-400">
                              {t(`cookies.categories.${category}.description`)}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1 pt-0.5">
                            <Toggle
                              checked={checked}
                              disabled={isNecessary}
                              label={title}
                              onChange={(value) =>
                                setDraft((current) => ({ ...current, [category]: value }))
                              }
                            />
                            {isNecessary && (
                              <span className="text-[11px] text-gray-500">{t('cookies.alwaysOn')}</span>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          aria-expanded={open}
                          onClick={() => setExpanded(open ? null : category)}
                          className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-green-400 hover:text-green-300"
                        >
                          {open ? t('cookies.hideCookies') : t('cookies.showCookies')} (
                          {COOKIE_DECLARATION[category].length})
                          <ChevronDown
                            className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`}
                            aria-hidden="true"
                          />
                        </button>
                        {open && (
                          <div className="mt-3">
                            <CookieDeclarationList category={category} />
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}

              {tab === 'details' && (
                <div className="space-y-6">
                  {CATEGORIES.map((category) => (
                    <section key={category}>
                      <h3 className="mb-2 font-semibold text-white">
                        {t(`cookies.categories.${category}.title`)}{' '}
                        <span className="text-sm font-normal text-gray-500">
                          ({t('cookies.count', { count: COOKIE_DECLARATION[category].length })})
                        </span>
                      </h3>
                      <CookieDeclarationList category={category} />
                    </section>
                  ))}
                </div>
              )}

              {tab === 'about' && (
                <div className="space-y-3 text-sm leading-relaxed text-gray-300">
                  {(t('cookies.about', { returnObjects: true }) as string[]).map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                  <p>{privacyLink}</p>
                  {saved && (
                    <div className="mt-4 rounded-lg border border-white/10 bg-black/30 p-4">
                      <h3 className="mb-2 font-semibold text-white">{t('cookies.yourConsent')}</h3>
                      <dl className="space-y-1 text-xs sm:text-sm">
                        <div className="flex flex-wrap gap-x-2">
                          <dt className="text-gray-400">{t('cookies.consentState')}:</dt>
                          <dd>
                            {[t('cookies.categories.necessary.title'), ...allowedList].join(', ')}
                          </dd>
                        </div>
                        <div className="flex flex-wrap gap-x-2">
                          <dt className="text-gray-400">{t('cookies.consentDate')}:</dt>
                          <dd>
                            {new Date(saved.at).toLocaleString(lang === 'en' ? 'en-GB' : lang === 'ru' ? 'ru-RU' : 'lv-LV')}
                          </dd>
                        </div>
                        <div className="flex flex-wrap gap-x-2">
                          <dt className="text-gray-400">{t('cookies.consentId')}:</dt>
                          <dd className="break-all font-mono">{saved.id}</dd>
                        </div>
                      </dl>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="border-t border-white/10 px-5 py-4 sm:px-6">{actions}</div>
          </div>
        </div>
      )}
    </>
  );
};

export default CookieConsent;

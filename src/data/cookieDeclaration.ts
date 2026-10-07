// Every cookie and storage entry the site sets or lets others set, per
// consent category. The consent dialog and the privacy policy both render
// this list, so it is the one place to update when a tag is added in Google
// Tag Manager. Raise VERSION in src/lib/consent.ts when a change here
// deserves asking everyone again.

import type { ConsentCategory } from '../lib/consent';

type Localized = { lv: string; en: string; ru: string };

export interface CookieEntry {
  name: string;
  provider: string;
  purpose: Localized;
  expiry: Localized;
  type: 'HTTP' | 'localStorage';
}

export type DeclarationCategory = 'necessary' | ConsentCategory;

const MONTHS_3: Localized = { lv: '3 mēneši', en: '3 months', ru: '3 месяца' };
const MONTHS_13: Localized = { lv: '13 mēneši', en: '13 months', ru: '13 месяцев' };
const YEARS_2: Localized = { lv: '2 gadi', en: '2 years', ru: '2 года' };

export const COOKIE_DECLARATION: Record<DeclarationCategory, CookieEntry[]> = {
  necessary: [
    {
      name: 'sp_cookie_consent',
      provider: 'saimniekapirts.lv',
      purpose: {
        lv: 'Saglabā jūsu sīkdatņu izvēli un piekrišanas ID, lai to nejautātu katrā lapā.',
        en: 'Stores your cookie choice and consent ID so you are not asked on every page.',
        ru: 'Сохраняет ваш выбор cookie и ID согласия, чтобы не спрашивать вас на каждой странице.',
      },
      expiry: { lv: '1 gads', en: '1 year', ru: '1 год' },
      type: 'localStorage',
    },
  ],
  preferences: [],
  statistics: [
    {
      name: '_ga',
      provider: 'Google Analytics',
      purpose: {
        lv: 'Piešķir anonīmu apmeklētāja ID, lai saskaitītu apmeklējumus un redzētu, kā lapa tiek lietota.',
        en: 'Assigns an anonymous visitor ID to count visits and see how the site is used.',
        ru: 'Присваивает анонимный ID посетителя, чтобы считать посещения и видеть, как используется сайт.',
      },
      expiry: YEARS_2,
      type: 'HTTP',
    },
    {
      name: '_ga_*',
      provider: 'Google Analytics',
      purpose: {
        lv: 'Saglabā apmeklējuma (sesijas) stāvokli Google Analytics 4.',
        en: 'Keeps the state of the visit (session) for Google Analytics 4.',
        ru: 'Сохраняет состояние посещения (сеанса) для Google Analytics 4.',
      },
      expiry: YEARS_2,
      type: 'HTTP',
    },
  ],
  marketing: [
    {
      name: '_gcl_au',
      provider: 'Google Ads',
      purpose: {
        lv: 'Sasaista reklāmas klikšķi ar rezervāciju, lai mērītu Google reklāmu efektivitāti.',
        en: 'Links an ad click to a booking to measure how well Google ads work.',
        ru: 'Связывает клик по рекламе с бронированием, чтобы измерять эффективность рекламы Google.',
      },
      expiry: MONTHS_3,
      type: 'HTTP',
    },
    {
      name: '_fbp',
      provider: 'Meta (Facebook, Instagram)',
      purpose: {
        lv: 'Meta pikselis atpazīst pārlūku, lai mērītu reklāmas un rādītu tās cilvēkiem, kas apmeklējuši lapu.',
        en: 'The Meta pixel recognises the browser to measure ads and show them to people who visited the site.',
        ru: 'Пиксель Meta распознаёт браузер, чтобы измерять рекламу и показывать её посетителям сайта.',
      },
      expiry: MONTHS_3,
      type: 'HTTP',
    },
    {
      name: '_fbc',
      provider: 'Meta (Facebook, Instagram)',
      purpose: {
        lv: 'Saglabā pēdējo Facebook vai Instagram reklāmas klikšķi.',
        en: 'Stores the last Facebook or Instagram ad click.',
        ru: 'Сохраняет последний клик по рекламе в Facebook или Instagram.',
      },
      expiry: MONTHS_3,
      type: 'HTTP',
    },
    {
      name: '_ttp',
      provider: 'TikTok',
      purpose: {
        lv: 'TikTok pikselis mēra reklāmu rezultātus un veido auditorijas no lapas apmeklētājiem.',
        en: 'The TikTok pixel measures ad results and builds audiences from site visitors.',
        ru: 'Пиксель TikTok измеряет результаты рекламы и формирует аудитории из посетителей сайта.',
      },
      expiry: MONTHS_13,
      type: 'HTTP',
    },
    {
      name: '_tt_enable_cookie',
      provider: 'TikTok',
      purpose: {
        lv: 'Pārbauda, vai pārlūks ļauj TikTok pikselim saglabāt sīkdatnes.',
        en: 'Checks whether the browser lets the TikTok pixel store cookies.',
        ru: 'Проверяет, разрешает ли браузер пикселю TikTok сохранять cookie.',
      },
      expiry: MONTHS_13,
      type: 'HTTP',
    },
    {
      name: 'NID',
      provider: 'Google Maps',
      purpose: {
        lv: 'Iegultā Google karte saglabā iestatījumus un informāciju reklāmu personalizēšanai.',
        en: 'The embedded Google map stores settings and information used to personalise ads.',
        ru: 'Встроенная карта Google сохраняет настройки и данные для персонализации рекламы.',
      },
      expiry: { lv: '6 mēneši', en: '6 months', ru: '6 месяцев' },
      type: 'HTTP',
    },
  ],
};

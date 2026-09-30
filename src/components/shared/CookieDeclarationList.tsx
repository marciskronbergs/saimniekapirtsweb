import React from 'react';
import { useTranslation } from 'react-i18next';
import { COOKIE_DECLARATION, type DeclarationCategory } from '../../data/cookieDeclaration';

/** The cookies of one category, as cards: they stay readable on a phone. */
const CookieDeclarationList: React.FC<{ category: DeclarationCategory }> = ({ category }) => {
  const { t, i18n } = useTranslation('common');
  const lang = i18n.language?.startsWith('en') ? 'en' : 'lv';
  const cookies = COOKIE_DECLARATION[category];

  if (cookies.length === 0) {
    return <p className="text-sm text-gray-400 italic">{t('cookies.none')}</p>;
  }

  return (
    <ul className="space-y-2">
      {cookies.map((cookie) => (
        <li key={cookie.name} className="rounded-lg bg-black/30 border border-white/5 p-3 text-sm">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <code className="font-mono text-green-300 break-all">{cookie.name}</code>
            <span className="text-gray-400 text-xs">{cookie.provider}</span>
          </div>
          <p className="text-gray-300 mt-1.5 leading-relaxed">{cookie.purpose[lang]}</p>
          <dl className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
            <div className="flex gap-1">
              <dt>{t('cookies.table.expiry')}:</dt>
              <dd className="text-gray-300">{cookie.expiry[lang]}</dd>
            </div>
            <div className="flex gap-1">
              <dt>{t('cookies.table.type')}:</dt>
              <dd className="text-gray-300">{cookie.type}</dd>
            </div>
          </dl>
        </li>
      ))}
    </ul>
  );
};

export default CookieDeclarationList;

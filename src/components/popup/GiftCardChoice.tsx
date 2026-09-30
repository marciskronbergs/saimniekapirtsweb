import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Check, Gift, Loader2 } from 'lucide-react';
import { callInvoiceFunction } from '../../lib/officeApi';
import { emptyGiftCard, type GiftCardEntry } from './giftCardEntry';

// A gift card given on the booking form: its number and the code printed
// beside it. The card is checked as soon as both are in, so the guest knows
// at once whether it will come off the invoice; the invoice function checks it
// again when it invoices the booking. A card that does not hold never stops
// the booking: the guest is told why and whom to contact.

interface Checked {
  status: string;
  name?: { lv: string; en: string };
  value?: number;
  kind?: 'ritual' | 'value';
}

interface GiftCardChoiceProps {
  value: GiftCardEntry;
  onChange: (entry: GiftCardEntry) => void;
  // The day of the visit, for the card's validity.
  date: string | null;
}

const GiftCardChoice: React.FC<GiftCardChoiceProps> = ({ value, onChange, date }) => {
  const { t, i18n } = useTranslation('forms');
  const locale = i18n.language === 'en' ? 'en' : 'lv';
  const [open, setOpen] = useState(!!value.code);
  const [checking, setChecking] = useState(false);
  const [checked, setChecked] = useState<Checked | null>(null);
  const asked = useRef('');

  const check = async (entry: GiftCardEntry) => {
    const key = `${entry.code}|${entry.pin}|${date}`;
    if (!entry.code.trim() || entry.pin.trim().length < 4 || asked.current === key) return;
    asked.current = key;
    setChecking(true);
    try {
      const r = await callInvoiceFunction<Checked>({ gift_card_check: { code: entry.code, pin: entry.pin, date } });
      setChecked(r);
      onChange({ ...entry, status: r.status });
    } catch {
      setChecked({ status: 'error' });
      onChange({ ...entry, status: 'error' });
    } finally {
      setChecking(false);
    }
  };

  const update = (field: 'code' | 'pin', text: string) => {
    const next = { ...value, [field]: field === 'pin' ? text.toUpperCase().slice(0, 4) : text, status: null };
    setChecked(null);
    asked.current = '';
    onChange(next);
    // The code is the last thing typed: check once it is complete.
    if (field === 'pin' && next.pin.length === 4) check(next);
  };

  const toggle = () => {
    if (open) {
      setChecked(null);
      asked.current = '';
      onChange(emptyGiftCard);
    }
    setOpen(!open);
  };

  const input = 'w-full px-4 py-3 bg-black/30 border border-green-500/30 rounded-xl text-white placeholder-gray-500 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all';

  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-3">
      <label className="flex items-center gap-3 text-gray-200 cursor-pointer">
        <input
          type="checkbox"
          checked={open}
          onChange={toggle}
          className="w-4 h-4 text-green-600 bg-gray-800 border-gray-600 rounded focus:ring-green-500"
        />
        <Gift className="w-4 h-4 text-amber-300" />
        <span className="font-medium">{t('giftCard.have')}</span>
      </label>
      {open && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_8rem] gap-3">
            <label className="block text-sm text-gray-300">
              {t('giftCard.number')}
              <input
                type="text"
                inputMode="text"
                autoComplete="off"
                value={value.code}
                onChange={(e) => update('code', e.target.value)}
                onBlur={() => check(value)}
                placeholder="AR-2026-0012"
                className={`mt-1 ${input}`}
              />
            </label>
            <label className="block text-sm text-gray-300">
              {t('giftCard.code')}
              <input
                type="text"
                autoComplete="off"
                autoCapitalize="characters"
                value={value.pin}
                onChange={(e) => update('pin', e.target.value.replace(/[^0-9a-zA-Z]/g, ''))}
                onBlur={() => check(value)}
                placeholder="ABCD"
                maxLength={4}
                className={`mt-1 ${input} uppercase tracking-widest`}
              />
            </label>
          </div>
          <p className="text-xs text-gray-400">{t('giftCard.where')}</p>
          {checking && (
            <p className="flex items-center gap-2 text-sm text-gray-300">
              <Loader2 className="w-4 h-4 animate-spin text-green-400" /> {t('giftCard.checking')}
            </p>
          )}
          {!checking && checked?.status === 'ok' && (
            <p className="flex items-start gap-2 rounded-lg border border-green-500/40 bg-green-500/10 p-3 text-sm text-green-200">
              <Check className="w-4 h-4 mt-0.5 shrink-0" />
              <span>
                {checked.kind === 'ritual'
                  ? t('giftCard.okRitual', { name: checked.name?.[locale] ?? '' })
                  : t('giftCard.okValue', { value: checked.value ?? 0 })}
              </span>
            </p>
          )}
          {!checking && checked && checked.status !== 'ok' && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-500/50 bg-amber-500/10 p-3 text-sm text-amber-100">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-amber-300" />
              <div className="space-y-1">
                <p>{t(`giftCard.problem.${checked.status}`, { defaultValue: t('giftCard.problem.error') })}</p>
                <p>{t('giftCard.contact')}</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default GiftCardChoice;

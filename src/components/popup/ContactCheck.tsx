import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';
import { domainTakesMail, phoneLooksShort, suggestEmail } from '../../lib/contactCheck';

// The forms' check of the guest's email and phone (src/lib/contactCheck.ts):
// a likely typo is pointed out once, with the corrected address a click away;
// an address that cannot receive mail stops the booking until it is fixed.

interface Notice {
  suggestion: string | null;
  noMail: boolean;
  phoneShort: boolean;
  // Raised by pressing the button, far below the fields: brought into view.
  onSubmit?: boolean;
}

export function useContactCheck(email: string, phone: string) {
  const [notice, setNotice] = useState<Notice | null>(null);
  // The email and phone the guest chose to keep after being warned.
  const kept = useRef('');

  useEffect(() => setNotice(null), [email, phone]);

  // When the guest leaves the email field: a typo is offered corrected at once.
  const onEmailBlur = () => {
    const suggestion = suggestEmail(email);
    if (suggestion) setNotice({ suggestion, noMail: false, phoneShort: false });
  };

  /** Whether the form may be sent; if not, the notice says why. */
  const confirmBeforeSubmit = async (): Promise<boolean> => {
    const suggestion = suggestEmail(email);
    const takesMail = await domainTakesMail(email);
    const phoneShort = phoneLooksShort(phone);
    if (takesMail === false) {
      setNotice({ suggestion, noMail: true, phoneShort, onSubmit: true });
      return false;
    }
    const key = `${email.trim()}|${phone.trim()}`;
    if ((suggestion || phoneShort) && kept.current !== key) {
      kept.current = key;
      setNotice({ suggestion, noMail: false, phoneShort, onSubmit: true });
      return false;
    }
    return true;
  };

  return { notice, onEmailBlur, confirmBeforeSubmit };
}

export const ContactCheckNotice = ({ notice, onUse }: { notice: Notice | null; onUse: (email: string) => void }) => {
  const { t } = useTranslation('forms');
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (notice?.onSubmit) box.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [notice]);
  if (!notice || (!notice.suggestion && !notice.noMail && !notice.phoneShort)) return null;
  return (
    <div ref={box} className="flex gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-100" role="alert">
      <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
      <div className="space-y-1.5">
        {notice.noMail && <p>{t('contactCheck.noMail')}</p>}
        {notice.suggestion && (
          <p>
            {t('contactCheck.suggest')}{' '}
            <button
              type="button"
              onClick={() => onUse(notice.suggestion!)}
              className="font-semibold text-white underline underline-offset-2 hover:text-green-300"
            >
              {notice.suggestion}
            </button>
            ?
          </p>
        )}
        {notice.phoneShort && <p>{t('contactCheck.phoneShort')}</p>}
        {!notice.noMail && <p className="text-amber-200/80">{t('contactCheck.keep')}</p>}
      </div>
    </div>
  );
};

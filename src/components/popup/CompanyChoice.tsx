import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Building2 } from 'lucide-react';
import { emptyCompany, type CompanyEntry } from './companyEntry';
import { OptionCard, fieldClass } from './bookingUi';

// "Invoice to a company" on a booking form: the company's name, registration
// number and legal address, which the invoice then carries as its recipient.
// The name, email and phone above stay the contact person's.

interface CompanyChoiceProps {
  // null while the invoice is for the guest themselves.
  value: CompanyEntry | null;
  onChange: (company: CompanyEntry | null) => void;
}

const CompanyChoice: React.FC<CompanyChoiceProps> = ({ value, onChange }) => {
  const { t } = useTranslation('forms');
  const [open, setOpen] = useState(!!value);

  const toggle = () => {
    onChange(open ? null : value ?? emptyCompany);
    setOpen(!open);
  };
  const update = (field: keyof CompanyEntry, text: string) =>
    onChange({ ...(value ?? emptyCompany), [field]: text });

  const input = fieldClass.replace('pl-11', 'pl-4');

  return (
    <div className="space-y-3">
      <OptionCard type="checkbox" name="company" checked={open} onChange={toggle} title={t('company.toggle')}>
        <Building2 aria-hidden className="absolute right-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-green-300/70" />
      </OptionCard>

      {open && value && (
        <div className="space-y-3 rounded-2xl bg-white/[0.03] p-4 ring-1 ring-white/10">
          <p className="text-sm text-white/60">{t('company.note')}</p>
          <input
            type="text"
            placeholder={t('company.name')}
            value={value.name}
            onChange={(e) => update('name', e.target.value)}
            required
            autoComplete="organization"
            className={input}
          />
          <input
            type="text"
            placeholder={t('company.regNumber')}
            value={value.regNumber}
            onChange={(e) => update('regNumber', e.target.value)}
            required
            className={input}
          />
          <input
            type="text"
            placeholder={t('company.address')}
            value={value.address}
            onChange={(e) => update('address', e.target.value)}
            required
            className={input}
          />
          <input
            type="text"
            placeholder={t('company.vatNumber')}
            value={value.vatNumber}
            onChange={(e) => update('vatNumber', e.target.value)}
            className={input}
          />
        </div>
      )}
    </div>
  );
};

export default CompanyChoice;

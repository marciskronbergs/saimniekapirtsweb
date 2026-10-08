import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Building2 } from 'lucide-react';
import { emptyCompany, type CompanyEntry } from './companyEntry';

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

  const input = 'w-full px-4 py-3 bg-black/30 border border-green-500/30 rounded-xl text-white placeholder-gray-500 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all';

  return (
    <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-4 space-y-3">
      <label className="flex items-center gap-3 text-gray-200 cursor-pointer">
        <input
          type="checkbox"
          checked={open}
          onChange={toggle}
          className="w-4 h-4 text-green-600 bg-gray-800 border-gray-600 rounded focus:ring-green-500"
        />
        <Building2 className="w-5 h-5 text-green-400" />
        <span>{t('company.toggle')}</span>
      </label>

      {open && value && (
        <div className="space-y-3">
          <p className="text-sm text-gray-400">{t('company.note')}</p>
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

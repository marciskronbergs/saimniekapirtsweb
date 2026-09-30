import { useState } from 'react';
import { Copy, Pencil, UserPlus } from 'lucide-react';

// The office's list of sauna masters. Each has a private link to a page with
// the bookings assigned to them; the link is the only key, so it is shown here
// to copy and send, and a new one can be made if it goes astray.

export interface Master {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  active: boolean;
  link: string;
  upcoming: number;
}

export interface MasterDraft {
  id?: string;
  name: string;
  phone: string;
  email: string;
  active: boolean;
  new_link?: boolean;
}

interface Props {
  masters: Master[];
  busy: boolean;
  onSave: (draft: MasterDraft) => Promise<boolean>;
}

const empty: MasterDraft = { name: '', phone: '', email: '', active: true };

const MastersSection = ({ masters, busy, onSave }: Props) => {
  const [draft, setDraft] = useState<MasterDraft | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const copy = async (m: Master) => {
    try {
      await navigator.clipboard.writeText(m.link);
      setCopied(m.id);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      window.prompt('Nokopējiet saiti:', m.link);
    }
  };

  const save = async () => {
    if (!draft || !draft.name.trim()) return;
    if (await onSave(draft)) setDraft(null);
  };

  const field = (key: 'name' | 'phone' | 'email', label: string, type = 'text') => (
    <label className="block text-sm text-gray-300">
      {label}
      <input
        type={type}
        value={draft?.[key] ?? ''}
        onChange={(e) => setDraft((d) => (d ? { ...d, [key]: e.target.value } : d))}
        className="mt-1 w-full rounded-lg bg-gray-800 border border-gray-600 px-3 py-2 text-white"
      />
    </label>
  );

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-green-400">
          Pirtnieki <span className="text-gray-400 font-normal">· {masters.filter((m) => m.active).length}</span>
        </h2>
        {!draft && (
          <button
            onClick={() => setDraft({ ...empty })}
            className="inline-flex items-center gap-2 rounded-lg bg-gray-800 hover:bg-gray-700 px-3 py-2 text-sm"
          >
            <UserPlus className="w-4 h-4" /> Pievienot pirtnieku
          </button>
        )}
      </div>

      {draft && (
        <div className="rounded-xl border border-green-500/30 bg-[#0d0d0d] p-4 space-y-3 max-w-xl">
          <h3 className="font-semibold">{draft.id ? 'Labot pirtnieku' : 'Jauns pirtnieks'}</h3>
          {field('name', 'Vārds')}
          <div className="grid gap-3 sm:grid-cols-2">
            {field('phone', 'Tālrunis', 'tel')}
            {field('email', 'E-pasts', 'email')}
          </div>
          {draft.id && (
            <>
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={draft.active}
                  onChange={(e) => setDraft((d) => (d ? { ...d, active: e.target.checked } : d))}
                />
                Aktīvs (var piešķirt rezervācijām)
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={!!draft.new_link}
                  onChange={(e) => setDraft((d) => (d ? { ...d, new_link: e.target.checked } : d))}
                />
                Izveidot jaunu saiti (vecā vairs nestrādās)
              </label>
            </>
          )}
          <div className="flex gap-2">
            <button
              onClick={save}
              disabled={busy || !draft.name.trim()}
              className="rounded-lg bg-green-600 hover:bg-green-500 disabled:bg-gray-600 px-4 py-2 text-sm font-semibold text-black"
            >
              Saglabāt
            </button>
            <button onClick={() => setDraft(null)} className="rounded-lg bg-gray-800 hover:bg-gray-700 px-4 py-2 text-sm">
              Atcelt
            </button>
          </div>
        </div>
      )}

      {masters.length === 0 && !draft && (
        <p className="text-gray-400">Vēl nav neviena pirtnieka. Pievienojiet, lai varētu viņiem piešķirt rezervācijas.</p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        {masters.map((m) => (
          <article
            key={m.id}
            className={`rounded-xl border bg-[#0d0d0d] p-4 space-y-2 ${m.active ? 'border-gray-800' : 'border-gray-900 opacity-60'}`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold">
                {m.name} {!m.active && <span className="text-xs text-gray-500">(neaktīvs)</span>}
              </span>
              <button
                onClick={() => setDraft({ id: m.id, name: m.name, phone: m.phone ?? '', email: m.email ?? '', active: m.active })}
                className="text-gray-400 hover:text-white"
                title="Labot"
              >
                <Pencil className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-gray-400">
              {[m.phone, m.email].filter(Boolean).join(' · ') || 'Kontakti nav norādīti'}
            </p>
            <p className="text-sm text-gray-300">Piešķirtas nākamās rezervācijas: {m.upcoming}</p>
            <button
              onClick={() => copy(m)}
              className="inline-flex items-center gap-2 rounded-lg border border-green-600/50 text-green-300 hover:bg-green-900/30 px-3 py-1.5 text-sm"
            >
              <Copy className="w-4 h-4" />
              {copied === m.id ? 'Saite nokopēta' : 'Kopēt pirtnieka saiti'}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
};

export default MastersSection;

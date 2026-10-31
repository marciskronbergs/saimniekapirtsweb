// A booking's day, time and sauna, as the office sets them: when moving a
// booking, or giving a postponed one its new day. Whether the guest is told
// is the office's choice.

export interface Slot {
  id: string;
  date: string;
  time: string;
  sauna: string;
  notify: boolean;
}

const field = 'rounded-lg bg-gray-800 border border-gray-600 px-2 py-1.5 text-white';

export const SlotEditor = ({ title, slot, email, busy, saving, onChange, onSave, onClose }: {
  title: string;
  slot: Slot;
  email: string;
  busy: boolean;
  saving: boolean;
  onChange: (slot: Slot) => void;
  onSave: () => void;
  onClose: () => void;
}) => (
  <form
    onSubmit={(e) => { e.preventDefault(); onSave(); }}
    className="rounded-lg border border-gray-700 bg-black/40 p-3 space-y-3 text-sm"
  >
    <p className="font-semibold text-white">{title}</p>
    <div className="flex flex-wrap gap-2">
      <input
        type="date"
        value={slot.date}
        onChange={(e) => onChange({ ...slot, date: e.target.value })}
        required
        aria-label="Datums"
        className={field}
      />
      <input
        type="time"
        value={slot.time}
        onChange={(e) => onChange({ ...slot, time: e.target.value })}
        required
        aria-label="Laiks"
        className={field}
      />
      <select
        value={slot.sauna}
        onChange={(e) => onChange({ ...slot, sauna: e.target.value })}
        aria-label="Pirts"
        className={field}
      >
        <option>Baltā pirts</option>
        <option>Pelēkā pirts</option>
      </select>
    </div>
    <label className="flex items-center gap-2 text-gray-300">
      <input
        type="checkbox"
        checked={slot.notify}
        onChange={(e) => onChange({ ...slot, notify: e.target.checked })}
      />
      Paziņot klientam uz {email}
    </label>
    <div className="flex flex-wrap gap-2">
      <button
        type="submit"
        disabled={busy}
        className="rounded-lg bg-green-600 hover:bg-green-500 disabled:opacity-50 px-3 py-1.5 font-semibold text-black"
      >
        {saving ? 'Saglabā…' : 'Saglabāt'}
      </button>
      <button
        type="button"
        onClick={onClose}
        className="rounded-lg border border-gray-600 px-3 py-1.5 text-gray-300 hover:bg-gray-800"
      >
        Atpakaļ
      </button>
    </div>
  </form>
);

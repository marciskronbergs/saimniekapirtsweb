import { useEffect, useState } from 'react';
import { Copy, CreditCard, ExternalLink, QrCode, Send, X } from 'lucide-react';
import { eur } from '../../lib/officeApi';

// The office's buttons on a booking or gift card order: send the guest their
// invoice, with or without a link to pay it by card, or show that link as a
// QR code for a guest who wants to pay by card on site.

interface InvoiceActionsProps {
  // After the visit only the final invoice can be sent, and nothing is left to pay.
  settled: boolean;
  cardPayments: boolean;
  busy: boolean;
  onSend: (withLink: boolean) => void;
  onPayLink: () => void;
}

const buttonClass =
  'inline-flex items-center gap-1.5 rounded-lg border border-gray-600 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 px-2.5 py-1.5 text-sm';

export const InvoiceActions = ({ settled, cardPayments, busy, onSend, onPayLink }: InvoiceActionsProps) => (
  <div className="flex flex-wrap gap-2">
    <button type="button" onClick={() => onSend(false)} disabled={busy} className={buttonClass}>
      <Send className="w-4 h-4 text-green-400" />
      Sūtīt rēķinu
    </button>
    {!settled && cardPayments && (
      <>
        <button type="button" onClick={() => onSend(true)} disabled={busy} className={buttonClass}>
          <CreditCard className="w-4 h-4 text-green-400" />
          Sūtīt rēķinu ar maksājuma saiti
        </button>
        <button type="button" onClick={onPayLink} disabled={busy} className={buttonClass}>
          <QrCode className="w-4 h-4 text-green-400" />
          Saite / QR apmaksai
        </button>
      </>
    )}
  </div>
);

export interface PayLink {
  name: string;
  number: string;
  total: number;
  link: string;
}

// The payment link as a QR code: the guest scans it with their phone camera
// and pays by card there.
export const PayLinkDialog = ({ pay, onClose }: { pay: PayLink; onClose: () => void }) => {
  const [qr, setQr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let live = true;
    import('qrcode')
      .then((QRCode) => QRCode.toDataURL(pay.link, { width: 320, margin: 1, errorCorrectionLevel: 'M' }))
      .then((url) => live && setQr(url))
      .catch(() => live && setQr(null));
    return () => {
      live = false;
    };
  }, [pay.link]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(pay.link);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pay-link-title"
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-gray-700 bg-[#0d0d0d] p-5 text-white space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="pay-link-title" className="text-lg font-bold">Apmaksa ar karti</h2>
            <p className="text-sm text-gray-400">
              {pay.name} · rēķins {pay.number} · {eur(pay.total)}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Aizvērt" className="rounded-lg p-1 hover:bg-gray-800">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex justify-center rounded-xl bg-white p-3">
          {qr ? (
            <img src={qr} alt="QR kods apmaksai ar karti" className="w-64 h-64" />
          ) : (
            <div className="w-64 h-64 flex items-center justify-center text-gray-500 text-sm">Veido QR kodu…</div>
          )}
        </div>
        <p className="text-sm text-gray-300">
          Klients noskenē kodu ar telefona kameru un samaksā ar karti. Pēc apmaksas rēķins tiek atzīmēts kā apmaksāts,
          un klients to saņem e-pastā.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={copy}
            className="inline-flex items-center gap-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 px-3 py-2 text-sm"
          >
            <Copy className="w-4 h-4" />
            {copied ? 'Nokopēts' : 'Kopēt saiti'}
          </button>
          <a
            href={pay.link}
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 px-3 py-2 text-sm"
          >
            <ExternalLink className="w-4 h-4" />
            Atvērt
          </a>
        </div>
      </div>
    </div>
  );
};

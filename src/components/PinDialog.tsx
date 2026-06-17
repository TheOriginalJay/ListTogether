import { useState } from 'react';
import { Lock, X } from 'lucide-react';

/**
 * PIN entry/setup modal. onSubmit returns an error string to display, or null on success.
 */
export function PinDialog({ mode, title, onSubmit, onClose }: {
  mode: 'set' | 'enter';
  title?: string;
  onSubmit: (pin: string) => Promise<string | null>;
  onClose: () => void;
}) {
  const [pin, setPin] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError('');
    if (!/^\d{4,8}$/.test(pin)) { setError('Use 4–8 digits'); return; }
    if (mode === 'set' && pin !== confirm) { setError('PINs don’t match'); return; }
    setBusy(true);
    const err = await onSubmit(pin);
    setBusy(false);
    if (err) setError(err);
  };

  const heading = title || (mode === 'set' ? 'Set a PIN' : 'Enter PIN');

  return (
    <div className="fixed inset-0 z-[110] bg-black/50 backdrop-blur-sm flex items-center justify-center p-6" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 max-w-xs w-full" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#D97706]/10 flex items-center justify-center">
              <Lock className="w-4.5 h-4.5 text-[#D97706]" />
            </div>
            <h2 className="font-semibold text-[#1A1A1A]">{heading}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#F5F5F0] text-[#6B6B5F]" aria-label="Close"><X className="w-5 h-5" /></button>
        </div>

        <input
          type="password"
          inputMode="numeric"
          autoFocus
          value={pin}
          onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
          onKeyDown={e => { if (e.key === 'Enter' && mode === 'enter') submit(); }}
          placeholder="PIN"
          className="w-full bg-[#F5F5F0] rounded-xl px-4 py-3 text-center tracking-[0.4em] text-lg font-semibold text-[#1A1A1A] placeholder:tracking-normal placeholder:text-[#C4C4BC] focus:bg-white focus:ring-2 focus:ring-[#D97706]/20 focus:outline-none transition-all mb-3"
        />
        {mode === 'set' && (
          <input
            type="password"
            inputMode="numeric"
            value={confirm}
            onChange={e => setConfirm(e.target.value.replace(/\D/g, ''))}
            onKeyDown={e => { if (e.key === 'Enter') submit(); }}
            placeholder="Confirm PIN"
            className="w-full bg-[#F5F5F0] rounded-xl px-4 py-3 text-center tracking-[0.4em] text-lg font-semibold text-[#1A1A1A] placeholder:tracking-normal placeholder:text-[#C4C4BC] focus:bg-white focus:ring-2 focus:ring-[#D97706]/20 focus:outline-none transition-all mb-3"
          />
        )}
        {error && <p className="text-xs text-red-600 mb-3 text-center">{error}</p>}

        <button
          onClick={submit}
          disabled={busy}
          className="w-full h-11 bg-[#1A1A1A] text-white rounded-xl text-sm font-medium hover:bg-[#333] active:scale-[0.98] transition-all disabled:opacity-50"
        >
          {busy ? 'Please wait…' : mode === 'set' ? 'Set PIN' : 'Unlock'}
        </button>
      </div>
    </div>
  );
}

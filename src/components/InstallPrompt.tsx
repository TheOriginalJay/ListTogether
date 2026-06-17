import { useState } from 'react';
import { Download, X, Share, Plus, Smartphone } from 'lucide-react';
import { usePwaInstall } from '@/hooks/usePwaInstall';

const DISMISS_KEY = 'bagged_install_dismissed';

/**
 * `banner` — a slim, dismissible prompt for the top of the app shell.
 * `card`   — a persistent section for the Settings page.
 */
export function InstallPrompt({ variant = 'banner' }: { variant?: 'banner' | 'card' }) {
  const { canInstall, isIOS, isStandalone, promptInstall } = usePwaInstall();
  const [dismissed, setDismissed] = useState(
    () => typeof localStorage !== 'undefined' && localStorage.getItem(DISMISS_KEY) === '1'
  );
  const [showIOSHelp, setShowIOSHelp] = useState(false);

  // Already installed, or nothing actionable to offer.
  if (isStandalone) return null;
  const actionable = canInstall || isIOS;
  if (!actionable) return null;

  const handleInstall = async () => {
    if (canInstall) {
      await promptInstall();
    } else if (isIOS) {
      setShowIOSHelp(v => !v);
    }
  };

  const iosSteps = (
    <div className="mt-3 rounded-xl bg-[#F5F5F0] p-3 text-xs text-[#6B6B5F] leading-relaxed space-y-1.5">
      <p className="flex items-center gap-1.5">
        <span className="font-semibold text-[#1A1A1A]">1.</span> Tap the
        <Share className="w-3.5 h-3.5 inline" /> Share button in Safari.
      </p>
      <p className="flex items-center gap-1.5">
        <span className="font-semibold text-[#1A1A1A]">2.</span> Choose
        <Plus className="w-3.5 h-3.5 inline" /> “Add to Home Screen”.
      </p>
      <p><span className="font-semibold text-[#1A1A1A]">3.</span> Tap “Add”. Bagged appears on your home screen.</p>
    </div>
  );

  if (variant === 'card') {
    return (
      <section className="bg-white rounded-2xl border border-[#E5E5E0]/60 p-5 sm:p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl bg-[#D97706]/10 flex items-center justify-center">
            <Smartphone className="w-4.5 h-4.5 text-[#D97706]" />
          </div>
          <h2 className="font-semibold text-[#1A1A1A]">Install Bagged</h2>
        </div>
        <p className="text-xs text-[#9CA3AF] leading-relaxed mb-4">
          Add Bagged to your home screen for a full-screen, app-like experience that opens
          instantly and works offline.
        </p>
        <button
          onClick={handleInstall}
          className="w-full h-11 flex items-center justify-center gap-2 bg-[#1A1A1A] text-white rounded-xl text-sm font-medium hover:bg-[#333] active:scale-[0.98] transition-all"
        >
          <Download className="w-4 h-4" />
          {isIOS ? 'How to install' : 'Install app'}
        </button>
        {isIOS && showIOSHelp && iosSteps}
      </section>
    );
  }

  // banner
  if (dismissed) return null;

  const dismiss = () => {
    setDismissed(true);
    try { localStorage.setItem(DISMISS_KEY, '1'); } catch { /* ignore */ }
  };

  return (
    <div className="bg-[#1A1A1A] text-white">
      <div className="max-w-3xl mx-auto px-4 py-2.5 flex items-center gap-3">
        <Smartphone className="w-4 h-4 shrink-0 text-[#D97706]" />
        <p className="text-sm font-medium flex-1 min-w-0 truncate">
          Install Bagged for a faster, app-like experience.
        </p>
        <button
          onClick={handleInstall}
          className="h-8 px-3 bg-[#D97706] rounded-lg text-xs font-semibold hover:bg-[#B45309] active:scale-95 transition-all whitespace-nowrap"
        >
          {isIOS ? 'How' : 'Install'}
        </button>
        <button onClick={dismiss} aria-label="Dismiss" className="p-1 text-white/60 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
      {isIOS && showIOSHelp && (
        <div className="max-w-3xl mx-auto px-4 pb-3">{iosSteps}</div>
      )}
    </div>
  );
}

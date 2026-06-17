import { Mic } from 'lucide-react';
import { useSpeechToText } from '@/hooks/useSpeechToText';

/**
 * Mic button for voice dictation. Renders nothing on unsupported browsers.
 * Calls onText with the recognized transcript.
 */
export function VoiceButton({ onText, className = '', title = 'Dictate' }: {
  onText: (text: string) => void;
  className?: string;
  title?: string;
}) {
  const { supported, listening, start, stop } = useSpeechToText();
  if (!supported) return null;

  return (
    <button
      type="button"
      onClick={() => (listening ? stop() : start(onText))}
      title={listening ? 'Listening… tap to stop' : title}
      aria-label={listening ? 'Stop dictation' : title}
      className={`flex items-center justify-center rounded-lg transition-all ${
        listening ? 'text-white bg-[#D97706] animate-pulse' : 'text-[#9CA3AF] hover:text-[#1A1A1A] hover:bg-[#F5F5F0]'
      } ${className}`}
    >
      <Mic className="w-4 h-4" />
    </button>
  );
}

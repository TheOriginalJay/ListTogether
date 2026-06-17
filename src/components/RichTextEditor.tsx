import { useEffect, useRef } from 'react';
import { Bold, Italic, Underline, Strikethrough, Heading1, Heading2, List, ListOrdered, Quote } from 'lucide-react';
import { sanitizeHtml, ensureHtml } from '@/lib/html';

interface Props {
  initialHtml: string;
  onChange: (html: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

type Cmd = { icon: typeof Bold; label: string; run: () => void };

/**
 * Lightweight WYSIWYG editor (contentEditable + document.execCommand).
 * Uncontrolled by design: we set innerHTML once so the caret never jumps,
 * and emit sanitized HTML on input.
 */
export function RichTextEditor({ initialHtml, onChange, placeholder, autoFocus }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.innerHTML = ensureHtml(initialHtml);
      if (autoFocus) ref.current.focus();
    }
    // initialHtml is the seed for this note instance only (keyed by note id upstream)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const emit = () => {
    if (ref.current) onChange(sanitizeHtml(ref.current.innerHTML));
  };

  const exec = (command: string, value?: string) => {
    ref.current?.focus();
    document.execCommand(command, false, value);
    emit();
  };

  const commands: Cmd[] = [
    { icon: Bold, label: 'Bold', run: () => exec('bold') },
    { icon: Italic, label: 'Italic', run: () => exec('italic') },
    { icon: Underline, label: 'Underline', run: () => exec('underline') },
    { icon: Strikethrough, label: 'Strikethrough', run: () => exec('strikeThrough') },
    { icon: Heading1, label: 'Heading 1', run: () => exec('formatBlock', 'H1') },
    { icon: Heading2, label: 'Heading 2', run: () => exec('formatBlock', 'H2') },
    { icon: List, label: 'Bulleted list', run: () => exec('insertUnorderedList') },
    { icon: ListOrdered, label: 'Numbered list', run: () => exec('insertOrderedList') },
    { icon: Quote, label: 'Quote', run: () => exec('formatBlock', 'BLOCKQUOTE') },
  ];

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-0.5 flex-wrap pb-2 mb-1 border-b border-black/5">
        {commands.map(({ icon: Icon, label, run }) => (
          <button
            key={label}
            type="button"
            onMouseDown={e => { e.preventDefault(); run(); }}
            title={label}
            aria-label={label}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-[#6B6B5F] hover:bg-black/5 hover:text-[#1A1A1A] transition-colors"
          >
            <Icon className="w-4 h-4" />
          </button>
        ))}
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={emit}
        onBlur={emit}
        data-placeholder={placeholder || 'Start writing…'}
        className="rte min-h-[40vh] bg-transparent text-[15px] leading-relaxed text-[#1F2937] focus:outline-none"
      />
    </div>
  );
}

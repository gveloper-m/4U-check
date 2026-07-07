import { useEffect, useId, useRef, useState } from 'react';
import { HelpCircle } from 'lucide-react';

interface InfoTooltipProps {
  text: string;
  className?: string;
  align?: 'center' | 'left' | 'right';
}

export default function InfoTooltip({ text, className = '', align = 'center' }: InfoTooltipProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLSpanElement>(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!text) return null;

  const alignClass =
    align === 'left' ? 'left-0' : align === 'right' ? 'right-0' : 'left-1/2 -translate-x-1/2';

  return (
    <span ref={rootRef} className={`relative inline-flex ${className}`}>
      <button
        type="button"
        aria-label="More info"
        aria-describedby={open ? id : undefined}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((p) => !p);
        }}
        className="inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 focus:outline-none focus-visible:ring-1 focus-visible:ring-violet-500 rounded-full"
      >
        <HelpCircle className="h-3.5 w-3.5" />
      </button>
      {open && (
        <span
          id={id}
          role="tooltip"
          className={`absolute bottom-full z-30 mb-2 w-56 rounded-lg bg-gray-900 px-3 py-2 text-xs font-normal leading-snug text-white shadow-lg dark:bg-gray-700 ${alignClass}`}
        >
          {text}
          <span
            className={`absolute top-full h-2 w-2 rotate-45 bg-gray-900 dark:bg-gray-700 ${
              align === 'left' ? 'left-2' : align === 'right' ? 'right-2' : 'left-1/2 -translate-x-1/2'
            }`}
          />
        </span>
      )}
    </span>
  );
}

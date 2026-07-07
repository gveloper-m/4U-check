import { useState } from 'react';
import { X, Code2 } from 'lucide-react';

export interface GalleryItem {
  src: string;
  caption: string;
  code?: string;
  badge?: string;
}

export default function ScreenshotGallery({ items }: { items: GalleryItem[] }) {
  const [active, setActive] = useState<GalleryItem | null>(null);

  if (items.length === 0) return null;

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((item, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setActive(item)}
            className="group flex flex-col overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-left transition-colors hover:border-violet-400 dark:hover:border-violet-500"
          >
            <div className="relative h-28 w-full overflow-hidden bg-gray-100 dark:bg-gray-800">
              <img
                src={item.src}
                alt={item.caption}
                loading="lazy"
                className="h-full w-full object-cover object-top transition-transform group-hover:scale-105"
              />
              {item.badge && (
                <span className="absolute left-1.5 top-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white">
                  {item.badge}
                </span>
              )}
            </div>
            <div className="px-2.5 py-2">
              <p className="truncate text-xs font-medium text-gray-700 dark:text-gray-300">{item.caption}</p>
              {item.code && (
                <p className="mt-0.5 flex items-center gap-1 truncate font-mono text-[10px] text-gray-500">
                  <Code2 className="h-2.5 w-2.5 shrink-0" />
                  {item.code}
                </p>
              )}
            </div>
          </button>
        ))}
      </div>

      {active && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setActive(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative max-h-full max-w-4xl overflow-auto rounded-xl bg-white dark:bg-gray-900 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setActive(null)}
              aria-label="Close"
              className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
            >
              <X className="h-4 w-4" />
            </button>
            <img src={active.src} alt={active.caption} className="max-h-[75vh] w-full object-contain bg-gray-100 dark:bg-gray-950" />
            <div className="p-4">
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{active.caption}</p>
              {active.code && (
                <p className="mt-1 flex items-center gap-1.5 break-all rounded bg-gray-100 dark:bg-gray-800 px-2 py-1.5 font-mono text-xs text-gray-600 dark:text-gray-400">
                  <Code2 className="h-3.5 w-3.5 shrink-0" />
                  {active.code}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

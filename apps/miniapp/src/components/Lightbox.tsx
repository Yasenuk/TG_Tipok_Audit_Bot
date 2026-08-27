import { useEffect, useRef, useState } from 'react';
import { getPhotoUrl } from '../lib/photos.js';

interface Props {
  photos: string[];
  startIndex: number;
  onClose: () => void;
}

const SWIPE_THRESHOLD_PX = 50;

export function Lightbox({ photos, startIndex, onClose }: Props) {
  const [index, setIndex] = useState(startIndex);
  const [url, setUrl] = useState<string | null>(null);
  const touchStartX = useRef<number | null>(null);

  const key = photos[index];
  const many = photos.length > 1;

  const go = (delta: number) => {
    setIndex((current) => (current + delta + photos.length) % photos.length);
  };

  useEffect(() => {
    if (!key) return;

    let alive = true;
    setUrl(null);

    void getPhotoUrl(key)
      .then((value) => {
        if (alive) setUrl(value);
      })
      .catch(() => {
        if (alive) setUrl(null);
      });

    return () => {
      alive = false;
    };
  }, [key]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowLeft') go(-1);
      if (event.key === 'ArrowRight') go(1);
    };

    // Поки галерея відкрита, сторінка під нею не має скролитись
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [photos.length]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex flex-col bg-black/95"
      onClick={onClose}
      onTouchStart={(event) => {
        touchStartX.current = event.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(event) => {
        const start = touchStartX.current;
        const end = event.changedTouches[0]?.clientX;
        touchStartX.current = null;

        if (start === null || end === undefined || !many) return;

        const delta = end - start;
        if (Math.abs(delta) > SWIPE_THRESHOLD_PX) go(delta > 0 ? -1 : 1);
      }}
    >
      <header className="flex items-center justify-between p-4 text-white">
        <span className="text-sm opacity-80">{many ? `${index + 1} / ${photos.length}` : ''}</span>

        <button
          type="button"
          onClick={onClose}
          aria-label="Закрити"
          className="h-8 w-8 text-2xl leading-none"
        >
          ×
        </button>
      </header>

      <div className="flex flex-1 items-center justify-center overflow-hidden px-2 pb-4">
        {url ? (
          <img
            src={url}
            alt=""
            onClick={(event) => event.stopPropagation()}
            className="max-h-full max-w-full object-contain"
          />
        ) : (
          <p className="text-sm text-white/60">Завантаження…</p>
        )}
      </div>

      {many && (
        <>
          <button
            type="button"
            aria-label="Попереднє фото"
            onClick={(event) => {
              event.stopPropagation();
              go(-1);
            }}
            className="absolute left-0 top-1/2 h-20 w-14 -translate-y-1/2 text-3xl text-white/70"
          >
            ‹
          </button>

          <button
            type="button"
            aria-label="Наступне фото"
            onClick={(event) => {
              event.stopPropagation();
              go(1);
            }}
            className="absolute right-0 top-1/2 h-20 w-14 -translate-y-1/2 text-3xl text-white/70"
          >
            ›
          </button>
        </>
      )}
    </div>
  );
}

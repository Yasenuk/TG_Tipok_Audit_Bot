import { useEffect, useState } from 'react';
import { getPhotoUrl } from '../lib/photos.js';

interface Props {
  photoKey: string;
  onClick?: () => void;
}

export function PhotoThumb({ photoKey, onClick }: Props) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    void getPhotoUrl(photoKey)
      .then((value) => {
        if (alive) setUrl(value);
      })
      .catch(() => {
        if (alive) setUrl(null);
      });

    return () => {
      alive = false;
    };
  }, [photoKey]);

  const className = 'h-16 w-16 rounded-lg bg-bg object-cover';

  if (!url) return <div className="h-16 w-16 animate-pulse rounded-lg bg-bg" />;

  if (!onClick) return <img src={url} alt="" className={className} />;

  return (
    <button type="button" onClick={onClick} aria-label="Відкрити фото">
      <img src={url} alt="" className={className} />
    </button>
  );
}

import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';

interface Props {
  photoKey: string;
}

/** Фото в R2 приватні — посилання підписується на годину при кожному показі */
export function PhotoThumb({ photoKey }: Props) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    void api
      .get<{ url: string }>('/uploads/sign-get', { params: { key: photoKey } })
      .then((res) => {
        if (alive) setUrl(res.data.url);
      })
      .catch(() => {
        if (alive) setUrl(null);
      });

    return () => {
      alive = false;
    };
  }, [photoKey]);

  if (!url) return <div className="h-16 w-16 rounded-lg bg-bg" />;

  return (
    <a href={url} target="_blank" rel="noreferrer">
      <img src={url} alt="" className="h-16 w-16 rounded-lg bg-bg object-cover" />
    </a>
  );
}

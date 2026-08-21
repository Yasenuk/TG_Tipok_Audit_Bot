import { useRef, useState } from 'react';
import { MAX_PHOTOS_PER_ITEM } from '@sa/shared';
import { uploadPhoto } from '../lib/upload.js';

interface Props {
  photos: string[];
  onChange: (photos: string[]) => void;
}

export function PhotoPicker({ photos, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const full = photos.length >= MAX_PHOTOS_PER_ITEM;

  const pick = async (file: File) => {
    setBusy(true);
    setError(null);

    const localUrl = URL.createObjectURL(file);

    try {
      const key = await uploadPhoto(file);
      setPreviews((prev) => ({ ...prev, [key]: localUrl }));
      onChange([...photos, key]);
    } catch {
      URL.revokeObjectURL(localUrl);
      setError('Фото не завантажилось');
    } finally {
      setBusy(false);
    }
  };

  const remove = (key: string) => {
    const url = previews[key];
    if (url) URL.revokeObjectURL(url);

    onChange(photos.filter((item) => item !== key));
  };

  return (
    <div className="mt-2">
      <div className="flex flex-wrap gap-2">
        {photos.map((key) => (
          <div key={key} className="relative">
            <img
              src={previews[key]}
              alt=""
              className="h-16 w-16 rounded-lg bg-bg object-cover"
            />
            <button
              type="button"
              onClick={() => remove(key)}
              aria-label="Видалити фото"
              className="absolute -right-1 -top-1 h-5 w-5 rounded-full bg-bg text-xs leading-5"
            >
              ×
            </button>
          </div>
        ))}

        {!full && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="h-16 w-16 rounded-lg border border-dashed border-muted text-xl text-muted disabled:opacity-50"
          >
            {busy ? '…' : '+'}
          </button>
        )}
      </div>

      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = '';
          if (file) void pick(file);
        }}
      />
    </div>
  );
}

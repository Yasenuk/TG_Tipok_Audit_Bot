import { useCallback, useEffect, useState } from 'react';

interface StoredDraft<T> {
  savedAt: number;
  data: T;
}

const TTL_MS = 48 * 60 * 60 * 1000;

export function useDraft<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return initial;

      const draft = JSON.parse(raw) as StoredDraft<T>;
      if (Date.now() - draft.savedAt > TTL_MS) {
        localStorage.removeItem(key);
        return initial;
      }

      return { ...initial, ...draft.data };
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      const draft: StoredDraft<T> = { savedAt: Date.now(), data: value };
      localStorage.setItem(key, JSON.stringify(draft));
    }, 300);

    return () => clearTimeout(timer);
  }, [key, value]);

  const clear = useCallback(() => localStorage.removeItem(key), [key]);

  return [value, setValue, clear] as const;
}

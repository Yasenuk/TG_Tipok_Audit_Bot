import { useCallback, useEffect, useState } from 'react';
import { api, apiError } from '../lib/api.js';

export function useResource<T>(path: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);

    try {
      const response = await api.get<T>(path);
      setData(response.data);
      setError(null);
    } catch (cause) {
      setError(apiError(cause));
    } finally {
      setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, error, loading, reload };
}

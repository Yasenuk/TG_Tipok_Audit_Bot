import { useState } from 'react';
import type { AdminStoreDto } from '@sa/shared';
import { api, apiError } from '../../lib/api.js';
import { useResource } from '../../hooks/useResource.js';

export function StoresTab() {
  const { data, error, loading, reload } = useResource<AdminStoreDto[]>('/admin/stores');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const add = async () => {
    setBusy(true);
    setFormError(null);

    try {
      await api.post('/admin/stores', { city: city.trim(), address: address.trim() });
      setCity('');
      setAddress('');
      await reload();
    } catch (cause) {
      setFormError(apiError(cause));
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (store: AdminStoreDto) => {
    try {
      await api.patch(`/admin/stores/${store.id}`, { isActive: !store.isActive });
      await reload();
    } catch (cause) {
      setFormError(apiError(cause));
    }
  };

  if (loading) return <p className="text-sm text-muted">Завантаження…</p>;
  if (error) return <p className="text-sm text-red-500">{error}</p>;

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-xl bg-surface p-3">
        <input
          value={city}
          onChange={(event) => setCity(event.target.value)}
          placeholder="Місто, напр. м. Тернопіль"
          className="mb-2 w-full rounded-lg bg-bg p-2 text-sm placeholder:text-muted"
        />
        <input
          value={address}
          onChange={(event) => setAddress(event.target.value)}
          placeholder="Адреса, напр. вул. Мазепи, 28/3"
          className="mb-2 w-full rounded-lg bg-bg p-2 text-sm placeholder:text-muted"
        />
        <button
          type="button"
          onClick={() => void add()}
          disabled={busy || !city.trim() || !address.trim()}
          className="w-full rounded-lg bg-accent p-2 text-sm text-accent-fg disabled:opacity-50"
        >
          Додати точку
        </button>

        {formError && <p className="mt-2 text-xs text-red-500">{formError}</p>}
      </div>

      {data?.map((store) => (
        <div
          key={store.id}
          className={`rounded-xl bg-surface p-3 ${store.isActive ? '' : 'opacity-50'}`}
        >
          <p className="font-medium">{store.city}</p>
          <p className="text-sm text-muted">{store.address}</p>
          <p className="mt-1 text-xs text-muted">Аркуш: {store.sheetName}</p>

          <button
            type="button"
            onClick={() => void toggle(store)}
            className="mt-2 text-sm text-accent"
          >
            {store.isActive ? 'Деактивувати' : 'Активувати'}
          </button>
        </div>
      ))}
    </div>
  );
}

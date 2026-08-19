import { useEffect, useState } from 'react';
import type { MeResponse, StoreDto } from '@sa/shared';
import { api } from '../lib/api.js';

interface Props {
  me: MeResponse;
  onPick: (storeId: string) => void;
  onAdmin: () => void;
}

export function StoreSelect({ me, onPick, onAdmin }: Props) {
  const [stores, setStores] = useState<StoreDto[]>([]);

  useEffect(() => {
    void api.get<StoreDto[]>('/stores').then((res) => setStores(res.data));
  }, []);

  return (
    <section className="flex flex-col gap-3">
      <h1 className="text-lg font-semibold">Оберіть точку</h1>

      {stores.map((store) => (
        <button
          key={store.id}
          type="button"
          onClick={() => onPick(store.id)}
          className="rounded-xl bg-surface p-3 text-left"
        >
          <span className="block font-medium">{store.city}</span>
          <span className="block text-sm text-muted">{store.address}</span>
        </button>
      ))}

      {me.role === 'ADMIN' && (
        <button type="button" onClick={onAdmin} className="mt-2 text-sm text-accent">
          Адмін-панель
        </button>
      )}
    </section>
  );
}

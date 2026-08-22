import { useEffect, useState } from 'react';
import type { MeResponse, StoreDto } from '@sa/shared';
import { api } from '../lib/api.js';

interface Props {
  me: MeResponse;
  onPick: (storeId: string) => void;
  onHistory: () => void;
  onAdmin: () => void;
}

export function StoreSelect({ me, onPick, onHistory, onAdmin }: Props) {
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

      <div className="mt-2 flex gap-4">
        <button type="button" onClick={onHistory} className="text-sm text-accent">
          Мої перевірки
        </button>

        {me.role === 'ADMIN' && (
          <button type="button" onClick={onAdmin} className="text-sm text-accent">
            Адмін-панель
          </button>
        )}
      </div>
    </section>
  );
}

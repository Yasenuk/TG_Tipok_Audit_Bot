import { useState } from 'react';
import type { AdminChecklistItemDto } from '@sa/shared';
import { api, apiError } from '../../lib/api.js';
import { useResource } from '../../hooks/useResource.js';

export function ChecklistTab() {
  const { data, error, loading, reload } = useResource<AdminChecklistItemDto[]>('/admin/checklist');
  const [label, setLabel] = useState('');
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const run = async (action: () => Promise<unknown>) => {
    setBusy(true);
    setFormError(null);

    try {
      await action();
      await reload();
    } catch (cause) {
      setFormError(apiError(cause));
    } finally {
      setBusy(false);
    }
  };

  const move = (index: number, direction: -1 | 1) => {
    if (!data) return;

    const next = [...data];
    const current = next[index];
    const swap = next[index + direction];
    if (!current || !swap) return;

    next[index] = swap;
    next[index + direction] = current;

    // Сервер чекає повний список у потрібному порядку
    void run(() => api.patch('/admin/checklist/reorder', { ids: next.map((item) => item.id) }));
  };

  if (loading) return <p className="text-sm text-muted">Завантаження…</p>;
  if (error) return <p className="text-sm text-red-500">{error}</p>;

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-xl bg-surface p-3">
        <input
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          placeholder="Новий пункт чек-листа"
          maxLength={200}
          className="mb-2 w-full rounded-lg bg-bg p-2 text-sm placeholder:text-muted"
        />
        <button
          type="button"
          onClick={() =>
            void run(async () => {
              await api.post('/admin/checklist', { label: label.trim() });
              setLabel('');
            })
          }
          disabled={busy || !label.trim()}
          className="w-full rounded-lg bg-accent p-2 text-sm text-accent-fg disabled:opacity-50"
        >
          Додати пункт
        </button>

        {formError && <p className="mt-2 text-xs text-red-500">{formError}</p>}
      </div>

      {data?.map((item, index) => (
        <div
          key={item.id}
          className={`flex items-center gap-2 rounded-xl bg-surface p-3 ${
            item.isActive ? '' : 'opacity-50'
          }`}
        >
          <div className="flex flex-col">
            <button
              type="button"
              onClick={() => move(index, -1)}
              disabled={busy || index === 0}
              aria-label="Вище"
              className="text-xs text-muted disabled:opacity-30"
            >
              ▲
            </button>
            <button
              type="button"
              onClick={() => move(index, 1)}
              disabled={busy || index === data.length - 1}
              aria-label="Нижче"
              className="text-xs text-muted disabled:opacity-30"
            >
              ▼
            </button>
          </div>

          <p className="flex-1 text-sm">{item.label}</p>

          <button
            type="button"
            onClick={() =>
              void run(() => api.patch(`/admin/checklist/${item.id}`, { isActive: !item.isActive }))
            }
            className="text-xs text-accent"
          >
            {item.isActive ? 'Сховати' : 'Повернути'}
          </button>
        </div>
      ))}
    </div>
  );
}

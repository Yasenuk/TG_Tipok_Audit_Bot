import { useEffect, useState } from 'react';
import { calcScore, formatSummary, type ChecklistItemDto, type MeResponse } from '@sa/shared';
import { api } from '../lib/api.js';
import { useDraft } from '../hooks/useDraft.js';
import { ChecklistRow } from '../components/ChecklistRow.js';

interface Props {
  storeId: string;
  me: MeResponse;
  onDone: () => void;
}

export interface ItemState {
  score: number | null;
  comment: string;
  photos: string[];
}

type FormState = Record<string, ItemState>;

const EMPTY_ITEM: ItemState = { score: null, comment: '', photos: [] };

export function AuditForm({ storeId, me, onDone }: Props) {
  const [items, setItems] = useState<ChecklistItemDto[]>([]);
  const [values, setValues, clearDraft] = useDraft<FormState>(`draft:${me.tgId}:${storeId}`, {});
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void api.get<ChecklistItemDto[]>('/checklist').then((res) => setItems(res.data));
  }, []);

  const untouched = items.filter((item) => (values[item.id]?.score ?? null) === null).length;
  const summary = calcScore(items.map((item) => ({ score: values[item.id]?.score ?? 0 })));

  const patch = (itemId: string, next: Partial<ItemState>) =>
    setValues((prev) => ({
      ...prev,
      [itemId]: { ...EMPTY_ITEM, ...prev[itemId], ...next },
    }));

  const submit = async () => {
    setSending(true);
    setError(null);

    try {
      await api.post('/audits', {
        storeId,
        items: items.map((item) => {
          const value = values[item.id] ?? EMPTY_ITEM;

          return {
            itemId: item.id,
            score: value.score ?? 0,
            comment: value.comment.trim() || undefined,
            photos: value.photos,
          };
        }),
      });

      clearDraft();
      onDone();
    } catch {
      setError('Не вдалося зберегти перевірку. Спробуйте ще раз.');
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="flex flex-col gap-4 pb-28">
      {items.map((item) => (
        <ChecklistRow
          key={item.id}
          item={item}
          value={values[item.id] ?? EMPTY_ITEM}
          onChange={(next) => patch(item.id, next)}
        />
      ))}

      <footer className="fixed inset-x-0 bottom-0 border-t border-surface bg-bg p-4">
        {error && <p className="mb-2 text-center text-sm text-red-500">{error}</p>}

        <p className="mb-2 text-center font-semibold">
          {untouched > 0 ? `Залишилось оцінити: ${untouched}` : formatSummary(summary)}
        </p>

        <button
          type="button"
          onClick={() => void submit()}
          disabled={untouched > 0 || sending}
          className="w-full rounded-xl bg-accent p-3 text-accent-fg disabled:pointer-events-none disabled:opacity-50"
        >
          {sending ? 'Зберігаємо…' : 'Завершити перевірку'}
        </button>
      </footer>
    </section>
  );
}

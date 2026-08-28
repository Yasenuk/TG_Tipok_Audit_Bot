import { useEffect, useState } from 'react';
import { calcScore, formatSummary, type ChecklistItemDto, type MeResponse } from '@sa/shared';
import { api, apiError } from '../lib/api.js';
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

interface FormState {
  sellerName: string;
  items: Record<string, ItemState>;
}

const EMPTY_ITEM: ItemState = { score: null, comment: '', photos: [] };
const EMPTY_FORM: FormState = { sellerName: '', items: {} };

export function AuditForm({ storeId, me, onDone }: Props) {
  const [items, setItems] = useState<ChecklistItemDto[]>([]);
  const [form, setForm, clearDraft] = useDraft<FormState>(
    `draft:v2:${me.tgId}:${storeId}`,
    EMPTY_FORM,
  );
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void api.get<ChecklistItemDto[]>('/checklist').then((res) => setItems(res.data));
  }, []);

  const untouched = items.filter((item) => (form.items[item.id]?.score ?? null) === null).length;
  const summary = calcScore(items.map((item) => ({ score: form.items[item.id]?.score ?? 0 })));
  const sellerMissing = form.sellerName.trim() === '';

  const patch = (itemId: string, next: Partial<ItemState>) =>
    setForm((prev) => ({
      ...prev,
      items: { ...prev.items, [itemId]: { ...EMPTY_ITEM, ...prev.items[itemId], ...next } },
    }));

  const submit = async () => {
    setSending(true);
    setError(null);

    try {
      await api.post('/audits', {
        storeId,
        sellerName: form.sellerName.trim(),
        items: items.map((item) => {
          const value = form.items[item.id] ?? EMPTY_ITEM;

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
    } catch (cause) {
      setError(apiError(cause, 'Не вдалося зберегти перевірку. Спробуйте ще раз.'));
    } finally {
      setSending(false);
    }
  };

  const blocked = untouched > 0 || sellerMissing;

  return (
    <section className="flex flex-col gap-4 pb-28">
      {items.map((item) => (
        <ChecklistRow
          key={item.id}
          item={item}
          value={form.items[item.id] ?? EMPTY_ITEM}
          onChange={(next) => patch(item.id, next)}
        />
      ))}

      <div className="rounded-xl bg-surface p-3">
        <label htmlFor="seller" className="mb-2 block text-sm font-medium">
          ПІБ продавця
        </label>

        <input
          id="seller"
          value={form.sellerName}
          onChange={(event) => setForm((prev) => ({ ...prev, sellerName: event.target.value }))}
          placeholder="Прізвище Імʼя По батькові"
          maxLength={120}
          className="w-full rounded-lg bg-bg p-2 text-sm placeholder:text-muted"
        />
      </div>

      <footer className="fixed inset-x-0 bottom-0 border-t border-surface bg-bg p-4">
        {error && <p className="mb-2 text-center text-sm text-red-500">{error}</p>}

        <p className="mb-2 text-center font-semibold">
          {untouched > 0
            ? `Залишилось оцінити: ${untouched}`
            : sellerMissing
              ? 'Вкажіть ПІБ продавця'
              : formatSummary(summary)}
        </p>

        <button
          type="button"
          onClick={() => void submit()}
          disabled={blocked || sending}
          className="w-full rounded-xl bg-accent p-3 text-accent-fg disabled:pointer-events-none disabled:opacity-50"
        >
          {sending ? 'Зберігаємо…' : 'Завершити перевірку'}
        </button>
      </footer>
    </section>
  );
}

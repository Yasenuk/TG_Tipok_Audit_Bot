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
  score: number;
  comment: string;
  photos: string[];
}

type FormState = Record<string, ItemState>;

export function AuditForm({ storeId, me, onDone }: Props) {
  const [items, setItems] = useState<ChecklistItemDto[]>([]);
  const [values, setValues, clearDraft] = useDraft<FormState>(`draft:${me.tgId}:${storeId}`, {});

  useEffect(() => {
    void api.get<ChecklistItemDto[]>('/checklist').then((res) => setItems(res.data));
  }, []);

  const summary = calcScore(items.map((item) => ({ score: values[item.id]?.score ?? 0 })));

  const patch = (itemId: string, next: Partial<ItemState>) =>
    setValues((prev) => ({
      ...prev,
      [itemId]: { score: 0, comment: '', photos: [], ...prev[itemId], ...next },
    }));

  const submit = async () => {
    // TODO: POST /audits, обробка помилок, стан loading
    clearDraft();
    onDone();
  };

  return (
    <section className="flex flex-col gap-4 pb-24">
      {items.map((item) => (
        <ChecklistRow
          key={item.id}
          item={item}
          value={values[item.id] ?? { score: 0, comment: '', photos: [] }}
          onChange={(next) => patch(item.id, next)}
        />
      ))}

      <footer className="fixed inset-x-0 bottom-0 border-t border-surface bg-bg p-4">
        <p className="mb-2 text-center font-semibold">{formatSummary(summary)}</p>
        <button
          type="button"
          onClick={submit}
          className="w-full rounded-xl bg-accent p-3 text-accent-fg"
        >
          Завершити перевірку
        </button>
      </footer>
    </section>
  );
}

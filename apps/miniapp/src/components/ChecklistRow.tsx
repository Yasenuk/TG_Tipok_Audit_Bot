import type { ChecklistItemDto } from '@sa/shared';
import type { ItemState } from '../pages/AuditForm.js';

interface Props {
  item: ChecklistItemDto;
  value: ItemState;
  onChange: (next: Partial<ItemState>) => void;
}

const SCORES = [0, 1, 2, 3, 4, 5];

export function ChecklistRow({ item, value, onChange }: Props) {
  return (
    <article className="rounded-xl bg-surface p-3">
      <h2 className="mb-2 text-sm font-medium">{item.label}</h2>

      <div className="flex gap-1">
        {SCORES.map((score) => (
          <button
            key={score}
            type="button"
            onClick={() => onChange({ score })}
            className={`h-9 flex-1 rounded-lg text-sm ${
              value.score === score ? 'bg-accent text-accent-fg' : 'bg-bg'
            }`}
          >
            {score === 0 ? '—' : score}
          </button>
        ))}
      </div>

      {/* TODO: коментар + завантаження фото (PhotoPicker) */}
    </article>
  );
}

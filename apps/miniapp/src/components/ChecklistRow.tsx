import type { ChecklistItemDto } from '@sa/shared';
import type { ItemState } from '../pages/AuditForm.js';
import { PhotoPicker } from './PhotoPicker.js';

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

      <textarea
        value={value.comment}
        onChange={(event) => onChange({ comment: event.target.value })}
        placeholder="Коментар (за потреби)"
        rows={2}
        maxLength={500}
        className="mt-2 w-full resize-none rounded-lg bg-bg p-2 text-sm placeholder:text-muted"
      />

      <PhotoPicker photos={value.photos} onChange={(photos) => onChange({ photos })} />
    </article>
  );
}

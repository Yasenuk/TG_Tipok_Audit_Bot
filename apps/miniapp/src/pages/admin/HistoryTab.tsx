import { useState } from 'react';
import type { AuditDetailDto, AuditListItemDto, PagedResponse } from '@sa/shared';
import { useResource } from '../../hooks/useResource.js';
import { PhotoThumb } from '../../components/PhotoThumb.js';

function AuditDetail({ id }: { id: string }) {
  const { data, error, loading } = useResource<AuditDetailDto>(`/audits/${id}`);

  if (loading) return <p className="p-3 text-sm text-muted">Завантаження…</p>;
  if (error) return <p className="p-3 text-sm text-red-500">{error}</p>;
  if (!data) return null;

  return (
    <div className="flex flex-col gap-2 border-t border-bg p-3">
      {data.items.map((item) => (
        <div key={item.itemOrder}>
          <p className="text-sm">
            <span className="font-medium">{item.score === 0 ? '—' : item.score}</span>{' '}
            {item.itemLabel}
          </p>

          {item.comment && <p className="text-xs text-muted">{item.comment}</p>}

          {item.photos.length > 0 && (
            <div className="mt-1 flex gap-2">
              {item.photos.map((key) => (
                <PhotoThumb key={key} photoKey={key} />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function HistoryTab() {
  const { data, error, loading } = useResource<PagedResponse<AuditListItemDto>>('/audits');
  const [openId, setOpenId] = useState<string | null>(null);

  if (loading) return <p className="text-sm text-muted">Завантаження…</p>;
  if (error) return <p className="text-sm text-red-500">{error}</p>;
  if (!data?.items.length) return <p className="text-sm text-muted">Перевірок ще немає.</p>;

  return (
    <div className="flex flex-col gap-2">
      {data.items.map((audit) => (
        <article key={audit.id} className="rounded-xl bg-surface">
          <button
            type="button"
            onClick={() => setOpenId(openId === audit.id ? null : audit.id)}
            className="w-full p-3 text-left"
          >
            <p className="font-medium">{audit.storeLabel}</p>
            <p className="text-sm text-muted">
              {audit.revisorName} · {new Date(audit.createdAt).toLocaleString('uk-UA')}
            </p>
            <p className="mt-1 text-sm font-semibold">
              {audit.total}/{audit.maxTotal} | {audit.percent}%
            </p>
          </button>

          {openId === audit.id && <AuditDetail id={audit.id} />}
        </article>
      ))}

      <p className="text-center text-xs text-muted">Усього перевірок: {data.total}</p>
    </div>
  );
}

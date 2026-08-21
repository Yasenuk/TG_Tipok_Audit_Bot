import { useState } from 'react';
import type { AdminUserDto, Role } from '@sa/shared';
import { api, apiError } from '../../lib/api.js';
import { useResource } from '../../hooks/useResource.js';

export function UsersTab() {
  const { data, error, loading, reload } = useResource<AdminUserDto[]>('/admin/users');
  const [tgId, setTgId] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<Role>('REVISOR');
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

  if (loading) return <p className="text-sm text-muted">Завантаження…</p>;
  if (error) return <p className="text-sm text-red-500">{error}</p>;

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-xl bg-surface p-3">
        <input
          value={tgId}
          onChange={(event) => setTgId(event.target.value.replace(/\D/g, ''))}
          placeholder="Telegram ID (бот скаже його по /id)"
          inputMode="numeric"
          className="mb-2 w-full rounded-lg bg-bg p-2 text-sm placeholder:text-muted"
        />
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Імʼя"
          className="mb-2 w-full rounded-lg bg-bg p-2 text-sm placeholder:text-muted"
        />

        <div className="mb-2 flex gap-1">
          {(['REVISOR', 'ADMIN'] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRole(value)}
              className={`flex-1 rounded-lg p-2 text-sm ${
                role === value ? 'bg-accent text-accent-fg' : 'bg-bg'
              }`}
            >
              {value === 'ADMIN' ? 'Адмін' : 'Ревізор'}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() =>
            void run(async () => {
              await api.post('/admin/users', { tgId, name: name.trim(), role });
              setTgId('');
              setName('');
              setRole('REVISOR');
            })
          }
          disabled={busy || !tgId || !name.trim()}
          className="w-full rounded-lg bg-accent p-2 text-sm text-accent-fg disabled:opacity-50"
        >
          Додати
        </button>

        {formError && <p className="mt-2 text-xs text-red-500">{formError}</p>}
      </div>

      {data?.map((user) => (
        <div
          key={user.id}
          className={`rounded-xl bg-surface p-3 ${user.isActive ? '' : 'opacity-50'}`}
        >
          <p className="font-medium">{user.name}</p>
          <p className="text-sm text-muted">
            {user.tgId} · {user.role === 'ADMIN' ? 'адмін' : 'ревізор'}
          </p>

          <div className="mt-2 flex gap-4">
            <button
              type="button"
              onClick={() =>
                void run(() =>
                  api.patch(`/admin/users/${user.id}`, {
                    role: user.role === 'ADMIN' ? 'REVISOR' : 'ADMIN',
                  }),
                )
              }
              className="text-sm text-accent"
            >
              {user.role === 'ADMIN' ? 'Зробити ревізором' : 'Зробити адміном'}
            </button>

            <button
              type="button"
              onClick={() =>
                void run(() =>
                  api.patch(`/admin/users/${user.id}`, { isActive: !user.isActive }),
                )
              }
              className="text-sm text-accent"
            >
              {user.isActive ? 'Вимкнути' : 'Увімкнути'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

import { useState } from 'react';
import { api, apiError } from '../../lib/api.js';

export function ExportTab() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const params = { ...(from ? { from } : {}), ...(to ? { to } : {}) };

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    setMessage(null);

    try {
      await action();
    } catch (cause) {
      setError(apiError(cause));
    } finally {
      setBusy(false);
    }
  };

  const download = () =>
    run(async () => {
      const response = await api.get('/export/xlsx', { params, responseType: 'blob' });
      const url = URL.createObjectURL(response.data as Blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `audits_${new Date().toISOString().slice(0, 10)}.xlsx`;
      link.click();

      URL.revokeObjectURL(url);
      setMessage('Файл завантажено.');
    });

  const send = () =>
    run(async () => {
      await api.post('/export/xlsx/send', params);
      setMessage('Файл надіслано вам у чат з ботом.');
    });

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-xl bg-surface p-3">
        <label className="mb-1 block text-xs text-muted">Період з</label>
        <input
          type="date"
          value={from}
          onChange={(event) => setFrom(event.target.value)}
          className="mb-2 w-full rounded-lg bg-bg p-2 text-sm"
        />

        <label className="mb-1 block text-xs text-muted">по</label>
        <input
          type="date"
          value={to}
          onChange={(event) => setTo(event.target.value)}
          className="w-full rounded-lg bg-bg p-2 text-sm"
        />

        <p className="mt-2 text-xs text-muted">
          Порожні поля — вивантажуються всі перевірки. Один аркуш на точку, колонка на дату.
        </p>
      </div>

      <button
        type="button"
        onClick={() => void send()}
        disabled={busy}
        className="rounded-xl bg-accent p-3 text-accent-fg disabled:opacity-50"
      >
        {busy ? 'Готуємо…' : 'Надіслати в чат з ботом'}
      </button>

      <button
        type="button"
        onClick={() => void download()}
        disabled={busy}
        className="rounded-xl bg-surface p-3 disabled:opacity-50"
      >
        Завантажити файл
      </button>

      {message && <p className="text-center text-sm text-muted">{message}</p>}
      {error && <p className="text-center text-sm text-red-500">{error}</p>}
    </div>
  );
}

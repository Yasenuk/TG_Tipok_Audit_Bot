import { useState } from 'react';
import { HistoryTab } from './HistoryTab.js';
import { StoresTab } from './StoresTab.js';
import { ChecklistTab } from './ChecklistTab.js';
import { UsersTab } from './UsersTab.js';
import { ExportTab } from './ExportTab.js';

interface Props {
  onBack: () => void;
}

const TABS = [
  { key: 'history', label: 'Історія' },
  { key: 'stores', label: 'Точки' },
  { key: 'checklist', label: 'Чек-лист' },
  { key: 'users', label: 'Ревізори' },
  { key: 'export', label: 'Експорт' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

export function AdminPanel({ onBack }: Props) {
  const [tab, setTab] = useState<TabKey>('history');

  return (
    <section className="flex flex-col gap-3">
      <button type="button" onClick={onBack} className="self-start text-sm text-accent">
        ← Назад
      </button>

      <nav className="flex gap-2 overflow-x-auto">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`shrink-0 rounded-lg px-3 py-2 text-sm ${
              tab === key ? 'bg-accent text-accent-fg' : 'bg-surface'
            }`}
          >
            {label}
          </button>
        ))}
      </nav>

      {tab === 'history' && <HistoryTab />}
      {tab === 'stores' && <StoresTab />}
      {tab === 'checklist' && <ChecklistTab />}
      {tab === 'users' && <UsersTab />}
      {tab === 'export' && <ExportTab />}
    </section>
  );
}

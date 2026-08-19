interface Props {
  onBack: () => void;
}

const TABS = ['Історія', 'Точки', 'Чек-лист', 'Ревізори', 'Експорт'] as const;

export function AdminPanel({ onBack }: Props) {
  return (
    <section className="flex flex-col gap-3">
      <button type="button" onClick={onBack} className="self-start text-sm text-accent">
        ← Назад
      </button>

      <nav className="flex gap-2 overflow-x-auto">
        {TABS.map((tab) => (
          <button key={tab} type="button" className="rounded-lg bg-surface px-3 py-2 text-sm">
            {tab}
          </button>
        ))}
      </nav>

      {/* TODO: вкладки - таблиця перевірок, CRUD точок/пунктів/ревізорів, кнопка експорту */}
    </section>
  );
}

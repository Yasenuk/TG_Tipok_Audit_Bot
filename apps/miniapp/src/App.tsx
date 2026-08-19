import { useEffect, useState } from 'react';

import type { MeResponse } from '@sa/shared';
import { api } from './lib/api.js';

import { AuditForm } from './pages/AuditForm.js';
import { StoreSelect } from './pages/StoreSelect.js';
import { AdminPanel } from './pages/admin/AdminPanel.js';

type Screen = { name: 'stores' } | { name: 'audit'; storeId: string } | { name: 'admin' };

export function App() {
	const [me, setMe] = useState<MeResponse | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [screen, setScreen] = useState<Screen>({ name: 'stores' });

	useEffect(() => {
		api
			.get<MeResponse>('/me')
			.then((res) => setMe(res.data))
			.catch(() => setError('Немає доступу. Звернітся до адміністратора.'));
	}, []);

	if (error) return <p className="p-4 text-center text-muted">{error}</p>;
	if (!me) return <p className="p-4 text-center text-muted">Завантаження…</p>;

	return (
		<main className="mx-auto max-w-xl p-4">
			{screen.name === 'stores' && (
				<StoreSelect
					me={me}
					onPick={(storeId) => setScreen({ name: 'audit', storeId })}
					onAdmin={() => setScreen({ name: 'admin' })}
				/>
			)}

			{screen.name === 'audit' && (
				<AuditForm
					storeId={screen.storeId}
					me={me}
					onDone={() => setScreen({ name: 'stores' })}
				/>
			)}

			{screen.name === 'admin' && <AdminPanel onBack={() => setScreen({ name: 'stores' })} />}
		</main>
	);
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api-client';
import ResultEntryTab from '@/components/admin/ResultEntryTab';
import ScheduleEditTab from '@/components/admin/ScheduleEditTab';
import LeagueFinalsTab from '@/components/admin/LeagueFinalsTab';
import DangerZoneTab from '@/components/admin/DangerZoneTab';
import type { Team } from '@/lib/types';

type Tab = 'entry' | 'schedule' | 'league' | 'danger';

const TABS: { id: Tab; label: string }[] = [
  { id: 'entry', label: 'Enter Result' },
  { id: 'schedule', label: 'Edit Schedule' },
  { id: 'league', label: 'League & Finals' },
  { id: 'danger', label: 'Danger Zone' },
];

export default function AdminDashboardPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const [tab, setTab] = useState<Tab>('entry');

  useEffect(() => {
    (async () => {
      try {
        const session = await apiFetch<{ isAdmin: boolean }>('/admin/session');
        if (!session.isAdmin) {
          router.replace('/admin/login');
          return;
        }
        const teamList = await apiFetch<Team[]>('/teams');
        setTeams(teamList);
        setReady(true);
      } catch {
        router.replace('/admin/login');
      }
    })();
  }, [router]);

  async function handleLogout() {
    await apiFetch('/admin/logout', { method: 'POST' });
    router.replace('/admin/login');
  }

  if (!ready) return <p className="text-sm text-muted">Loading…</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-[15px] font-semibold">Admin Panel</h1>
        <button
          onClick={handleLogout}
          className="rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-[12px] font-semibold text-muted hover:text-foreground"
        >
          Log out
        </button>
      </div>

      <nav className="-mx-1 flex gap-1.5 overflow-x-auto scroll-thin px-1 pb-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors ${
              tab === t.id ? 'border-accent bg-accent text-[#16181f]' : 'border-border bg-surface-2 text-muted hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab === 'entry' && <ResultEntryTab teams={teams} />}
      {tab === 'schedule' && <ScheduleEditTab teams={teams} />}
      {tab === 'league' && <LeagueFinalsTab teams={teams} />}
      {tab === 'danger' && <DangerZoneTab />}
    </div>
  );
}

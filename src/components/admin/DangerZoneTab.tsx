'use client';

import { useState } from 'react';
import { apiFetch } from '@/lib/api-client';

export default function DangerZoneTab() {
  const [confirmText, setConfirmText] = useState('');
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleReset() {
    if (confirmText !== 'RESET') {
      setMsg({ text: 'Type RESET exactly to confirm.', ok: false });
      return;
    }
    if (!confirm('This will permanently erase all match results and regenerate the schedule. Continue?')) return;
    setBusy(true);
    try {
      await apiFetch('/admin/reset', { method: 'POST', body: JSON.stringify({ confirm: 'RESET' }) });
      setMsg({ text: 'Tournament data reset. Reloading…', ok: true });
      setTimeout(() => window.location.reload(), 900);
    } catch (err) {
      setMsg({ text: err instanceof Error ? err.message : 'Failed to reset', ok: false });
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-danger/40 bg-surface p-4 sm:p-5">
      <h2 className="mb-2 text-[15px] font-semibold text-danger">Reset Tournament Data</h2>
      <p className="mb-3 text-[13px] text-muted">
        This wipes all results and regenerates a fresh league schedule. This cannot be undone.
      </p>
      <label className="mb-1 block text-[12.5px] text-muted" htmlFor="reset-confirm">
        Type RESET to confirm
      </label>
      <input
        id="reset-confirm"
        type="text"
        placeholder="RESET"
        value={confirmText}
        onChange={(e) => setConfirmText(e.target.value)}
        className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
      />
      <button
        onClick={handleReset}
        disabled={busy}
        className="mt-3 rounded-lg bg-danger px-4 py-2.5 text-sm font-semibold text-[#2a0a0a] disabled:opacity-50"
      >
        Reset Everything
      </button>
      {msg && <p className={`mt-2 text-[13px] ${msg.ok ? 'text-success' : 'text-danger'}`}>{msg.text}</p>}
    </section>
  );
}

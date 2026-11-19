'use client';

import { useRef, useState } from 'react';

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm Delete',
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: () => Promise<boolean>;
}) {
  const [busy, setBusy] = useState(false);
  const confirming = useRef(false);
  if (!open) return null;

  async function confirm() {
    if (confirming.current) return;
    confirming.current = true;
    setBusy(true);
    try {
      if (await onConfirm()) onCancel();
    } finally {
      confirming.current = false;
      setBusy(false);
    }
  }

  function cancel() {
    if (!confirming.current) onCancel();
  }

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/50 p-4" onMouseDown={(event) => event.target === event.currentTarget && cancel()}>
      <section role="alertdialog" aria-modal="true" aria-labelledby="confirm-dialog-title" className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        <h2 id="confirm-dialog-title" className="text-xl font-black text-slate-900">{title}</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" disabled={busy} onClick={cancel} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 disabled:opacity-50">Cancel</button>
          <button type="button" disabled={busy} onClick={() => void confirm()} className="rounded-xl bg-rose-700 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">{busy ? 'Working…' : confirmLabel}</button>
        </div>
      </section>
    </div>
  );
}

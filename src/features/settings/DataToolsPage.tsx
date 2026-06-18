import React, { useRef, useState } from 'react';
import { Download, Upload, RotateCcw, Database, CheckCircle2, AlertCircle, Wifi, WifiOff, ShieldCheck, ShieldAlert } from 'lucide-react';
import { useAppData } from '../../state/AppDataContext';
import { useAuth } from '../../state/AuthContext';
import { exportData, parseImportedData, resetToSeedData, getLastSaved, getDataVersion, DATA_VERSION } from '../../lib/storage';
import { getConnectionLabel, getConnectionMode } from '../../lib/firebaseClient';
import { logAudit } from '../../lib/audit';
import { AppData } from '../../types';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/Card';
import ConfirmDialog from '../../components/ConfirmDialog';

export default function DataToolsPage() {
  const { data, replaceAll } = useAppData();
  const { profile, isFirebaseMode } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pendingImport, setPendingImport] = useState<AppData | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [message, setMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);

  const lastSaved = getLastSaved();
  const storedVersion = getDataVersion();
  const connectionMode = getConnectionMode();
  const connectionLabel = getConnectionLabel();

  const counts: { label: string; value: number }[] = [
    { label: 'Projects', value: data.projects.length },
    { label: 'Members', value: data.members.length },
    { label: 'Meetings', value: data.meetings.length },
    { label: 'Sponsors', value: data.sponsors.length },
    { label: 'Transactions', value: data.transactions.length },
    { label: 'Approvals', value: data.approvals.length },
    { label: 'File Links', value: data.fileLinks.length },
    { label: 'Saved Reports', value: data.reports.length },
  ];

  function handleExport() {
    const blob = new Blob([exportData()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rccs-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMessage({ type: 'ok', text: 'Backup downloaded.' });
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    setMessage(null);
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = parseImportedData(String(reader.result));
        setPendingImport(parsed);
      } catch (err) {
        setMessage({ type: 'error', text: `Import failed: ${(err as Error).message}` });
      }
    };
    reader.onerror = () => setMessage({ type: 'error', text: 'Could not read the file.' });
    reader.readAsText(file);
    e.target.value = '';
  }

  function confirmImport() {
    if (!pendingImport) return;
    replaceAll(pendingImport);
    setPendingImport(null);
    setMessage({ type: 'ok', text: 'Backup imported successfully.' });
  }

  function doReset() {
    const seeded = resetToSeedData();
    replaceAll(seeded);
    setConfirmReset(false);
    setMessage({ type: 'ok', text: 'Demo data restored.' });
    logAudit({ actorProfileId: profile?.id ?? null, action: 'reset', entityType: 'data', summary: 'Reset app data to seed demo data.' }).catch(() => {});
  }

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-4xl mx-auto">
      <PageHeader title="Data Tools" description="Back up, restore, or reset your local data." />

      {/* Connection mode */}
      {/* Provider health */}
      <Card className={connectionMode === 'firebase' ? 'border-emerald-700/40' : 'border-amber-900/40'}>
        <div className="flex items-start gap-3">
          {connectionMode === 'firebase'
            ? <Wifi size={16} className="text-emerald-400 shrink-0 mt-0.5" />
            : <WifiOff size={16} className="text-amber-400 shrink-0 mt-0.5" />
          }
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-semibold ${connectionMode === 'firebase' ? 'text-emerald-300' : 'text-amber-300'}`}>
              {connectionLabel}
            </p>
            {connectionMode === 'local' && (
              <p className="text-xs text-slate-500 mt-0.5">
                Data lives only in this browser's localStorage. Set the Firebase env vars in <code className="text-slate-400">.env.local</code> to switch to Firebase mode.
              </p>
            )}
            {connectionMode === 'firebase' && (
              <p className="text-xs text-slate-500 mt-0.5">
                Connected to Firebase. Data is persistent and shared across devices. Firestore rules block unauthenticated access.
              </p>
            )}
          </div>
        </div>

        {/* Health checks */}
        <div className="mt-3 pt-3 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-2">
          {[
            {
              label: 'Database',
              ok: connectionMode === 'firebase',
              detail: connectionMode === 'firebase' ? 'Firestore connected' : 'localStorage (local only)',
            },
            {
              label: 'Authentication',
              ok: isFirebaseMode ? Boolean(profile) : true,
              detail: isFirebaseMode
                ? (profile ? `Logged in as ${profile.displayName}` : 'Not authenticated')
                : 'Demo auth (local)',
            },
            {
              label: 'Profile Linked',
              ok: isFirebaseMode ? Boolean(profile?.authUserId || profile?.email) : true,
              detail: isFirebaseMode
                ? (profile?.authUserId ? 'authUserId linked' : 'Using linked email match')
                : 'N/A in local mode',
            },
          ].map(({ label, ok, detail }) => (
            <div key={label} className="flex items-start gap-2">
              {ok
                ? <ShieldCheck size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                : <ShieldAlert size={14} className="text-red-400 shrink-0 mt-0.5" />
              }
              <div>
                <p className="text-xs font-medium text-slate-300">{label}</p>
                <p className="text-[10px] text-slate-600">{detail}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {message && (
        <div className={`flex items-center gap-2 text-sm rounded-lg px-3 py-2 border ${message.type === 'ok' ? 'text-emerald-300 bg-emerald-950/40 border-emerald-900' : 'text-red-300 bg-red-950/40 border-red-900'}`}>
          {message.type === 'ok' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
          {message.text}
        </div>
      )}

      <Card>
        <div className="flex items-center gap-2 mb-3">
          <Database size={16} className="text-slate-400" />
          <h2 className="text-sm font-semibold text-white">Current Data</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {counts.map((c) => (
            <div key={c.label} className="bg-slate-800/50 rounded-lg py-2.5 text-center">
              <p className="text-lg font-bold text-white">{c.value}</p>
              <p className="text-xs text-slate-500">{c.label}</p>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-800">
          <div className="text-xs text-slate-600">
            {lastSaved && <p>Last saved: {new Date(lastSaved).toLocaleString('en-GB')}</p>}
            <p>Data version: v{storedVersion} {storedVersion < DATA_VERSION ? `(current: v${DATA_VERSION})` : '(up to date)'}</p>
          </div>
        </div>
      </Card>

      <div className="grid md:grid-cols-3 gap-3">
        <Card>
          <Download size={18} className="text-blue-400 mb-2" />
          <h3 className="text-sm font-semibold text-white">Export Backup</h3>
          <p className="text-xs text-slate-500 mt-1 mb-3">Download all app data as a JSON file.</p>
          <button className="btn-primary w-full justify-center" onClick={handleExport}>Export JSON</button>
        </Card>

        <Card>
          <Upload size={18} className="text-emerald-400 mb-2" />
          <h3 className="text-sm font-semibold text-white">Import Backup</h3>
          <p className="text-xs text-slate-500 mt-1 mb-3">Replace all data with a JSON backup file.</p>
          <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={handleFile} />
          <button className="btn-secondary w-full justify-center" onClick={() => fileRef.current?.click()}>Choose File</button>
        </Card>

        <Card>
          <RotateCcw size={18} className="text-amber-400 mb-2" />
          <h3 className="text-sm font-semibold text-white">Reset Demo Data</h3>
          <p className="text-xs text-slate-500 mt-1 mb-3">Restore the original RCCS seed data.</p>
          <button className="btn-danger w-full justify-center" onClick={() => setConfirmReset(true)}>Reset Data</button>
        </Card>
      </div>

      <ConfirmDialog
        open={!!pendingImport}
        title="Import backup?"
        message="This will replace ALL current data with the contents of the backup file. This cannot be undone. Continue?"
        confirmLabel="Import & Replace"
        onConfirm={confirmImport}
        onCancel={() => setPendingImport(null)}
      />

      <ConfirmDialog
        open={confirmReset}
        title="Reset to demo data?"
        message="This will erase all your changes and restore the original RCCS seed data. This cannot be undone."
        confirmLabel="Reset"
        onConfirm={doReset}
        onCancel={() => setConfirmReset(false)}
      />
    </div>
  );
}

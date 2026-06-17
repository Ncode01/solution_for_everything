/**
 * SystemPage — consolidates Data Tools, health, auth, database, deployment (Phase Six).
 * Replaces DataToolsPage at /system. /data-tools redirects here.
 */
import React, { useRef, useState } from 'react';
import {
  Download, Upload, RotateCcw, Database, CheckCircle2, AlertCircle,
  Wifi, WifiOff, ShieldCheck, ShieldAlert, Settings2, Server,
  Lock, Activity, FileJson,
} from 'lucide-react';
import { useAppData } from '../../state/AppDataContext';
import { useAuth } from '../../state/AuthContext';
import {
  exportData, parseImportedData, resetToSeedData, getLastSaved,
  getDataVersion, DATA_VERSION,
} from '../../lib/storage';
import { getConnectionLabel, getConnectionMode } from '../../lib/dataProvider';
import { logAudit } from '../../lib/audit';
import { AppData } from '../../types';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/Card';
import ConfirmDialog from '../../components/ConfirmDialog';

export default function SystemPage() {
  const { data, replaceAll } = useAppData();
  const { profile, isSupabaseMode } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pendingImport, setPendingImport] = useState<AppData | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [message, setMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);

  const lastSaved = getLastSaved();
  const storedVersion = getDataVersion();
  const connectionMode = getConnectionMode();
  const connectionLabel = getConnectionLabel();

  const counts: { label: string; value: number }[] = [
    { label: 'Projects',    value: data.projects.length },
    { label: 'People',      value: data.members.length },
    { label: 'Meetings',    value: data.meetings.length },
    { label: 'Sponsors',    value: data.sponsors.length },
    { label: 'Transactions',value: data.transactions.length },
    { label: 'Approvals',   value: data.approvals.length },
    { label: 'File Links',  value: data.fileLinks.length },
    { label: 'Reports',     value: data.reports.length },
    { label: 'Deliverables',value: (data.deliverables ?? []).length },
    { label: 'Event Items', value: (data.eventDayItems ?? []).length },
  ];

  function handleExport() {
    const blob = new Blob([exportData()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rccs-os-backup-${new Date().toISOString().slice(0, 10)}.json`;
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
    reader.readAsText(file);
    if (fileRef.current) fileRef.current.value = '';
  }

  function confirmImport() {
    if (!pendingImport) return;
    replaceAll(pendingImport);
    logAudit({ actorProfileId: profile?.id ?? null, action: 'imported', entityType: 'data', summary: 'Data imported from backup file' }).catch(() => {});
    setPendingImport(null);
    setMessage({ type: 'ok', text: 'Data imported successfully.' });
  }

  function handleReset() {
    const fresh = resetToSeedData();
    replaceAll(fresh);
    logAudit({ actorProfileId: profile?.id ?? null, action: 'reset', entityType: 'data', summary: 'Data reset to seed/demo data' }).catch(() => {});
    setConfirmReset(false);
    setMessage({ type: 'ok', text: 'Data has been reset to demo data.' });
  }

  const profileLinked = !!profile?.id;
  const isAdmin = profile?.role === 'Super Admin' || profile?.role === 'Executive Admin';

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">
      <PageHeader
        title="System"
        description="Database, auth, backups, deployment, and RCCS OS health."
      />

      {/* App Health */}
      <section>
        <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><Activity size={14} className="text-slate-400" /> App Health</h2>
        <div className="grid sm:grid-cols-3 gap-3">
          <HealthCard
            icon={connectionMode === 'supabase' ? Wifi : WifiOff}
            label="Connection"
            value={connectionLabel}
            ok={connectionMode === 'supabase'}
          />
          <HealthCard
            icon={isSupabaseMode ? Lock : ShieldAlert}
            label="Auth Mode"
            value={isSupabaseMode ? 'Supabase Auth' : 'Local Demo Auth'}
            ok={isSupabaseMode}
          />
          <HealthCard
            icon={profileLinked ? ShieldCheck : AlertCircle}
            label="Profile"
            value={profileLinked ? `Linked (${profile?.role ?? 'Unknown'})` : 'Not linked'}
            ok={profileLinked}
          />
        </div>
      </section>

      {/* Database */}
      <section>
        <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><Database size={14} className="text-slate-400" /> Database</h2>
        <Card>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {counts.map((c) => (
              <div key={c.label} className="text-center py-1">
                <p className="text-base font-bold text-white">{c.value}</p>
                <p className="text-xs text-slate-500">{c.label}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800 text-xs text-slate-500 flex flex-wrap gap-4">
            <span>Data version: <span className="text-slate-300">v{storedVersion} (current: v{DATA_VERSION})</span></span>
            {lastSaved && <span>Last saved: <span className="text-slate-300">{new Date(lastSaved).toLocaleString('en-GB')}</span></span>}
            <span>Mode: <span className="text-slate-300">{connectionLabel}</span></span>
          </div>
        </Card>
      </section>

      {/* Security */}
      {isAdmin && (
        <section>
          <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><ShieldCheck size={14} className="text-slate-400" /> Security</h2>
          <Card>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">RLS policies</span>
                <span className={connectionMode === 'supabase' ? 'text-emerald-400' : 'text-slate-500'}>
                  {connectionMode === 'supabase' ? 'Production (Phase Five)' : 'N/A (Local Demo Mode)'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Audit logging</span>
                <span className="text-emerald-400">Enabled</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Anonymous write access</span>
                <span className={connectionMode === 'supabase' ? 'text-emerald-400' : 'text-slate-500'}>
                  {connectionMode === 'supabase' ? 'Blocked' : 'N/A (Local Demo)'}
                </span>
              </div>
            </div>
          </Card>
        </section>
      )}

      {/* Backups */}
      <section>
        <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><FileJson size={14} className="text-slate-400" /> Backups &amp; Data</h2>
        <Card>
          <div className="flex flex-wrap gap-3">
            <button className="btn-primary text-sm" onClick={handleExport}>
              <Download size={14} /> Export Backup
            </button>
            <button className="btn-ghost text-sm" onClick={() => fileRef.current?.click()}>
              <Upload size={14} /> Import Backup
            </button>
            {isAdmin && (
              <button className="btn-ghost text-sm text-red-400 hover:text-red-300" onClick={() => setConfirmReset(true)}>
                <RotateCcw size={14} /> Reset to Demo Data
              </button>
            )}
            <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleFile} />
          </div>
          {message && (
            <div className={`mt-3 text-sm flex items-center gap-2 ${message.type === 'ok' ? 'text-emerald-400' : 'text-red-400'}`}>
              {message.type === 'ok' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
              {message.text}
            </div>
          )}
        </Card>
      </section>

      {/* Deployment notes */}
      <section>
        <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><Server size={14} className="text-slate-400" /> Deployment</h2>
        <Card>
          <div className="text-xs text-slate-400 space-y-1">
            <p>RCCS OS v6.0.0 · Built with Vite + React + TypeScript + Tailwind CSS</p>
            <p>Supabase PostgreSQL backend with production RLS (Phase Five).</p>
            <p>Deploy to Cloudflare Pages or Vercel. Set <code className="bg-slate-800 px-1 rounded">VITE_SUPABASE_URL</code> and <code className="bg-slate-800 px-1 rounded">VITE_SUPABASE_ANON_KEY</code> env vars.</p>
            <p>See <code className="bg-slate-800 px-1 rounded">docs/13_DEPLOYMENT_RUNBOOK.md</code> for full instructions.</p>
          </div>
        </Card>
      </section>

      {/* Modals */}
      {pendingImport && (
        <ConfirmDialog
          open={!!pendingImport}
          title="Import backup?"
          message={`Import backup? This will replace all current data (${pendingImport.projects.length} projects, ${pendingImport.members.length} members, etc.).`}
          onConfirm={confirmImport}
          onCancel={() => setPendingImport(null)}
        />
      )}
      {confirmReset && (
        <ConfirmDialog
          open={confirmReset}
          title="Reset to demo data?"
          message="Reset to demo data? All current data will be lost and cannot be recovered."
          onConfirm={handleReset}
          onCancel={() => setConfirmReset(false)}
        />
      )}
    </div>
  );
}

function HealthCard({ icon: Icon, label, value, ok }: {
  icon: React.ElementType; label: string; value: string; ok: boolean;
}) {
  return (
    <Card className="flex items-center gap-3 py-3">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${ok ? 'bg-emerald-900/30' : 'bg-amber-900/30'}`}>
        <Icon size={15} className={ok ? 'text-emerald-400' : 'text-amber-400'} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-500">{label}</p>
        <p className={`text-sm font-medium truncate ${ok ? 'text-emerald-300' : 'text-amber-300'}`}>{value}</p>
      </div>
    </Card>
  );
}

import React, { useRef, useState } from 'react';
import { Activity, AlertCircle, CheckCircle2, Database, Download, FileJson, Lock, RotateCcw, Server, ShieldCheck, ShieldAlert, Upload, Wifi, WifiOff } from 'lucide-react';
import { useAppData } from '../../state/AppDataContext';
import { useAuth } from '../../state/AuthContext';
import { exportData, parseImportedData, resetToSeedData, getLastSaved, getDataVersion, DATA_VERSION } from '../../lib/storage';
import { getConnectionLabel, getConnectionMode } from '../../lib/firebaseClient';
import { logAudit } from '../../lib/audit';
import { AppData } from '../../types';
import ScreenCanvas from '../../components/layout/ScreenCanvas';
import CommandHero from '../../components/layout/CommandHero';
import SettingsList from '../../components/layout/SettingsList';
import SettingsRow from '../../components/layout/SettingsRow';
import StatusDot from '../../components/design/StatusDot';
import ConfirmDialog from '../../components/ConfirmDialog';

export default function SystemPage() {
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
  const profileLinked = !!profile?.id;
  const isAdmin = profile?.role === 'Super Admin' || profile?.role === 'Executive Admin';

  const counts: { label: string; value: number }[] = [
    { label: 'Projects', value: data.projects.length },
    { label: 'People', value: data.members.length },
    { label: 'Meetings', value: data.meetings.length },
    { label: 'Sponsors', value: data.sponsors.length },
    { label: 'Transactions', value: data.transactions.length },
    { label: 'Approvals', value: data.approvals.length },
  ];

  function handleExport() {
    const blob = new Blob([exportData()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `rccs-os-backup-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
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
        setPendingImport(parseImportedData(String(reader.result)));
      } catch (error) {
        setMessage({ type: 'error', text: `Import failed: ${(error as Error).message}` });
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

  return (
    <ScreenCanvas variant="settings">
      <CommandHero
        title="System"
        description="Database, auth, backups, deployment, and RCCS OS health."
        tone="system"
        metrics={[
          { label: 'Connection', value: connectionLabel, tone: connectionMode === 'firebase' ? 'success' : 'default' },
          { label: 'Auth mode', value: isFirebaseMode ? 'Firebase' : 'Local demo' },
          { label: 'Profile', value: profileLinked ? 'Linked' : 'Not linked', tone: profileLinked ? 'success' : 'warning' },
        ]}
      />

      <SettingsList title="App Health">
        <SettingsRow icon={<Activity size={16} />} label="Connection" value={connectionLabel} status={<StatusDot label={connectionMode === 'firebase' ? 'Healthy' : 'Local'} tone={connectionMode === 'firebase' ? 'emerald' : 'amber'} lozenge />} />
        <SettingsRow icon={isFirebaseMode ? <Lock size={16} /> : <ShieldAlert size={16} />} label="Auth mode" value={isFirebaseMode ? 'Firebase Auth' : 'Local Demo Auth'} />
        <SettingsRow icon={profileLinked ? <ShieldCheck size={16} /> : <AlertCircle size={16} />} label="Profile" value={profileLinked ? profile?.role ?? 'Linked' : 'Not linked'} />
      </SettingsList>

      <SettingsList title="Database">
        {counts.map((count) => (
          <SettingsRow key={count.label} icon={<Database size={16} />} label={count.label} value={count.value} />
        ))}
        <SettingsRow icon={<FileJson size={16} />} label="Data version" value={`v${storedVersion} (current v${DATA_VERSION})`} detail={lastSaved ? `Last saved ${new Date(lastSaved).toLocaleString('en-GB')}` : 'No last-saved timestamp'} />
      </SettingsList>

      <SettingsList title="Security">
        <SettingsRow icon={<ShieldCheck size={16} />} label="Firestore rules" value={connectionMode === 'firebase' ? 'Authenticated only' : 'N/A'} status={<StatusDot label={connectionMode === 'firebase' ? 'Protected' : 'Demo'} tone={connectionMode === 'firebase' ? 'emerald' : 'amber'} lozenge />} />
        <SettingsRow icon={<ShieldCheck size={16} />} label="Audit logging" value="Enabled" />
        <SettingsRow icon={<Lock size={16} />} label="Anonymous write access" value={connectionMode === 'firebase' ? 'Blocked' : 'N/A'} />
      </SettingsList>

      <SettingsList title="Backups">
        <SettingsRow icon={<Download size={16} />} label="Export backup" detail={message?.type === 'ok' ? message.text : 'Download a JSON backup of the current workspace state.'} action={<button className="btn-primary" onClick={handleExport}>Export</button>} />
        <SettingsRow icon={<Upload size={16} />} label="Import backup" detail={message?.type === 'error' ? message.text : 'Replace the current workspace state with a backup file.'} action={<button className="btn-secondary" onClick={() => fileRef.current?.click()}>Import</button>} />
        <SettingsRow icon={<RotateCcw size={16} />} label="Reset to demo data" detail="Local reset only. This replaces the current local dataset." action={isAdmin ? <button className="btn-danger" onClick={() => setConfirmReset(true)}>Reset</button> : <span className="text-xs text-[var(--text-tertiary)]">Admin only</span>} />
        <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleFile} />
      </SettingsList>

      <SettingsList title="Deployment">
        <SettingsRow icon={<Wifi size={16} />} label="Connection mode" value={connectionLabel} />
        <SettingsRow icon={<Server size={16} />} label="Runtime" value="Vite + React + TypeScript" detail="Deploy with Firebase Hosting using the FlowCanvas project." />
        <SettingsRow icon={<WifiOff size={16} />} label="Local demo fallback" value="Enabled" detail="The app remains usable without Firebase configuration." />
      </SettingsList>

      {pendingImport && <ConfirmDialog open={!!pendingImport} title="Import backup?" message={`Import backup? This will replace all current data (${pendingImport.projects.length} projects, ${pendingImport.members.length} members, etc.).`} onConfirm={confirmImport} onCancel={() => setPendingImport(null)} />}
      {confirmReset && <ConfirmDialog open={confirmReset} title="Reset to demo data?" message="Reset to demo data? All current local data will be lost." onConfirm={handleReset} onCancel={() => setConfirmReset(false)} />}
    </ScreenCanvas>
  );
}

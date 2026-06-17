import React, { useEffect, useState, useCallback } from 'react';
import { ScrollText, RefreshCw, Search } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';
import { getLocalAuditEntries, type AuditEntry } from '../../lib/audit';
import { useAppData } from '../../state/AppDataContext';
import { useAuth } from '../../state/AuthContext';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/Card';
import EmptyState from '../../components/EmptyState';

const ACTION_COLORS: Record<string, string> = {
  created:        'text-emerald-400',
  updated:        'text-blue-400',
  deleted:        'text-red-400',
  status_changed: 'text-amber-400',
  generated:      'text-violet-400',
  imported:       'text-cyan-400',
  reset:          'text-orange-400',
  approved:       'text-emerald-400',
  rejected:       'text-red-400',
  converted:      'text-blue-400',
};

const ENTITY_LABELS: Record<string, string> = {
  project:     'Project',
  phase:       'Phase',
  milestone:   'Milestone',
  task:        'Task',
  pr_item:     'PR Item',
  meeting:     'Meeting',
  action_item: 'Action Item',
  sponsor:     'Sponsor',
  transaction: 'Transaction',
  approval:    'Approval',
  report:      'Report',
  file_link:   'File Link',
  member:      'Member',
  data:        'Data',
};

interface DisplayEntry {
  id: string;
  actorName: string;
  action: string;
  entityType: string;
  summary: string;
  projectName: string | null;
  createdAt: string;
}

export default function AuditLogPage() {
  const { data } = useAppData();
  const { profile } = useAuth();
  const [entries, setEntries] = useState<DisplayEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterProject, setFilterProject] = useState('');

  const isAdmin = profile?.role === 'Super Admin' || profile?.role === 'Executive Admin';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (isSupabaseConfigured && supabase) {
        const query = supabase
          .from('audit_logs')
          .select(`
            id, action, entity_type, summary, project_id, created_at,
            actor:actor_profile_id ( display_name )
          `)
          .order('created_at', { ascending: false })
          .limit(300);

        const { data: rows, error } = await query;
        if (error) throw error;

        const mapped: DisplayEntry[] = (rows ?? []).map((r: Record<string, unknown>) => {
          const actor = r.actor as { display_name: string } | null;
          const project = data.projects.find((p) => p.id === r.project_id);
          return {
            id:          r.id as string,
            actorName:   actor?.display_name ?? 'Unknown',
            action:      r.action as string,
            entityType:  r.entity_type as string,
            summary:     r.summary as string,
            projectName: project?.name ?? null,
            createdAt:   r.created_at as string,
          };
        });
        setEntries(mapped);
      } else {
        // Local mode
        const local = getLocalAuditEntries();
        const mapped: DisplayEntry[] = local.map((e: AuditEntry) => {
          const member = data.members.find((m) => m.id === e.actorProfileId);
          const project = data.projects.find((p) => p.id === e.projectId);
          return {
            id:          e.id,
            actorName:   member?.displayName ?? e.actorProfileId ?? 'Unknown',
            action:      e.action,
            entityType:  e.entityType,
            summary:     e.summary,
            projectName: project?.name ?? null,
            createdAt:   e.createdAt,
          };
        });
        setEntries(mapped);
      }
    } catch (err) {
      console.error('[audit] Failed to load audit log:', err);
    } finally {
      setLoading(false);
    }
  }, [data.members, data.projects]);

  useEffect(() => { load(); }, [load]);

  const entityTypes = [...new Set(entries.map((e) => e.entityType))].sort();

  const filtered = entries.filter((e) => {
    if (filterType && e.entityType !== filterType) return false;
    if (filterProject && e.projectName !== filterProject) return false;
    if (search) {
      const q = search.toLowerCase();
      return e.summary.toLowerCase().includes(q) ||
        e.actorName.toLowerCase().includes(q) ||
        e.entityType.toLowerCase().includes(q);
    }
    return true;
  });

  const projectNames = [...new Set(entries.map((e) => e.projectName).filter(Boolean))].sort() as string[];

  function fmt(iso: string): string {
    try {
      return new Date(iso).toLocaleString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    } catch {
      return iso;
    }
  }

  if (!isAdmin && !isSupabaseConfigured) {
    return (
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        <PageHeader title="Audit Log" description="System-wide activity trail" />
        <EmptyState
          icon={ScrollText}
          title="Admin access required"
          description="Audit log is visible to Super Admin and Executive Admin only."
        />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-7xl mx-auto">
      <PageHeader
        title="Audit Log"
        description="System-wide record of important changes"
        actions={
          <button className="btn-secondary" onClick={load} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          <input
            className="input pl-8 py-1.5 text-sm"
            placeholder="Search summary or actor…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="select text-sm py-1.5 w-36" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
          <option value="">All Types</option>
          {entityTypes.map((t) => (
            <option key={t} value={t}>{ENTITY_LABELS[t] ?? t}</option>
          ))}
        </select>
        <select className="select text-sm py-1.5 w-44" value={filterProject} onChange={(e) => setFilterProject(e.target.value)}>
          <option value="">All Projects</option>
          {projectNames.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-4 animate-pulse h-14" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          title="No audit entries"
          description={entries.length === 0 ? 'No activity has been recorded yet.' : 'No entries match your filters.'}
        />
      ) : (
        <div className="space-y-1.5">
          {filtered.map((e) => (
            <Card key={e.id} className="py-2.5">
              <div className="flex items-start gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs font-semibold uppercase tracking-wide ${ACTION_COLORS[e.action] ?? 'text-slate-400'}`}>
                      {e.action.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-slate-600">·</span>
                    <span className="text-xs text-slate-500">{ENTITY_LABELS[e.entityType] ?? e.entityType}</span>
                    {e.projectName && (
                      <>
                        <span className="text-xs text-slate-600">·</span>
                        <span className="text-xs text-slate-500 truncate">{e.projectName}</span>
                      </>
                    )}
                  </div>
                  <p className="text-sm text-slate-300 mt-0.5 truncate">{e.summary}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-slate-400">{e.actorName}</p>
                  <p className="text-[10px] text-slate-600">{fmt(e.createdAt)}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <p className="text-xs text-slate-700 text-center">
        Showing {filtered.length} of {entries.length} entries
        {isSupabaseConfigured ? ' (Supabase)' : ' (Local Demo)'}
      </p>
    </div>
  );
}

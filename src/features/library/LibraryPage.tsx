/**
 * LibraryPage — consolidates Reports, Files, Audit Trail, Archives (Phase Six).
 * RCCS memory: reports, file links, audit trail, archived projects, handover.
 */
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  BookOpen, FileText, Link2, ScrollText, Archive, Copy, Printer,
  Save, Trash2, Wand2, Search, RefreshCw, ExternalLink, Plus,
  ChevronDown,
} from 'lucide-react';
import { Report } from '../../types';
import { useAppData } from '../../state/AppDataContext';
import { useAuth } from '../../state/AuthContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';
import { getLocalAuditEntries, type AuditEntry } from '../../lib/audit';
import { generateProjectReport, generateHandoverReport } from '../../lib/report';
import { generateId, todayISO, formatDate } from '../../lib/dateUtils';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/Card';
import EmptyState from '../../components/EmptyState';
import ConfirmDialog from '../../components/ConfirmDialog';
import Modal from '../../components/Modal';
import FileLinkForm from '../files/FileLinkForm';
import SegmentedControl from '../../components/design/SegmentedControl';

type Section = 'reports' | 'files' | 'audit' | 'archives' | 'handover';

const SECTION_LABELS: Record<Section, string> = {
  reports:  'Reports',
  files:    'Files & Links',
  audit:    'Audit Trail',
  archives: 'Archives',
  handover: 'Handover',
};

const ACTION_COLORS: Record<string, string> = {
  created: 'text-emerald-400', updated: 'text-blue-400', deleted: 'text-red-400',
  generated: 'text-violet-400', approved: 'text-emerald-400', rejected: 'text-red-400',
  status_changed: 'text-amber-400', imported: 'text-cyan-400', reset: 'text-orange-400',
};

interface DisplayEntry {
  id: string; actorName: string; action: string;
  entityType: string; summary: string; projectName: string | null; createdAt: string;
}

export default function LibraryPage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const activeSection: Section = (params.get('section') as Section) ?? 'reports';
  const { data, saveReport, deleteReport, saveFileLink, deleteFileLink } = useAppData();
  const { profile } = useAuth();
  const { projects, reports, fileLinks } = data;

  function setSection(s: Section) {
    setParams({ section: s });
  }

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-7xl mx-auto">
      <PageHeader
        title="Library"
        description="RCCS memory: reports, files, audit trail, archives, and handover records."
      />

      {/* Section tabs */}
      <div className="floating-control p-2 overflow-x-auto">
        <SegmentedControl
          value={activeSection}
          onChange={setSection}
          options={(Object.entries(SECTION_LABELS) as [Section, string][]).map(([value, label]) => ({ value, label }))}
        />
      </div>

      {activeSection === 'reports' && <ReportsSection projects={projects} reports={reports} saveReport={saveReport} deleteReport={deleteReport} data={data} />}
      {activeSection === 'handover' && <HandoverSection projects={projects} reports={reports} saveReport={saveReport} deleteReport={deleteReport} data={data} />}
      {activeSection === 'files'   && <FilesSection projects={projects} fileLinks={fileLinks} saveFileLink={saveFileLink} deleteFileLink={deleteFileLink} members={data.members} />}
      {activeSection === 'audit'   && <AuditSection projects={projects} profile={profile} />}
      {activeSection === 'archives' && <ArchivesSection projects={projects} navigate={navigate} />}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Reports Section
// ────────────────────────────────────────────────────────────
function ReportsSection({ projects, reports, saveReport, deleteReport, data }: {
  projects: typeof data.projects; reports: typeof data.reports;
  saveReport: (r: Report) => void; deleteReport: (id: string) => void;
  data: ReturnType<typeof useAppData>['data'];
}) {
  const [projectId, setProjectId] = useState(projects[0]?.id ?? '');
  const [preview, setPreview] = useState<{ title: string; summary: string; sections: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [confirmDel, setConfirmDel] = useState<Report | null>(null);

  const project = projects.find((p) => p.id === projectId);

  function generate() {
    if (!project) return;
    setPreview(generateProjectReport(data, project));
  }

  function copyReport() {
    if (!preview) return;
    navigator.clipboard?.writeText(`${preview.title}\n\n${preview.summary}\n\n${preview.sections}`).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 1500);
    });
  }

  function printReport() {
    if (!preview) return;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<!doctype html><html><head><title>${preview.title}</title>
      <style>body{font-family:system-ui,sans-serif;max-width:760px;margin:32px auto;padding:0 16px;color:#0f172a;line-height:1.5}
      h1{font-size:20px}h2{font-size:15px;margin-top:20px;border-bottom:1px solid #e2e8f0;padding-bottom:4px}
      pre{white-space:pre-wrap;font-family:inherit;font-size:13px}</style></head>
      <body><h1>${preview.title}</h1><p><em>${preview.summary}</em></p><pre>${preview.sections.replace(/</g, '&lt;')}</pre></body></html>`);
    win.document.close(); win.focus(); win.print();
  }

  function saveCurrent() {
    if (!preview || !project) return;
    saveReport({
      id: generateId(),
      projectId: project.id,
      title: preview.title,
      type: 'Project Summary',
      summary: preview.summary,
      sections: preview.sections,
      generatedDate: todayISO(),
    });
    setPreview(null);
  }

  return (
    <div className="space-y-5">
      <Card>
        <h3 className="font-semibold text-white text-sm mb-3 flex items-center gap-2"><Wand2 size={14} /> Generate Report</h3>
        <div className="flex gap-3 flex-wrap">
          <select className="select flex-1 min-w-44 text-sm" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <button className="btn-primary text-sm" onClick={generate} disabled={!project}>
            <Wand2 size={14} /> Generate
          </button>
        </div>
        {preview && (
          <div className="mt-4 space-y-3">
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 max-h-72 overflow-y-auto">
              <h4 className="font-bold text-white text-sm">{preview.title}</h4>
              <p className="text-xs text-slate-400 mt-1 italic">{preview.summary}</p>
              <pre className="text-xs text-slate-400 mt-3 whitespace-pre-wrap font-sans">{preview.sections}</pre>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button className="btn-primary text-sm" onClick={saveCurrent}><Save size={13} /> Save</button>
              <button className="btn-ghost text-sm" onClick={copyReport}><Copy size={13} /> {copied ? 'Copied!' : 'Copy'}</button>
              <button className="btn-ghost text-sm" onClick={printReport}><Printer size={13} /> Print</button>
            </div>
          </div>
        )}
      </Card>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-white">Saved Reports</h3>
        {reports.length === 0 ? (
          <Card className="py-8 text-center text-slate-500 text-sm">No saved reports yet. Generate and save a report above.</Card>
        ) : (
          reports.map((r) => {
            const proj = projects.find((p) => p.id === r.projectId);
            return (
              <Card key={r.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-white text-sm">{r.title}</p>
                    <p className="text-xs text-slate-500">{proj?.name ?? r.projectId} · {formatDate(r.generatedDate)} · {r.type}</p>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2 italic">{r.summary}</p>
                  </div>
                  <button className="btn-ghost p-1.5 text-red-500 shrink-0" onClick={() => setConfirmDel(r)}><Trash2 size={13} /></button>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {confirmDel && (
        <ConfirmDialog
          open={!!confirmDel}
          title="Delete report?"
          message={`Delete "${confirmDel.title}"?`}
          onConfirm={() => { deleteReport(confirmDel.id); setConfirmDel(null); }}
          onCancel={() => setConfirmDel(null)}
        />
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Handover Section
// ────────────────────────────────────────────────────────────
function HandoverSection({ projects, reports, saveReport, deleteReport, data }: {
  projects: typeof data.projects; reports: typeof data.reports;
  saveReport: (r: Report) => void; deleteReport: (id: string) => void;
  data: ReturnType<typeof useAppData>['data'];
}) {
  const [projectId, setProjectId] = useState(projects[0]?.id ?? '');
  const [preview, setPreview] = useState<{ title: string; summary: string; sections: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const handoverReports = reports.filter((r) => r.type === 'Handover');
  const project = projects.find((p) => p.id === projectId);

  function generate() {
    if (!project) return;
    setPreview(generateHandoverReport(data, project));
  }

  function copyReport() {
    if (!preview) return;
    navigator.clipboard?.writeText(`${preview.title}\n\n${preview.summary}\n\n${preview.sections}`).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 1500);
    });
  }

  function printReport() {
    if (!preview) return;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<!doctype html><html><head><title>${preview.title}</title>
      <style>body{font-family:system-ui,sans-serif;max-width:760px;margin:32px auto;padding:0 16px;color:#0f172a;line-height:1.5}
      h1{font-size:20px}pre{white-space:pre-wrap;font-family:inherit;font-size:13px}</style></head>
      <body><h1>${preview.title}</h1><p><em>${preview.summary}</em></p><pre>${preview.sections.replace(/</g, '&lt;')}</pre></body></html>`);
    win.document.close(); win.focus(); win.print();
  }

  function saveCurrent() {
    if (!preview || !project) return;
    saveReport({
      id: generateId(),
      projectId: project.id,
      title: preview.title,
      type: 'Handover',
      summary: preview.summary,
      sections: preview.sections,
      generatedDate: todayISO(),
    });
    setPreview(null);
  }

  return (
    <div className="space-y-5">
      <Card>
        <h3 className="font-semibold text-white text-sm mb-1 flex items-center gap-2"><ScrollText size={14} /> Generate Handover Report</h3>
        <p className="text-xs text-slate-500 mb-3">Comprehensive project handover for future RCCS batches — includes deliverables, event-day items, money, and activity.</p>
        <div className="flex gap-3 flex-wrap">
          <select className="select flex-1 min-w-44 text-sm" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <button className="btn-primary text-sm" onClick={generate} disabled={!project}>
            <Wand2 size={14} /> Generate Handover
          </button>
        </div>
        {preview && (
          <div className="mt-4 space-y-3">
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 max-h-72 overflow-y-auto">
              <h4 className="font-bold text-white text-sm">{preview.title}</h4>
              <p className="text-xs text-slate-400 mt-1 italic">{preview.summary}</p>
              <pre className="text-xs text-slate-400 mt-3 whitespace-pre-wrap font-sans">{preview.sections}</pre>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button className="btn-primary text-sm" onClick={saveCurrent}><Save size={13} /> Save to Library</button>
              <button className="btn-ghost text-sm" onClick={copyReport}><Copy size={13} /> {copied ? 'Copied!' : 'Copy'}</button>
              <button className="btn-ghost text-sm" onClick={printReport}><Printer size={13} /> Print</button>
            </div>
          </div>
        )}
      </Card>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-white">Saved Handover Reports</h3>
        {handoverReports.length === 0 ? (
          <Card className="py-8 text-center text-slate-500 text-sm">No handover reports yet. Generate one above or from Project Overview.</Card>
        ) : (
          handoverReports.map((r) => {
            const proj = projects.find((p) => p.id === r.projectId);
            return (
              <Card key={r.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-white text-sm">{r.title}</p>
                    <p className="text-xs text-slate-500">{proj?.name ?? r.projectId} · {formatDate(r.generatedDate)}</p>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2 italic">{r.summary}</p>
                  </div>
                  <button className="btn-ghost p-1.5 text-red-500 shrink-0" onClick={() => deleteReport(r.id)}><Trash2 size={13} /></button>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Files Section
// ────────────────────────────────────────────────────────────
function FilesSection({ projects, fileLinks, saveFileLink, deleteFileLink, members }: {
  projects: any[]; fileLinks: any[]; saveFileLink: any; deleteFileLink: any; members: any[];
}) {
  const [search, setSearch] = useState('');
  const [projectFilter, setProjectFilter] = useState('All');
  const [modal, setModal] = useState<{ open: boolean; editing?: any }>({ open: false });
  const [confirmDel, setConfirmDel] = useState<any | null>(null);

  const filtered = fileLinks.filter((f: any) => {
    const matchSearch = f.title.toLowerCase().includes(search.toLowerCase());
    const matchProject = projectFilter === 'All' || f.projectId === projectFilter;
    return matchSearch && matchProject;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-44">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input type="text" placeholder="Search files…" className="input pl-9 text-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="select w-44 text-sm" value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)}>
          <option value="All">All Projects</option>
          {projects.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <button className="btn-primary text-sm" onClick={() => setModal({ open: true })}>
          <Plus size={14} /> Add Link
        </button>
      </div>

      {filtered.length === 0 ? (
        <Card className="py-8 text-center text-slate-500 text-sm">No file links found.</Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((f: any) => {
            const proj = projects.find((p: any) => p.id === f.projectId);
            return (
              <Card key={f.id}>
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <a href={f.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-400 hover:underline text-sm flex items-center gap-1">
                      {f.title} <ExternalLink size={11} />
                    </a>
                    <p className="text-xs text-slate-500">{proj?.name ?? f.projectId} · {f.category} · {f.status}</p>
                    {f.owner && <p className="text-xs text-slate-600">{f.owner}</p>}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button className="btn-ghost p-1.5" onClick={() => setModal({ open: true, editing: f })}><FileText size={13} /></button>
                    <button className="btn-ghost p-1.5 text-red-500" onClick={() => setConfirmDel(f)}><Trash2 size={13} /></button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {modal.open && (
        <Modal open={modal.open} title={modal.editing ? 'Edit File Link' : 'Add File Link'} onClose={() => setModal({ open: false })}>
          <FileLinkForm
            projectId={modal.editing?.projectId ?? (projects[0]?.id ?? '')}
            members={members}
            initial={modal.editing}
            onSave={(f: any) => { saveFileLink(f); setModal({ open: false }); }}
            onCancel={() => setModal({ open: false })}
          />
        </Modal>
      )}

      {confirmDel && (
        <ConfirmDialog
          open={!!confirmDel}
          title="Remove file link?"
          message={`Remove "${confirmDel.title}"?`}
          onConfirm={() => { deleteFileLink(confirmDel.id); setConfirmDel(null); }}
          onCancel={() => setConfirmDel(null)}
        />
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Audit Section
// ────────────────────────────────────────────────────────────
function AuditSection({ projects, profile }: { projects: any[]; profile: any }) {
  const { data } = useAppData();
  const [entries, setEntries] = useState<DisplayEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterProject, setFilterProject] = useState('');

  const isAdmin = profile?.role === 'Super Admin' || profile?.role === 'Executive Admin';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (isSupabaseConfigured && supabase) {
        const q = supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(200);
        const { data: rows } = await q;
        if (rows) {
          setEntries(rows.map((r: any) => ({
            id: r.id, actorName: r.actor_profile_id ?? 'System',
            action: r.action, entityType: r.entity_type ?? '',
            summary: r.summary ?? '', projectName: null, createdAt: r.created_at,
          })));
          setLoading(false); return;
        }
      }
      const local = getLocalAuditEntries();
      const mapped: DisplayEntry[] = local.map((e: AuditEntry) => ({
        id: e.id, actorName: e.actorProfileId ?? 'System',
        action: e.action, entityType: e.entityType ?? '',
        summary: e.summary ?? '', projectName: e.projectId ? (projects.find((p: any) => p.id === e.projectId)?.name ?? null) : null,
        createdAt: e.createdAt,
      }));
      setEntries(mapped);
    } finally {
      setLoading(false);
    }
  }, [projects, isAdmin]);

  useEffect(() => { load(); }, [load]);

  const filtered = entries.filter((e) => {
    const matchSearch = e.summary.toLowerCase().includes(search.toLowerCase()) || e.entityType.toLowerCase().includes(search.toLowerCase());
    const matchProject = !filterProject || e.projectName === filterProject;
    return matchSearch && matchProject;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-44">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input type="text" placeholder="Search audit trail…" className="input pl-9 text-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <button className="btn-ghost text-sm" onClick={load}><RefreshCw size={13} /> Refresh</button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-10 bg-slate-800 rounded-lg animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="py-8 text-center text-slate-500 text-sm">No audit entries found.</Card>
      ) : (
        <div className="space-y-1">
          {filtered.map((e) => (
            <div key={e.id} className="flex items-start gap-3 px-3 py-2 rounded-lg hover:bg-slate-800/40 transition-colors">
              <span className={`text-xs font-semibold uppercase tracking-wide shrink-0 w-20 ${ACTION_COLORS[e.action] ?? 'text-slate-400'}`}>{e.action}</span>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-slate-300 truncate">{e.summary}</p>
                {e.projectName && <p className="text-xs text-slate-600">{e.projectName}</p>}
              </div>
              <span className="text-xs text-slate-600 shrink-0">
                {new Date(e.createdAt).toLocaleString('en-GB', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Archives Section
// ────────────────────────────────────────────────────────────
function ArchivesSection({ projects, navigate }: { projects: any[]; navigate: any }) {
  const archived = projects.filter((p: any) => p.status === 'Archived' || p.status === 'Completed');

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-400">Completed and archived projects. All their data remains accessible.</p>
      {archived.length === 0 ? (
        <Card className="py-8 text-center text-slate-500 text-sm">No archived projects. Projects marked as Completed or Archived will appear here.</Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {archived.map((p: any) => (
            <Card key={p.id} onClick={() => navigate(`/projects/${p.id}`)} className="cursor-pointer hover:border-slate-600">
              <p className="font-semibold text-sm text-slate-200">{p.name}</p>
              <p className="text-xs text-slate-500 mt-0.5">{p.status} · {p.year}</p>
              <p className="text-xs text-slate-600 mt-1.5">{p.type}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
